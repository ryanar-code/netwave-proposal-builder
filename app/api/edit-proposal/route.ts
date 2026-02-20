import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { proposalId, prompt, currentProposal } = await request.json();

    if (!prompt || !currentProposal) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const claudePrompt = `You are editing a proposal. The user wants to make changes via natural language.

CURRENT PROPOSAL:
${JSON.stringify(currentProposal, null, 2)}

USER'S EDIT REQUEST:
"${prompt}"

TASK:
Modify the proposal according to the user's request. You can:
- Add/remove line items
- Adjust hours or rates
- Add/remove phases
- Recalculate totals

Return the COMPLETE updated proposal as JSON with the same structure. Make sure to:
1. Recalculate all costs (cost = hours * rate)
2. Recalculate phase totals
3. Recalculate subtotal and total
4. Mark edited items with isEdited: true

Return ONLY the JSON, no explanation.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: claudePrompt
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    let updatedProposal;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);
      updatedProposal = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to parse edit response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('Error editing proposal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit proposal'
      },
      { status: 500 }
    );
  }
}
