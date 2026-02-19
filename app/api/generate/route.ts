import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientName = formData.get('clientName') as string;
    const projectType = formData.get('projectType') as string;
    const deadline = formData.get('deadline') as string;
    const documentType = formData.get('documentType') as string;

    if (!clientName || !projectType || !deadline || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract text from uploaded files
    const documents: string[] = [];
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one document must be uploaded' },
        { status: 400 }
      );
    }

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.name.endsWith('.pdf')) {
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          text = pdfData.text;
        } else {
          text = buffer.toString('utf-8');
        }

        if (text.trim()) {
          documents.push(`--- ${file.name} ---\n${text}\n`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from any uploaded files' },
        { status: 400 }
      );
    }

    const deadlineDate = new Date(deadline);
    const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get document-specific prompt and token limit
    const { prompt, maxTokens } = getDocumentPrompt(
      documentType,
      clientName,
      projectType,
      formattedDeadline,
      documents.join('\n\n')
    );

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      system: 'You are a proposal generation assistant for Netwave Interactive Marketing. Generate professional, detailed documents in Netwave\'s style.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return NextResponse.json({
      success: true,
      content: content,
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

function getDocumentPrompt(
  documentType: string,
  clientName: string,
  projectType: string,
  deadline: string,
  contextDocs: string
): { prompt: string; maxTokens: number } {

  const baseContext = `CONTEXT DOCUMENTS:
${contextDocs}

CLIENT: ${clientName}
PROJECT TYPE: ${projectType}
DEADLINE: ${deadline}

NETWAVE RATES:
- Account Service/Production: $100/hr
- Creative Direction: $150/hr
- Copywriting: $150/hr
- Design: $150/hr
- Development: $150/hr`;

  switch (documentType) {
    case 'statementOfWork':
      return {
        maxTokens: 4000,
        prompt: `${baseContext}

Generate a STATEMENT OF WORK in Netwave's format:

**Format:**

${projectType}

Client: ${clientName}
Prepared by: Netwave Interactive

**EXECUTIVE SUMMARY**
Write 2-3 paragraphs explaining the importance of this project and how it will help the client.

**RECOMMENDED SERVICES:**
List the services needed (e.g., Copywriting, Website Design, Website Development, SEO, etc.)

**SCOPE OF WORK**
Detail each service with descriptions matching Netwave's professional style.

**ESTIMATE**
Create a detailed table:
Phase | Activity | Description | Team | Hours | Rate | Total

Break down by phases. Use Netwave's rates above.
Show phase subtotals.
**TOTAL PROJECT COST: $X,XXX**

**TERMS & CONDITIONS**
- Estimate valid 30 days, +/- 10%
- Payment: 50% deposit, 25% at key milestone, 25% at completion
- 2 rounds of revisions per phase
- Agency Agreement governs terms

**SIGNATURES**
Client Signature: ___________________
${clientName}                    Date

Agency Signature: ___________________
Netwave Interactive Marketing, Inc.          Date`
      };

    case 'internalBrief':
      return {
        maxTokens: 2000,
        prompt: `${baseContext}

Generate an INTERNAL TEAM BRIEFING for Netwave's team:

**INTERNAL TEAM BRIEFING**
${clientName} - ${projectType}

**CREATIVE BRIEF**
- Project overview and objectives
- Target audience (detailed personas from context)
- Key messages and brand positioning
- Creative direction and tone
- Success metrics

**PROJECT CONTEXT**
- Client background (from uploaded docs)
- Why now? What's driving this?
- Stakeholders and decision makers
- Constraints or sensitivities

**STRATEGIC APPROACH**
- Recommended creative strategy
- Key differentiators to emphasize
- Potential challenges and mitigation
- Opportunities to exceed expectations

**TEAM NOTES**
- Important details for account managers
- Red flags to watch for
- Upsell opportunities`
      };

    case 'timeline':
      return {
        maxTokens: 1500,
        prompt: `${baseContext}

Generate a detailed PROJECT TIMELINE working backward from ${deadline}:

**PROJECT TIMELINE**
${clientName} - ${projectType}

Break down into phases with specific dates:

**Phase 1: Discovery & Planning (Weeks 1-2)**
- Start date
- Activities and milestones
- Client approval gates
- End date

**Phase 2: Design (Weeks X-Y)**
- Deliverables
- Review periods
- Approval gates

**Phase 3: Development/Production (Weeks X-Y)**
- Key activities
- Testing periods
- Client reviews

**Phase 4: Launch (Weeks X-Y)**
- Final preparations
- Launch date: ${deadline}
- Post-launch support

Include buffer time and realistic durations based on ${projectType} projects.`
      };

    case 'kickoffPresentation':
      return {
        maxTokens: 1500,
        prompt: `${baseContext}

Generate an INTERNAL KICKOFF PRESENTATION outline:

**KICKOFF MEETING OUTLINE**
${clientName} - ${projectType}

**MEETING LOGISTICS**
- Attendees needed (roles)
- Duration: 60 minutes
- Format: In-person/Virtual

**AGENDA**
1. Client background (10 min)
2. Project objectives (10 min)
3. Scope review (15 min)
4. Timeline & milestones (10 min)
5. Team roles & responsibilities (10 min)
6. Q&A (5 min)

**KEY TALKING POINTS**

Client Context:
- [Business background]
- [Why they need this]
- [Goals and objectives]

Project Approach:
- [Creative strategy]
- [Technical approach]
- [Success criteria]

Team Roles:
- Account Manager: [responsibilities]
- Creative Director: [responsibilities]
- Designer/Developer: [responsibilities]
- Production: [responsibilities]

**RISKS & CONSIDERATIONS**
- Timeline constraints
- Budget considerations
- Technical challenges
- Client dependencies

**ACTION ITEMS**
Immediate next steps for each team member:
- Account Manager: [tasks]
- Creative: [tasks]
- Development: [tasks]
- Production: [tasks]`
      };

    default:
      return {
        maxTokens: 1000,
        prompt: 'Generate a brief summary.'
      };
  }
}
