import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import db from '@/lib/db/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf-8');

    // Use Claude to parse the CV into structured data
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a CV parser for film and theatre industry professionals. Parse this CV and extract structured information.

CV Content:
${content}

Please extract and return a JSON object with the following structure:
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "summary": "string - professional summary or objective",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string or 'Present'",
      "description": "string",
      "achievements": ["array of strings"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "year": "string",
      "details": "string"
    }
  ],
  "skills": ["array of skills"],
  "projects": [
    {
      "title": "string",
      "role": "string",
      "description": "string",
      "year": "string"
    }
  ]
}

Return ONLY the JSON object, no additional text.`
        }
      ]
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse Claude's JSON response
    const cvData = JSON.parse(textContent.text);

    // Store in database
    const result = await db.query(
      `INSERT INTO cv_data (user_id, raw_text, structured_data, file_name, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET raw_text = $2, structured_data = $3, file_name = $4, updated_at = NOW()
       RETURNING id`,
      [session.user.id, content, JSON.stringify(cvData), file.name]
    );

    return NextResponse.json({
      success: true,
      cvId: result.rows[0].id,
      data: cvData
    });
  } catch (error: any) {
    console.error('CV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CV', details: error.message },
      { status: 500 }
    );
  }
}
