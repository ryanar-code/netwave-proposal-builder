import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { currentSOW, prompt, proposal } = await request.json();

    if (!currentSOW || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const editPrompt = `You are editing a Statement of Work document for Netwave Interactive Marketing.

CURRENT SOW:
${currentSOW}

USER'S EDIT REQUEST:
"${prompt}"

Apply the requested changes to the SOW. Return the complete updated SOW document with all changes applied. Maintain professional formatting with markdown headers (# ## ###), bullet points, and proper structure.

Return ONLY the updated SOW content, no explanations or meta-text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: editPrompt
      }]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error editing SOW:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit SOW'
      },
      { status: 500 }
    );
  }
}
