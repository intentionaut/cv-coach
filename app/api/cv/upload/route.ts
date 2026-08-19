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
    let content = '';
    let isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // For PDFs, first extract text verbatim
    if (isPDF) {
      const extractMessage = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: Buffer.from(buffer).toString('base64'),
                },
              },
              {
                type: 'text',
                text: 'Extract ALL text from this PDF exactly as written. Return ONLY the extracted text with no additional commentary or formatting.',
              },
            ],
          },
        ],
      });
      const extractedText = extractMessage.content.find(block => block.type === 'text');
      if (extractedText && extractedText.type === 'text') {
        content = extractedText.text;
      }
    } else {
      // For text files, read as UTF-8
      content = Buffer.from(buffer).toString('utf-8');
    }

    // Now use Claude to parse the extracted text into structured data
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
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

    // Check if user already has CV data
    const existing = await db.query(
      `SELECT id FROM cv_data WHERE user_id = $1`,
      [session.user.id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing CV
      result = await db.query(
        `UPDATE cv_data
         SET personal_info = $1, summary = $2, experience = $3, education = $4, skills = $5, projects = $6, updated_at = NOW()
         WHERE user_id = $7
         RETURNING id`,
        [
          JSON.stringify(cvData.contact || {}),
          cvData.summary || '',
          JSON.stringify(cvData.experience || []),
          JSON.stringify(cvData.education || []),
          JSON.stringify(cvData.skills || []),
          JSON.stringify(cvData.projects || []),
          session.user.id
        ]
      );
    } else {
      // Insert new CV
      result = await db.query(
        `INSERT INTO cv_data (user_id, personal_info, summary, experience, education, skills, projects, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          session.user.id,
          JSON.stringify(cvData.contact || {}),
          cvData.summary || '',
          JSON.stringify(cvData.experience || []),
          JSON.stringify(cvData.education || []),
          JSON.stringify(cvData.skills || []),
          JSON.stringify(cvData.projects || [])
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
    console.error('CV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CV', details: error.message },
      { status: 500 }
    );
  }
}
