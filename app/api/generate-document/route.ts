import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { type, proposal, clientName, budget } = await request.json();

    if (!type || !proposal) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build proposal summary
    const proposalSummary = `
CLIENT: ${clientName}
BUDGET: $${budget?.toLocaleString() || 'Not specified'}
TOTAL COST: $${proposal.total?.toLocaleString()}

BREAKDOWN BY PHASE:
${proposal.phases?.map((phase: any) => `
${phase.name} - $${phase.total?.toLocaleString()}
${phase.lineItems?.map((item: any) =>
  `  • ${item.name}: ${item.hours}h @ $${item.rate}/hr = $${item.cost?.toLocaleString()}`
).join('\n')}
`).join('\n')}
`;

    let prompt = '';

    if (type === 'sow') {
      prompt = `You are a professional proposal writer for Netwave Interactive Marketing. Generate a comprehensive Statement of Work (SOW) document based on this pricing proposal.

${proposalSummary}

Create a professional SOW document that includes:
1. Project Overview - Brief introduction to the project
2. Scope of Work - Detailed breakdown of deliverables and services by phase
3. Timeline - Estimated project timeline based on hours (assume standard work weeks)
4. Pricing - Complete pricing breakdown matching the proposal
5. Payment Terms - Standard payment terms (e.g., 50% upfront, 50% on completion)
6. Terms & Conditions - Standard terms for this type of project

Make it professional, clear, and ready to send to the client. Use proper formatting with headers, sections, and bullet points.`;
    } else {
      prompt = `You are a professional proposal writer for Netwave Interactive Marketing. Generate a comprehensive Client Brief document based on this pricing proposal.

${proposalSummary}

Create a professional Client Brief that includes:
1. Project Summary - Overview of what will be delivered
2. Objectives - Key goals and outcomes for this project
3. Target Audience - Who this project will serve (infer from services)
4. Deliverables - Detailed list of what will be delivered by phase
5. Success Metrics - How success will be measured
6. Timeline & Milestones - Key project milestones
7. Next Steps - What the client needs to do to get started

Make it client-friendly, exciting, and clear. Use proper formatting with headers, sections, and bullet points.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate document'
      },
      { status: 500 }
    );
  }
}
