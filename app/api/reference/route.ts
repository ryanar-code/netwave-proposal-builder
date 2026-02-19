import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const referenceDir = path.join(process.cwd(), 'reference-documents');

    // Read all files in reference directory
    const files = fs.readdirSync(referenceDir);

    // Categorize files
    const proposals = files
      .filter(f => f.startsWith('Proposal_') && f.endsWith('.txt'))
      .map(f => {
        const content = fs.readFileSync(path.join(referenceDir, f), 'utf-8');
        const name = f.replace('Proposal_ ', '').replace('.txt', '');
        const preview = content.substring(0, 200);

        return {
          name,
          filename: f,
          type: 'proposal',
          preview,
          hasContent: content.length > 0,
          content: content // Full content for generation
        };
      });

    const estimates = files
      .filter(f => f.startsWith('Internal Estimate_') && f.endsWith('.csv'))
      .map(f => {
        const content = fs.readFileSync(path.join(referenceDir, f), 'utf-8');
        const name = f.replace('Internal Estimate_ ', '').replace('.csv', '');
        const rows = content.split('\n').length - 1; // Minus header

        return {
          name,
          filename: f,
          type: 'estimate',
          rows,
          content: content // CSV content for pricing
        };
      });

    // Read client profile
    const clientProfileFile = files.find(f => f.startsWith('Client Profile_') && f.endsWith('.txt'));
    const clientProfile = clientProfileFile
      ? fs.readFileSync(path.join(referenceDir, clientProfileFile), 'utf-8')
      : null;

    return NextResponse.json({
      proposals,
      estimates,
      clientProfile,
      summary: {
        totalProposals: proposals.length,
        totalEstimates: estimates.length,
        hasClientProfile: !!clientProfile,
      }
    });
  } catch (error) {
    console.error('Error loading reference data:', error);
    return NextResponse.json(
      { error: 'Failed to load reference data' },
      { status: 500 }
    );
  }
}
