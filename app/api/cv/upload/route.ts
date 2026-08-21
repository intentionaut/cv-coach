import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
// Import the internal module directly, not 'pdf-parse' itself - the
// package's index.js has a debug self-test block gated on `!module.parent`
// that misfires under Turbopack's bundling (module.parent isn't set the way
// plain Node CJS sets it) and tries to read a nonexistent test fixture at
// build time. lib/pdf-parse.js is the same function, without that wrapper.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import db from '@/lib/db/client';
import { getUserTier } from '@/lib/auth';
import { getModelForTier, getTierLimits } from '@/lib/tier';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// PDFs need two sequential Claude calls (text extraction, then structured
// parsing) which can exceed Vercel's default function timeout. Without
// this, the platform kills the function before it finishes, with no error
// logged and the UI just hangs.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const cvId = formData.get('cvId') as string | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!cvId && (!name || !name.trim())) {
      return NextResponse.json({ error: 'A name is required for a new CV' }, { status: 400 });
    }

    // Re-uploading into an existing CV must actually belong to this user.
    // Also fetch its stored raw_text as the baseline for change detection.
    let previousRawText: string | null = null;
    if (cvId) {
      const owns = await db.query(`SELECT raw_text FROM cv_data WHERE id = $1 AND user_id = $2`, [
        cvId,
        session.user.id
      ]);
      if (owns.rows.length === 0) {
        return NextResponse.json({ error: 'CV not found' }, { status: 404 });
      }
      previousRawText = owns.rows[0].raw_text;
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    let content = '';
    const fileNameLower = file.name.toLowerCase();
    const isPDF = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDocx = file.type === DOCX_MIME_TYPE || fileNameLower.endsWith('.docx');
    const isPlainText = file.type === 'text/plain' || fileNameLower.endsWith('.txt');

    if (!isPDF && !isDocx && !isPlainText) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, .docx, or .txt file.' },
        { status: 400 }
      );
    }

    // All extraction happens locally now - no Claude call needed just to
    // read a file's text, which also means we can compare against the
    // previous upload before spending anything on Claude.
    if (isPDF) {
      // pdf-parse v1, not v2: v2 depends on @napi-rs/canvas for pdfjs-dist's
      // Node DOMMatrix polyfill, a native addon whose platform binary
      // Vercel's file tracer doesn't reliably include in the deployed
      // Lambda - it works locally (plain node_modules resolution) and
      // crashes at runtime in production. v1 has zero native dependencies.
      const result = await pdfParse(Buffer.from(buffer));
      content = result.text;
    } else if (isDocx) {
      // .docx files are ZIP archives - must be parsed, not read as raw UTF-8 text
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      content = value;
    } else {
      // Plain text files only
      content = Buffer.from(buffer).toString('utf-8');
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Could not extract any text from this file. Please check the file and try again.' },
        { status: 400 }
      );
    }

    // Reject content that's mostly unreadable (e.g. binary data misread as text,
    // corrupted extraction) before sending it to Claude for structured parsing.
    // eslint-disable-next-line no-control-regex
    const controlCharCount = (content.match(/[\x00-\x08\x0E-\x1F�]/g) || []).length;
    if (controlCharCount / content.length > 0.05) {
      return NextResponse.json(
        {
          error:
            'This file could not be read as text — it may be corrupted or in an unsupported format. Please upload a PDF, .docx, or .txt file.'
        },
        { status: 400 }
      );
    }

    // Re-upload with no real change: skip the Claude structuring call
    // entirely rather than silently re-running (and re-billing) an
    // identical CV.
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
    if (cvId && previousRawText !== null && normalize(content) === normalize(previousRawText)) {
      return NextResponse.json({ success: true, unchanged: true });
    }

    // Now use Claude to parse the extracted text into structured data
    const message = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a CV parser. Extract ALL information from this CV into structured JSON.

CV Content:
${content}

Parse ALL the content and populate this JSON structure:

{
  "contact": {
    "name": "full name",
    "email": "email address if present",
    "phone": "phone number if present",
    "location": "location/address if present"
  },
  "summary": "the profile/summary/objective section text - extract the full paragraph",
  "experience": [
    {
      "title": "job title",
      "company": "company/organization name",
      "location": "work location if mentioned",
      "startDate": "start date/year",
      "endDate": "end date/year or 'Present'",
      "description": "combine all description text and bullet points into one paragraph",
      "achievements": []
    }
  ],
  "education": [
    {
      "degree": "degree or certification name",
      "institution": "school/institution name",
      "location": "school location if present",
      "year": "graduation year or date range",
      "details": "any additional details"
    }
  ],
  "skills": ["extract ALL skills mentioned - include technical skills, soft skills, equipment, software, etc."],
  "projects": [
    {
      "title": "project name",
      "role": "role in project",
      "description": "project description",
      "year": "year if mentioned"
    }
  ]
}

IMPORTANT:
- Extract ALL text content from each section
- Combine bullet points into the description field
- Include ALL skills listed (even if under headings like "Key Skills", "Technical Skills", etc.)
- If education is not present, use empty array []
- If projects are not present, use empty array []
- Return ONLY the JSON object, no markdown, no additional text`
        }
      ]
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse Claude's JSON response - strip markdown code fences and extract JSON
    let jsonText = textContent.text.trim();

    // Remove markdown code fences if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
    }

    // Extract just the JSON object (find first { to last })
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    const cvData = JSON.parse(jsonText);

    // Debug: Log extracted CV data
    console.log('Extracted CV data:', JSON.stringify(cvData, null, 2));

    // If parsing produced essentially nothing (no name, no experience, no
    // skills, no education), the source content was unreadable even though
    // it passed earlier checks - don't silently save an empty CV.
    const hasAnyContent =
      !!cvData?.contact?.name ||
      (cvData?.experience?.length ?? 0) > 0 ||
      (cvData?.education?.length ?? 0) > 0 ||
      (cvData?.skills?.length ?? 0) > 0 ||
      !!cvData?.summary;

    if (!hasAnyContent) {
      return NextResponse.json(
        {
          error:
            "We couldn't extract any usable information from this file. Please check that it's a readable CV and try again."
        },
        { status: 400 }
      );
    }

    let result;
    if (cvId) {
      // Re-upload: replace this specific CV's content.
      result = await db.query(
        `UPDATE cv_data
         SET personal_info = $1, summary = $2, experience = $3, education = $4, skills = $5, projects = $6, raw_text = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING id`,
        [
          JSON.stringify(cvData.contact || {}),
          cvData.summary || '',
          JSON.stringify(cvData.experience || []),
          JSON.stringify(cvData.education || []),
          JSON.stringify(cvData.skills || []),
          JSON.stringify(cvData.projects || []),
          content,
          cvId
        ]
      );
    } else {
      // New CV: enforce the plan's CV cap before creating it.
      const { maxCvs } = getTierLimits(tier);
      if (maxCvs !== null) {
        const count = await db.query(`SELECT COUNT(*) FROM cv_data WHERE user_id = $1`, [
          session.user.id
        ]);
        if (Number(count.rows[0].count) >= maxCvs) {
          return NextResponse.json(
            {
              error: `Your plan is limited to ${maxCvs} CV${maxCvs === 1 ? '' : 's'}. Upgrade to add more.`
            },
            { status: 403 }
          );
        }
      }

      result = await db.query(
        `INSERT INTO cv_data (user_id, name, personal_info, summary, experience, education, skills, projects, raw_text, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id`,
        [
          session.user.id,
          (name as string).trim(),
          JSON.stringify(cvData.contact || {}),
          cvData.summary || '',
          JSON.stringify(cvData.experience || []),
          JSON.stringify(cvData.education || []),
          JSON.stringify(cvData.skills || []),
          JSON.stringify(cvData.projects || []),
          content
        ]
      );
    }

    return NextResponse.json({
      success: true,
      cvId: result.rows[0].id,
      data: cvData,
      rawText: content // Return the raw extracted text
    });
  } catch (error: any) {
    // Pull the fields that actually explain the failure (Anthropic SDK
    // status/nested error, Postgres error code/detail) to the top - a plain
    // console.error(label, error) buries these in a generic stack dump.
    console.error('CV upload error:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      anthropicError: error?.error,
      pgCode: error?.code,
      pgDetail: error?.detail,
      stack: error?.stack
    });

    // Surface a clear, actionable message for a low/no Anthropic API credit
    // balance instead of a raw API error dump.
    if (error?.status === 400 && error?.error?.error?.type === 'invalid_request_error') {
      return NextResponse.json(
        { error: 'CV processing is temporarily unavailable. Please try again in a little while.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong while processing your CV. Please try again.', details: error.message },
      { status: 500 }
    );
  }
}
