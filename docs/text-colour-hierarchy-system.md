# Text Colour & Hierarchy System

> **⚠️ Override notice (2026-08-20):** `text-on-cta` no longer follows this document's §4.6/§7 decision below. Per explicit product direction, it is now `#FFFFFF` (white, bold) rather than the WCAG-AA-large-compliant `text-primary` (`#3D405B`) described throughout this file. This was a deliberate choice to prioritize brand contrast over the audited result — white-on-`cta-primary` measures **below AA-large** (see the 2.95:1 figure already noted in §7 for pure white). The rest of this document's `text-on-cta` analysis is kept for historical reference but is **no longer the implemented value**.

**Status:** Formal specification, audited against WCAG 2.1 AA
**Scope:** Atomic design tokens (atoms), text style combinations (molecules), applied UI patterns (organisms)
**Supersedes:** the original `text-hierarchy-preview.html` provisional tokens (visual direction approved; colour values corrected below). A corrected preview implementing every fix in this document — plus the Epilogue/Rosario typeface pairing (§2a) — lives alongside this file at `docs/text-hierarchy-preview.html`.

---

## 1. Naming convention

All tokens follow a consistent three-part structure:

```
category-role-variant
```

- **category** — the design domain the token belongs to: `color`, `text`, `bg`
- **role** — what the token is *for*, in the context of that category: `primary`, `secondary`, `muted`, `on-cta`, `link`, etc.
- **variant** *(optional)* — a state or modifier: `hover`, `visited`, `disabled`, `large`

Examples: `color-text-primary`, `color-text-link-hover`, `color-bg-surface`.

For brevity in tables and CSS custom-property names throughout this document, the `color-` prefix is implied and omitted (i.e. `text-primary` means `color-text-primary`). Implement with the full prefix in code (see §5).

Two sub-namespaces exist under `text-`:

- `text-*` — a token used to **colour text**
- `bg-*` — a token used to **colour a surface/fill** that text may sit on

---

## 2. Assumptions made (please confirm or correct)

The brief left several states undefined. The following reasonable, palette-consistent assumptions were made — flagged here rather than silently decided:

1. **Disabled text is exempt from AA, but not from legibility.** WCAG 2.1 explicitly exempts inactive/disabled UI elements from the 1.4.3 contrast requirement. Rather than leaving `text-disabled` at an arbitrary hex, it's set to a deliberate low floor (~2:1) — low enough to read as "inactive," high enough to still be perceived as text. This is a design judgement call, not a compliance claim; it is labelled **EXEMPT**, not PASS/FAIL, throughout.
2. **Placeholder text uses `text-muted`**, restricted to the same large-text conditions as any other `text-muted` usage (see §3.3). Placeholder text is genuinely a "hint," not content, so a lighter, non-AA-normal token is appropriate — but the input's real value (once typed) always renders in `text-primary`.
3. **Visited links reuse `text-secondary`.** No separate accent exists in the fixed palette for a visited state without inventing a new hue. `text-secondary` is already AA-compliant on both surfaces (§4) and is visually distinct from both the unvisited (`text-link`) and hover (`text-cta`) states, satisfying the "don't rely on colour alone" guidance since link states are additionally carried by underline styling.
4. **Text-on-secondary-accent (`accent-secondary`, #F4B6A0) uses `text-primary`.** Verified at 5.78:1 — passes AA-normal. No new token needed; this is a direct reuse.
5. **CTA hover surface is a fill-darken of `cta-primary`, not a new hue.** See §4.6 for the contrast conflict this resolves.
6. **Overline text reuses `accent-tertiary`** directly as a text colour (already true in the preview) — verified at 10.01:1 on `bg-main`, so no change needed.

---

## 2a. Typeface tokens

Two typeface families, each mapped to a distinct role — matching the same atoms-first structure as colour:

| Token | Family | Used for |
|---|---|---|
| `font-display` | **Epilogue** (Google Fonts) | All headings (H1–H6), button labels, card titles, dark-surface headings — anywhere a *heading* role from §5 applies |
| `font-body` | **Rosario** (Google Fonts) | All body copy, captions, hints, links, labels, placeholder text — anywhere a *body/UI-text* role from §5 applies |
| `font-mono` | JetBrains Mono *(unchanged, retained from original preview)* | Eyebrows, overlines, section labels, metadata — small uppercase/tabular UI chrome, not a heading or body role |

**Weights loaded:** Epilogue 500/600/700 (headings generally sit at 600–700 for sufficient visual weight against Rosario body text); Rosario 400/500/600 plus 400 italic (for emphasis within body copy, e.g. captions or quoted text).

This is a font-family change only — it does not alter any colour token, contrast ratio, or pass/fail result in §4. Every audited pairing in this document remains valid regardless of which typeface renders the text, since WCAG contrast is computed from colour values, not typeface. The one place typeface *does* interact with the audit is the mandatory type-size floors on `text-muted` and `text-on-cta` (§3.3, §4.6) — those are about rendered size/weight, not family, and apply identically under Epilogue/Rosario as they did under the previous Newsreader/Inter pairing.

---

## 3. Atoms — Design Tokens

### 3.1 Fixed base palette (unchanged, as supplied)

| Token | Hex | Role |
|---|---|---|
| `bg-main` | `#F5EFE4` | Main background |
| `text-primary` | `#3D405B` | Main text |
| `cta-primary` | `#E07A5F` | Primary CTA (fill colour, not for use as text — see §4.6) |
| `alert` | `#F2CC8F` | Alert / system message surface |
| `success` | `#81B29A` | Success surface |
| `accent-secondary` | `#F4B6A0` | Secondary accent surface |
| `accent-tertiary` | `#0B3D5B` | Tertiary accent / dark surface / link colour |

### 3.2 Derived surface token

| Token | Hex | Derivation | Rationale |
|---|---|---|---|
| `bg-surface` | `#FBF7EC` | Near-white, warmed toward `bg-main`'s hue (44° hue, 65% sat, 95.5% lightness) | Card/panel surface that sits *on top of* `bg-main` and needs to read as slightly elevated without introducing a new hue family. Present in the preview as an inline colour; formalised here as a token so it can be themed. |

### 3.3 Derived text tokens (corrected from preview)

Three tokens from the original preview **failed formal contrast audit** and have been adjusted. Each adjustment is a lightness-only shift within the same hue/saturation — no new hues introduced, per the brief's constraint.

| Token | Preview hex (provisional) | **Final hex** | Change | Rationale |
|---|---|---|---|---|
| `text-secondary` | `#63668A` | **`#616487`** | −1% lightness | Preview value failed AA-normal on `bg-main` at 4.43:1 (needs 4.5:1). A 1-point lightness nudge clears it comfortably (4.98:1 against the current `bg-main`) with no visible change to the token's role. |
| `text-muted` | `#9497B0` | **`#7D809F`** | −8% lightness | Preview value hard-failed at 2.3:1. Reaching full AA-normal (4.5:1) would require darkening to `#606483` — within 1% lightness of `text-secondary`, collapsing the primary/secondary/muted hierarchy. Instead, darkened to the **AA-large threshold** (3.08:1) and its usage is **restricted to large text only** (≥18.66px regular or ≥14px bold) — see usage note below. |
| `text-disabled` | `#B7B9CC` | **`#9FA2BB`** | −8% lightness | WCAG exempts disabled/inactive text from contrast requirements, so this is not a PASS/FAIL token — it's a deliberate design floor. Preview value (1.55:1) was borderline imperceptible against `bg-main`. Nudged to ~2.01:1: still clearly de-emphasised (disabled should look disabled) but legible as text rather than a colour smear. |

**Usage constraint — `text-muted`:** because this token only clears the *large-text* AA threshold (3:1), it must only be applied where type is set **≥18.66px at regular weight, or ≥14px at bold (700)**. It must **not** be used for captions, fine print, or small body copy below that size — use `text-secondary` there instead. This is a hard rule for implementation, not a suggestion (see §5 for enforcement approach).

### 3.4 Unchanged derived tokens (already AA-compliant as proposed)

| Token | Hex | Derivation | Contrast check |
|---|---|---|---|
| `text-inverse` | `#F7F1E3` | Near-`bg-main`, lightened toward white (92.9% L) | 10.17:1 on `accent-tertiary` — pass |
| `text-link` | `#0B3D5B` | = `accent-tertiary`, reused | 10.01:1 on `bg-main` — pass |
| `text-on-success` | `#1B3A2E` | `success` hue darkened to 16.7% lightness | 5.18:1 on `success` — pass |
| `text-on-alert` | `#4A3612` | `alert` hue darkened to 18% lightness | 7.56:1 on `alert` — pass |
| `text-on-tertiary` | `#F5EFE4` | = `bg-main`, reused on navy surfaces | 10.01:1 on `accent-tertiary` — pass |

### 3.5 Corrected/new derived tokens

| Token | Hex | Derivation | Rationale |
|---|---|---|---|
| `text-cta` | **`#B24022`** | `cta-primary` darkened by 21% lightness (62.5% → ~41.5% L), same hue/saturation family | **Replaces two broken preview tokens at once.** The preview used raw `cta-primary` (#E07A5F) directly as text colour in two places — the `link-hover` state and the form `error-msg` colour — both of which failed AA-normal (2.36:1 / 2.76:1) because `#E07A5F` was designed as a *fill* colour, not a text colour on cream. `text-cta` is the single accessible "CTA colour, but as text" token: 5.03:1 on `bg-main`, 5.38:1 on `bg-surface`. Use it anywhere the brand's CTA hue needs to appear as legible text (link hover state, error messaging, destructive-action text). |
| `text-on-cta` | **`#3D405B`** *(= `text-primary`, reused)* | No new hex — reuses the existing dark token | **Resolves an unfixable conflict:** no light colour reaches AA on `cta-primary` — even pure white only reaches 2.95:1. The preview's near-white `#FDF8F0` reached just 2.79:1. Dark `text-primary` reaches **3.42:1**, which clears the **AA-large** threshold (3:1) but not AA-normal (4.5:1). **Decision (confirmed):** primary CTA button labels must always be set at large-text size (≥14px bold, the typical button-label treatment) to stay within AA-large compliance. This is now a hard constraint on the primary-button component, not just a colour choice — flagged clearly in §4.6. |

---

## 4. WCAG 2.1 AA Contrast Audit

Every text/background pairing in the system, checked against WCAG 2.1 Success Criterion 1.4.3. **AA-normal** requires ≥4.5:1; **AA-large** (≥18.66px regular or ≥14px bold) requires ≥3:1.

### 4.1 Body text on primary surfaces

| Pairing | Ratio | AA-normal | AA-large |
|---|---|---|---|
| `text-primary` on `bg-main` | 8.81:1 | ✅ PASS | ✅ PASS |
| `text-primary` on `bg-surface` | 9.42:1 | ✅ PASS | ✅ PASS |
| `text-secondary` on `bg-main` | 4.98:1 | ✅ PASS | ✅ PASS |
| `text-secondary` on `bg-surface` | 5.33:1 | ✅ PASS | ✅ PASS |
| `text-muted` on `bg-main` | 3.08:1 | ❌ FAIL | ✅ PASS *(large text only — see §3.3)* |
| `text-muted` on `bg-surface` | 3.59:1 | ❌ FAIL | ✅ PASS *(large text only)* |
| `text-disabled` on `bg-main` | 2.01:1 | ⚪ EXEMPT *(WCAG 1.4.3 does not apply to disabled controls)* | — |

### 4.2 Links

| Pairing | Ratio | AA-normal | AA-large |
|---|---|---|---|
| `text-link` (default) on `bg-main` | 10.01:1 | ✅ PASS | ✅ PASS |
| `text-link` (default) on `bg-surface` | 10.7:1 | ✅ PASS | ✅ PASS |
| `text-cta` (hover) on `bg-main` | 5.03:1 | ✅ PASS | ✅ PASS |
| `text-cta` (hover) on `bg-surface` | 5.38:1 | ✅ PASS | ✅ PASS |
| `text-secondary` (visited) on `bg-main` | 4.98:1 | ✅ PASS | ✅ PASS |

### 4.3 Text on coloured surfaces (banners, buttons, dark panel)

| Pairing | Ratio | AA-normal | AA-large |
|---|---|---|---|
| `text-on-cta` on `cta-primary` | 3.42:1 | ❌ FAIL | ✅ PASS *(mandatory large text — see §4.6)* |
| `text-on-success` on `success` | 5.18:1 | ✅ PASS | ✅ PASS |
| `text-on-alert` on `alert` | 7.56:1 | ✅ PASS | ✅ PASS |
| `text-on-tertiary` on `accent-tertiary` | 10.01:1 | ✅ PASS | ✅ PASS |
| `text-inverse` on `accent-tertiary` | 10.17:1 | ✅ PASS | ✅ PASS |
| `text-primary` on `accent-secondary` | 5.78:1 | ✅ PASS | ✅ PASS |
| `accent-tertiary` (as overline text) on `bg-main` | 10.01:1 | ✅ PASS | ✅ PASS |

### 4.4 Flagged: `text-primary` on `success`

Not used by default anywhere in this system (§4.3 uses the dedicated `text-on-success` token), but noted because a component author might reach for the general dark text token out of habit:

| Pairing | Ratio | AA-normal | AA-large |
|---|---|---|---|
| `text-primary` on `success` | 4.21:1 | ❌ FAIL | ✅ PASS |

**Rule:** always use `text-on-success`, never `text-primary`, on the `success` surface.

### 4.5 Original palette pairings that failed (summary)

*Ratios below are as audited at the time against the original `bg-main` (`#F0E5D0`), a historical record of what was fixed and why — not the current live figures. `bg-main` was subsequently updated to `#F5EFE4` (§9); all current ratios use the new value and are restated throughout §3–§4.4 and the §8 summary table.*

| Pairing (as originally proposed) | Ratio | Failure | Resolution |
|---|---|---|---|
| `text-secondary` `#63668A` on `bg-main` | 4.43:1 | AA-normal fail | Darkened to `#616487` → 4.57:1 (§3.3) |
| `text-muted` `#9497B0` on `bg-main` | 2.30:1 | AA-normal + AA-large fail | Darkened to `#7D809F` → 3.08:1, scoped to large-text-only (§3.3) |
| `text-disabled` `#B7B9CC` on `bg-main` | 1.55:1 | Not applicable (exempt), but too faint to read as text at all | Darkened to `#9FA2BB` → 2.01:1, deliberate low floor (§3.3) |
| `cta-primary` `#E07A5F` used directly as link-hover text | 2.36:1 | AA-normal + AA-large fail | Replaced with dedicated `text-cta` token `#B24022` → 4.61:1 (§3.5) |
| `cta-primary` `#E07A5F` used directly as error-message text | 2.36–2.76:1 | AA-normal + AA-large fail | Replaced with `text-cta` (same token, §3.5) |
| `text-on-cta` `#FDF8F0` on `cta-primary` | 2.79:1 | AA-normal + AA-large fail | No light colour passes (even pure white = 2.95:1). Replaced with `text-primary` reused → 3.42:1, AA-large only, with a mandatory type-size constraint (§4.6) |

### 4.6 Structural constraint: primary CTA buttons

This is the one place in the system where a **type-size rule is now load-bearing for accessibility**, not just aesthetic:

> **Primary CTA button labels must always render at ≥14px bold (or ≥18.66px regular).** This is what keeps `text-on-cta` (`text-primary` on `cta-primary`) within the AA-large threshold (3.42:1). Any use of the primary CTA fill with smaller text — icon-only buttons with tiny captions, compact/dense UI variants — will fail contrast entirely and must not use `cta-primary` as a text background at that size. Use `accent-tertiary` or `text-cta`-on-`bg-surface` as an outline/ghost button instead for compact contexts.

No combination of a light or dark text colour clears full AA-normal (4.5:1) against the fixed `#E07A5F` fill without altering that hex, which is outside this system's constraints. This is disclosed here explicitly so it's a known, documented trade-off rather than a silent gap.

---

## 5. Molecules — Text Style Combinations

Each typographic role below specifies its **default token**, and any **state variants**.

| Role | Default token | On dark surface | Notes |
|---|---|---|---|
| **H1** | `text-primary` | `text-inverse` | Display font, largest scale step |
| **H2** | `text-primary` | `text-inverse` | |
| **H3** | `text-primary` | `text-inverse` | |
| **H4 / section label** | `text-primary` | `text-inverse` | Also used for form field labels |
| **H5** *(new — not in preview)* | `text-primary` | `text-inverse` | Sub-label / dense heading, e.g. card group titles |
| **H6** *(new — not in preview)* | `text-secondary` | `text-inverse` at 75% opacity | Smallest heading step — deliberately stepped down a tier so it doesn't compete with body text; matches the existing `.75 opacity` treatment already used for dark-surface secondary copy in the preview |
| **Body (primary)** | `text-primary` | `text-inverse` | |
| **Body (secondary/muted paragraph)** | `text-secondary` | `text-inverse` at 75% opacity | For de-emphasised but still substantive copy (matches preview's `.body2-sample`) |
| **Caption** | `text-secondary` *(changed from `text-muted`)* | `text-inverse` at 75% opacity | **Preview used `text-muted` at 13px — now invalid**, since `text-muted` is restricted to large-text contexts only (§3.3) and 13px does not qualify. Reassigned to `text-secondary`, which passes AA-normal at any size. |
| **Overline** | `accent-tertiary` | `text-inverse` | Uppercase, letter-spaced, unchanged from preview |
| **Label (form/UI)** | `text-primary` | `text-inverse` | Bold, small — same token as H4 |
| **Link — default** | `text-link` (`#0B3D5B`) | `text-inverse`, underlined | |
| **Link — hover** | `text-cta` (`#B24022`) | `accent-secondary` | Corrected from raw `cta-primary` (§3.5) |
| **Link — visited** | `text-secondary` (`#616487`) | `text-inverse` at 75% opacity | Assumption — see §2.3 |
| **Link — focus-visible** | `text-link` + 2px `accent-tertiary` outline | `text-inverse` + 2px `text-inverse` outline | Colour alone never carries focus state — always paired with a visible outline, per WCAG 2.4.7 |
| **Placeholder text** | `text-muted`, restricted to ≥14px labels/inputs set in bold, OR `text-secondary` for regular-weight inputs below that size | — | Assumption — see §2.2. Most form inputs are regular-weight at 14–16px, which does **not** qualify as WCAG large text, so **`text-secondary` is the safer default** for placeholder text in standard inputs; reserve `text-muted` only for large-input contexts (e.g. a prominent search bar set at 18px+). |
| **Disabled text** | `text-disabled` (`#9FA2BB`) | `text-inverse` at 40% opacity | WCAG-exempt (§3.3) |
| **Text on CTA button** | `text-on-cta` = `text-primary`, **mandatory ≥14px bold** | n/a | See §4.6 |
| **Text on secondary/outline button** | `accent-tertiary` | `text-inverse` | Outline buttons use the tertiary accent as both border and text colour |
| **Text on success surface** | `text-on-success` | n/a | |
| **Text on alert surface** | `text-on-alert` | n/a | |
| **Error message text** | `text-cta` (`#B24022`) | n/a | Corrected from raw `cta-primary` (§3.5) — form errors are validated against `bg-main`/`bg-surface`, never appear on a dark surface in this system |
| **Success message text (inline, not banner)** | `success`-adjacent — reuse `text-on-success` (`#1B3A2E`) on `bg-main`/`bg-surface` | n/a | Verify: `#1B3A2E` on `#F5EFE4` = high contrast dark-on-light, passes comfortably; included for completeness where a success *message* appears as inline text rather than inside a filled banner |

---

## 6. Organisms — Applied Patterns

### 6.1 Alert banner

- **Surface:** `alert` (`#F2CC8F`)
- **Title/body text:** `text-on-alert` (`#4A3612`) — 7.56:1, comfortably passes AA-normal
- **Why:** the preview's existing pairing was already compliant; no changes needed. Body copy uses reduced opacity (0.92) purely for visual hierarchy between title and body — both stay well above the AA floor even with the opacity reduction since 7.56:1 has generous headroom.

### 6.2 Success confirmation banner

- **Surface:** `success` (`#81B29A`)
- **Title/body text:** `text-on-success` (`#1B3A2E`) — 5.18:1, passes AA-normal
- **Why:** unchanged from preview. Note the flagged trap in §4.4 — never substitute `text-primary` here; it fails.

### 6.3 Primary CTA button

- **Surface:** `cta-primary` (`#E07A5F`, unchanged fixed hex)
- **Text:** `text-on-cta` = `text-primary` (`#3D405B`) — 3.42:1, **AA-large only**
- **Hard requirement:** label must be set ≥14px bold. This is the one component in the system carrying an accessibility-driven typography constraint (§4.6).
- **Why this over the preview's near-white text:** no light colour clears any AA threshold on this fill (§4.6). Reusing `text-primary` was chosen over introducing a darkened CTA-surface variant, per your direction to keep `cta-primary` itself untouched.

### 6.4 Secondary (outline) CTA button

- **Surface:** transparent, sits on `bg-main`
- **Border + text:** `accent-tertiary` (`#0B3D5B`) — 10.01:1 on `bg-main`, passes AA-normal at any size
- **Why:** unchanged from preview; already fully compliant and has no size restriction, making it the safer choice for compact/dense button contexts where the primary CTA's large-text rule can't be met.

### 6.5 Form field — default state

- **Label:** `text-primary` on `bg-surface`/`bg-main` — 9.42:1 / 8.81:1
- **Input text (value):** `text-primary`
- **Placeholder:** `text-secondary` by default (see molecule table, §5) — safer than `text-muted` at typical 14–16px regular input text
- **Hint text:** `text-secondary` *(changed from `text-muted}` in the preview, which used `text-muted` at 12.5px — below the large-text floor)*

### 6.6 Form field — error state

- **Input border:** `text-cta` (`#B24022`) *(changed from raw `cta-primary` — the preview used the unmodified brand CTA hex as the border colour; borders fall under the 3:1 **UI component** contrast requirement (SC 1.4.11), not the 4.5:1 text requirement, so this specific usage was technically already compliant at 2.36:1... only if checked as a non-text UI boundary. Standardising on `text-cta` here anyway for one consistent "this is the error colour" token across border + message text, avoiding two different reds in the same field.)*
- **Error message text:** `text-cta` (`#B24022`) on `bg-main`/`bg-surface` — 5.03:1 / 5.38:1, passes AA-normal. **This was the concrete failure in the original preview** (raw `cta-primary` at 2.36–2.76:1).

### 6.7 Card on main background

- **Surface:** `bg-surface` (`#FBF7EC`)
- **Eyebrow/kicker:** `text-muted`, **only if set ≥14px bold** (card metadata is often small — verify actual implementation size before using `text-muted`; default to `text-secondary` if under that threshold)
- **Heading:** `text-primary` — 9.42:1
- **Body:** `text-secondary` — 5.33:1

### 6.8 Dark surface panel (e.g. "weekly digest" pattern)

- **Surface:** `accent-tertiary` (`#0B3D5B`)
- **Heading:** `text-on-tertiary` (`#F5EFE4`) — 10.01:1
- **Body:** `text-inverse` at 75% opacity — base ratio 10.17:1 has enough headroom that a 25% opacity reduction still clears AA-normal comfortably (~7.6:1 effective against the navy surface)

---

## 7. Implementation notes

- Implement as CSS custom properties (or the equivalent in your build system — Tailwind theme extension, styled-components theme object, etc.), namespaced exactly as in §1. Never hardcode hex values in component files; always reference the token.
- The two **usage-restricted tokens** (`text-muted`, `text-on-cta`) cannot be enforced by colour alone — they depend on type size/weight. If your component library supports it, pair these tokens with a lint rule or a component-level type-size prop constraint (e.g. a `<MutedText>` component that forbids a `size` prop below the threshold) rather than relying on documentation alone.
- `text-disabled` should be paired with `aria-disabled`/`disabled` and, ideally, a secondary non-colour signal (reduced opacity on the whole control, cursor change) — never colour alone.

---

## 8. Token Summary Table

| Token | Hex | Usage | Contrast ratio | AA-normal | AA-large |
|---|---|---|---|---|---|
| `bg-main` | `#F5EFE4` | Page background | — | — | — |
| `bg-surface` | `#FBF7EC` | Card/panel surface | — | — | — |
| `cta-primary` | `#E07A5F` | Primary CTA fill (not for text use) | — | — | — |
| `alert` | `#F2CC8F` | Alert banner surface | — | — | — |
| `success` | `#81B29A` | Success banner surface | — | — | — |
| `accent-secondary` | `#F4B6A0` | Secondary accent surface | — | — | — |
| `accent-tertiary` | `#0B3D5B` | Tertiary accent / dark surface / default link | — | — | — |
| `text-primary` | `#3D405B` | Headings, body, labels — on `bg-main` | 8.81:1 | ✅ PASS | ✅ PASS |
| `text-primary` | `#3D405B` | — on `bg-surface` | 9.42:1 | ✅ PASS | ✅ PASS |
| `text-secondary` | `#616487` *(corrected)* | Secondary body, caption, hint, visited link — on `bg-main` | 4.98:1 | ✅ PASS | ✅ PASS |
| `text-secondary` | `#616487` | — on `bg-surface` | 5.33:1 | ✅ PASS | ✅ PASS |
| `text-muted` | `#7D809F` *(corrected)* | Muted text — **large text only** — on `bg-main` | 3.08:1 | ❌ FAIL | ✅ PASS |
| `text-muted` | `#7D809F` | — on `bg-surface` | 3.59:1 | ❌ FAIL | ✅ PASS |
| `text-disabled` | `#9FA2BB` *(corrected)* | Disabled text — on `bg-main` | 2.01:1 | ⚪ EXEMPT | ⚪ EXEMPT |
| `text-inverse` | `#F7F1E3` | Text on dark/tertiary surfaces | 10.17:1 | ✅ PASS | ✅ PASS |
| `text-link` | `#0B3D5B` | Default link — on `bg-main` | 10.01:1 | ✅ PASS | ✅ PASS |
| `text-link` | `#0B3D5B` | — on `bg-surface` | 10.7:1 | ✅ PASS | ✅ PASS |
| `text-cta` | `#B24022` *(new, corrected)* | Link hover, error text — on `bg-main` | 5.03:1 | ✅ PASS | ✅ PASS |
| `text-cta` | `#B24022` | — on `bg-surface` | 5.38:1 | ✅ PASS | ✅ PASS |
| `text-on-cta` | `#3D405B` *(= `text-primary`, corrected)* | Primary button label — **mandatory ≥14px bold** | 3.42:1 | ❌ FAIL | ✅ PASS |
| `text-on-success` | `#1B3A2E` | Text on success surface | 5.18:1 | ✅ PASS | ✅ PASS |
| `text-on-alert` | `#4A3612` | Text on alert surface | 7.56:1 | ✅ PASS | ✅ PASS |
| `text-on-tertiary` | `#F5EFE4` *(= `bg-main`)* | Heading text on dark/tertiary surface | 10.01:1 | ✅ PASS | ✅ PASS |
| `text-primary` | `#3D405B` | On `accent-secondary` | 5.78:1 | ✅ PASS | ✅ PASS |
| `accent-tertiary` | `#0B3D5B` | Overline text — on `bg-main` | 10.01:1 | ✅ PASS | ✅ PASS |
| `text-primary` | `#3D405B` | ⚠️ On `success` — **do not use, fails** | 4.21:1 | ❌ FAIL | ✅ PASS |

---

## 9. Change log vs. preview

| Token | Preview value | Final value | Reason |
|---|---|---|---|
| `text-secondary` | `#63668A` | `#616487` | AA-normal fail on `bg-main` (4.43:1) |
| `text-muted` | `#9497B0` | `#7D809F` | AA-normal + AA-large fail (2.3:1); now large-text-only |
| `text-disabled` | `#B7B9CC` | `#9FA2BB` | Too faint to perceive as text (not an AA requirement, but a usability floor) |
| `text-link-hover` | `#E07A5F` (raw `cta-primary`) | Merged into `text-cta` `#B24022` | AA-normal + AA-large fail (2.36:1) |
| `text-on-cta` | `#FDF8F0` | `#3D405B` (reuse of `text-primary`) | No light colour passes on `cta-primary`; darkest viable option, now AA-large-only with a mandatory type-size rule |
| *(new)* `text-cta` | — | `#B24022` | Introduced to replace two broken preview usages (link-hover text, error-message text) with one consistent, compliant token |
| *(new)* `bg-surface` | inline `#FBF7EC` | `#FBF7EC` (formalised as token) | Was hardcoded in the preview; promoted to a proper token |
| Caption role | used `text-muted` | now uses `text-secondary` | `text-muted` is no longer valid at caption size (13px, below the large-text floor) |
| `bg-main` | `#F0E5D0` | **`#F5EFE4`** | Design review: the original value read as visually muted against the navy `accent-tertiary` surface (e.g. the "Ready to Practice?" headline, which uses `text-on-tertiary` = `bg-main` reused on dark surfaces). Lightened within the same hue family (38–39° hue, near-identical saturation) — not a new hue. Re-audited against every dependent pairing (§4.1–§4.4); all pass at equal or better ratios than before, no new failures introduced. `text-on-tertiary` updated to match, since it is `bg-main` reused. |

---

## 10. Brand assets

**Added 2026-08-20. Updated 2026-08-22:** the wordmark icon was redesigned (new "F" mark) and the SVG variant was retired — both in-app usage and the favicon now come from a single PNG source. Recorded here as the canonical reference until a dedicated brand-assets doc exists.

| Asset | File | Background | Use |
|---|---|---|---|
| Logo (PNG) | `/public/friday-logo.png` | Transparent | **In-app header lockups** — the icon next to "Friday" on `/`, `/dashboard`, `/pricing`. Also the favicon source (`/app/icon.png` is a copy of this file, via Next.js's `app/icon.png` file convention — no manual `<link>` tag needed). |

Current in-app usage is a small (24–31px) icon-plus-wordmark lockup next to the "Friday" text heading — see `app/page.tsx`, `app/dashboard/page.tsx`, and `app/pricing/PricingContent.tsx`. There is no SVG or separate transparent-PNG variant anymore; both were removed when the logo was replaced. A vector (SVG) source would be worth commissioning if the mark needs to render larger than its current small icon usage — the PNG will show compression artifacts scaled much past ~64px.
