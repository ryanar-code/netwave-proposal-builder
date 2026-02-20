import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Use anon key directly for public read-only access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch templates (proposals)
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .order('name');

    if (templatesError) throw templatesError;

    // Fetch pricing services grouped by service_type
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_services')
      .select('*')
      .order('service_type, sort_order');

    if (pricingError) throw pricingError;

    // Fetch client profile
    const { data: profileData, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('is_default', true)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    // Format templates for frontend
    const proposals = templates.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      type: 'proposal',
      description: t.description,
      preview: t.content.substring(0, 200),
      hasContent: t.content.length > 0,
      content: t.content,
      metadata: t.metadata
    }));

    // Group pricing by service_type
    const pricingByType = pricingData.reduce((acc, item) => {
      if (!acc[item.service_type]) {
        acc[item.service_type] = [];
      }
      acc[item.service_type].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Format estimates for frontend
    const estimates = Object.entries(pricingByType).map(([serviceType, items]) => ({
      name: serviceType,
      type: 'estimate',
      rows: items.length,
      items: items,
      // Format as CSV-like structure for compatibility
      content: formatAsCsv(items)
    }));

    return NextResponse.json({
      proposals,
      estimates,
      clientProfile: profileData?.content || null,
      summary: {
        totalProposals: proposals.length,
        totalEstimates: estimates.length,
        hasClientProfile: !!profileData,
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

// Helper to format pricing data as CSV for compatibility
function formatAsCsv(items: any[]): string {
  let csv = 'Tier,Line Item,Hours\n';

  items.forEach(item => {
    const tier = item.tier_name || '';
    const lineItem = item.line_item.replace(/,/g, ';'); // Escape commas
    const hours = item.hours || '';
    csv += `${tier},${lineItem},${hours}\n`;
  });

  return csv;
}
