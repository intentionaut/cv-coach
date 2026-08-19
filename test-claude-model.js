// Test script to verify correct Claude model name
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function testModel(modelName) {
  console.log(`\nTesting model: ${modelName}`);
  try {
    const message = await anthropic.messages.create({
      model: modelName,
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: 'Say "Hello"'
      }]
    });
    console.log(`✓ SUCCESS: ${modelName} works!`);
    console.log(`Response: ${message.content[0].text}`);
    return true;
  } catch (error) {
    console.log(`✗ FAILED: ${modelName}`);
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const modelsToTest = [
    'claude-sonnet-5',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-sonnet-4-20241022'
  ];

  console.log('Testing Claude model names...\n');

  for (const model of modelsToTest) {
    await testModel(model);
  }
}

main();
