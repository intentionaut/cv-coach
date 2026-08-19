// Standalone test: exercises the same Claude tool-use call as
// app/api/interview/voice-answer/route.ts, using an already-transcribed
// answer (from Deepgram) as input. Skips Deepgram, auth, and the DB.
//
// Usage: node scripts/test-claude-feedback.js
// Requires ANTHROPIC_API_KEY in the environment (e.g. `source .env.local` first,
// or run via `node -r dotenv/config scripts/test-claude-feedback.js dotenv_config_path=.env.local`)

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const question = 'Why do you want to work in the film industry?';
const question_category = 'Motivation';

const transcript = "Hi. I wanna work in the film industry because I love media, and I think that media's power to delight and entertain and shape culture is really powerful. And it takes a lot of hard work, dedication, and teamwork to do. And those things are things that align with my personal values as a person.";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set in the environment.');
    process.exit(1);
  }

  console.log('Transcript being analyzed:\n', transcript, '\n');

  const feedbackMessage = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    tools: [{
      name: 'submit_feedback',
      description: "Submit structured interview feedback for the candidate's answer",
      input_schema: {
        type: 'object',
        properties: {
          strengths: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } },
          overallImpression: { type: 'string' },
          suggestedRevision: { type: 'string' },
          voiceQualityNotes: { type: 'string' }
        },
        required: ['strengths', 'improvements', 'overallImpression', 'suggestedRevision', 'voiceQualityNotes']
      }
    }],
    tool_choice: { type: 'tool', name: 'submit_feedback' },
    messages: [{
      role: 'user',
      content: `You are an expert film industry interview coach. Analyze this interview answer and provide constructive feedback.

Question: ${question}
Category: ${question_category}

Candidate's Answer (transcribed from voice):
${transcript}

Call submit_feedback with your analysis. For voiceQualityNotes, give brief notes on what you can infer about delivery from the transcript.`
    }]
  });

  const toolUseBlock = feedbackMessage.content.find((block) => block.type === 'tool_use');

  if (!toolUseBlock) {
    console.error('No tool_use block returned. Full response:');
    console.error(JSON.stringify(feedbackMessage.content, null, 2));
    process.exit(1);
  }

  console.log('Parsed aiFeedback:\n');
  console.log(JSON.stringify(toolUseBlock.input, null, 2));
}

main().catch((err) => {
  console.error('Error calling Claude:', err);
  process.exit(1);
});
