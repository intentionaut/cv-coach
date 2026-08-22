// Parses incomplete JSON as it streams in, so the UI can reveal each field
// the moment it's finished rather than waiting for the whole response.
//
// The approach: scan the accumulated text tracking string/escape state and
// the stack of open braces and brackets, trim back any half-written value at
// the tail, then close everything still open and parse that. Anything not yet
// complete simply doesn't appear in the result, so a caller can render
// whatever keys exist and re-render as more arrive.
//
// Deliberately tolerant rather than strict: a partial parse failing is normal
// mid-stream and must never surface as an error.

/** Strips markdown fences and any prose before the first brace. */
function stripToJson(text: string): string {
  let out = text.trim();
  if (out.startsWith('```')) {
    out = out.replace(/^```(?:json)?\n?/, '');
  }
  const first = out.indexOf('{');
  return first === -1 ? '' : out.slice(first);
}

export function parsePartialJson(text: string): Record<string, any> | null {
  const src = stripToJson(text);
  if (!src) return null;

  // A complete document is the common case once the stream finishes.
  try {
    return JSON.parse(src);
  } catch {
    // Expected while still streaming - fall through and repair.
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  // Index just past the last point where the document could be safely closed:
  // i.e. after a completed value, not mid-token.
  let safeEnd = 0;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      if (!inString) safeEnd = i + 1; // a complete string value
      continue;
    }
    if (inString) continue;

    if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}' || ch === ']') {
      stack.pop();
      safeEnd = i + 1;
    } else if (ch === ',') {
      // Everything before the comma is complete; drop the comma itself.
      safeEnd = i;
    } else if (/[0-9truefalsn.eE+-]/.test(ch)) {
      // Part of a number, true/false/null. Only safe once followed by a
      // delimiter, which the branches above handle - so don't move safeEnd
      // here, otherwise a half-written number could be treated as done.
      continue;
    }
  }

  if (stack.length === 0) return null;

  let candidate = src.slice(0, safeEnd);

  // Drop a trailing key that has no value yet - `{"a":1,"b":` or `{"a":1,"b"`.
  // The colon may not have arrived, so it's optional. Only strip when the
  // quoted string sits directly after `,` or `{`, which is what makes it a
  // key rather than a value: after `[` or `:` the same shape is a real value
  // and must be kept.
  candidate = candidate.replace(/([,{])\s*"[^"]*"\s*:?\s*$/, '$1');
  candidate = candidate.replace(/[,{]\s*$/, m => (m.trimEnd() === '{' ? '{' : ''));

  // Re-derive what's still open, since the trims above may have closed some.
  const closers: string[] = [];
  let s = false;
  let esc = false;
  for (const ch of candidate) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { if (s) esc = true; continue; }
    if (ch === '"') { s = !s; continue; }
    if (s) continue;
    if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') closers.pop();
  }

  const repaired = candidate + closers.reverse().join('');

  try {
    const parsed = JSON.parse(repaired);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
