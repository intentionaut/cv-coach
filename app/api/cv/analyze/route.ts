import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import db from '@/lib/db/client';
import { FILM_THEATRE_SKILLS } from '@/lib/data/film-skills';
import { getUserTier } from '@/lib/auth';
import { getModelForTier } from '@/lib/tier';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const { cvData, targetRole, cvId } = await req.json();

    if (!cvData) {
      return NextResponse.json({ error: 'No CV data provided' }, { status: 400 });
    }

    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }

    const owns = await db.query(`SELECT id FROM cv_data WHERE id = $1 AND user_id = $2`, [
      cvId,
      session.user.id
    ]);
    if (owns.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    // Get all available film/theatre skills for context
    const availableSkills = FILM_THEATRE_SKILLS;

    // Use Claude to analyze the CV and provide improvement suggestions
    const message = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `You are an expert film and theatre industry career coach. Analyze this CV and provide detailed, actionable improvement suggestions to help this candidate build confidence and land their first professional role.

Target Role: ${targetRole || 'Film/Theatre Production'}

Current CV Data:
${JSON.stringify(cvData, null, 2)}

Available Film/Theatre Industry Skills for Reference:
${JSON.stringify(availableSkills, null, 2)}

IMPORTANT: First identify any MISSING essential information (email, phone, location, professional summary) and include tasks to add these in your recommendations.

Please analyze the CV and provide:

1. **Overall Score** (0-100): Rate the CV's effectiveness for film/theatre industry roles
2. **Confidence Boosters**: Identify 3-5 strong points the candidate should feel proud of
3. **Section-by-Section Analysis**:
   - Summary/Objective: Score (0-100) and specific improvements
   - Experience: Score (0-100) and specific improvements for each role
   - Skills: Score (0-100), missing industry-relevant skills, suggestions for better presentation
   - Education: Score (0-100) and how to better highlight relevant coursework/projects
   - Projects: Score (0-100) and suggestions for better storytelling

4. **Priority Improvements**: Top 3-5 changes that will have the biggest impact (MUST include any missing essential contact info or summary as high priority tasks)
5. **Achievement Quantification Prompts**: Questions to help them add measurable details
   - e.g., "What was the budget?" "How many crew members?" "What was the audience size?"
6. **Missing Skills**: Industry-relevant skills they should consider adding (from the skills database)
7. **Formatting & Presentation**: Specific suggestions for visual improvements
8. **Confidence Building**: Specific language changes to make accomplishments sound stronger without exaggerating

Return a JSON object with this structure:
{
  "overallScore": number,
  "confidenceBoosters": ["string"],
  "sections": {
    "summary": { "score": number, "improvements": ["string"] },
    "experience": { "score": number, "improvements": ["string"] },
    "skills": { "score": number, "improvements": ["string"], "missingSkills": ["string"] },
    "education": { "score": number, "improvements": ["string"] },
    "projects": { "score": number, "improvements": ["string"] }
  },
  "priorityImprovements": [
    { "priority": number, "section": "string", "change": "string", "impact": "string" }
  ],
  "quantificationPrompts": [
    { "section": "string", "item": "string", "questions": ["string"] }
  ],
  "formattingTips": ["string"],
  "languageUpgrades": [
    { "current": "string", "suggested": "string", "reason": "string" }
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

    const analysis = JSON.parse(jsonText);

    // Store the full analysis (not just priorityImprovements) so a returning
    // user's session can be rebuilt from the database without another Claude
    // call - re-analyzing on every login was burning API cost for no reason.
    await db.query(
      `INSERT INTO coaching_recommendations (
        user_id, cv_id, type, priority, title, description, action_items, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        session.user.id,
        cvId,
        'cv_analysis',
        'high',
        `CV Analysis for ${targetRole || 'Film/Theatre'}`,
        `Overall Score: ${analysis.overallScore}/100`,
        JSON.stringify(analysis)
      ]
    );

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    console.error('CV analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze CV', details: error.message },
      { status: 500 }
    );
  }
}
