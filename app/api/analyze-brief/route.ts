import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientName = formData.get('clientName') as string;
    const budget = Number(formData.get('budget'));
    const projectType = formData.get('projectType') as string;
    const additionalContext = formData.get('additionalContext') as string;

    // Extract text from uploaded files
    const documents: string[] = [];
    const files = formData.getAll('files') as File[];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const text = buffer.toString('utf-8');

        if (text.trim()) {
          documents.push(`--- ${file.name} ---\n${text}\n`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Fetch all packages and services from database
    const { data: packages } = await supabase
      .from('package_templates')
      .select(`
        *,
        package_phases (
          *,
          phase_line_items (*)
        )
      `)
      .order('total_cost');

    const { data: services } = await supabase
      .from('service_catalog')
      .select('*');

    // Build context for Claude
    const packagesContext = packages?.map(pkg => ({
      name: pkg.package_name,
      type: pkg.service_type,
      tier: pkg.tier_level,
      cost: pkg.total_cost,
      hours: pkg.total_hours,
      description: pkg.description,
      isFixed: pkg.is_fixed_package,
      phases: pkg.package_phases?.map((phase: any) => ({
        name: phase.phase_name,
        cost: phase.total_cost,
        items: phase.phase_line_items?.length
      }))
    })) || [];

    const servicesGrouped = services?.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {} as Record<string, any[]>);

    const prompt = `You are a pricing strategist for Netwave Interactive Marketing. Analyze the client's brief and recommend the best approach: either predefined packages OR a custom build with role-based hours.

CLIENT INFORMATION:
- Client: ${clientName}
- Budget: $${budget.toLocaleString()}
- Project Type: ${projectType || 'Not specified'}
- Additional Context: ${additionalContext || 'None'}

UPLOADED DOCUMENTS:
${documents.join('\n\n')}

AVAILABLE PACKAGES:
${JSON.stringify(packagesContext, null, 2)}

AVAILABLE SERVICES BY CATEGORY (for custom builds):
${Object.entries(servicesGrouped || {}).map(([category, svcs]) => `
${category.toUpperCase()}:
${(svcs as any[]).map((s: any) => `  - ${s.service_name}: $${s.default_rate}/${s.billing_unit}`).join('\n')}`).join('\n')}

TASK:
1. Analyze the client's needs from their documents
2. Determine if predefined packages fit OR if a custom build is better
3. If using packages: recommend 1-3 packages that fit their budget
4. If custom build: suggest hours for EVERY role/service listed (use 0 if not needed)
   - This ensures all roles appear in the estimate so they can be manually edited
   - Focus hours on roles needed for this project, but include ALL roles
5. Explain your reasoning and suggest alternatives

Return your response as JSON with this structure:
{
  "usePackages": true or false,
  "packages": [
    {
      "packageId": "...",
      "name": "...",
      "cost": 10000,
      "reason": "Why this fits their needs"
    }
  ],
  "customBuild": {
    "roles": [
      {
        "serviceName": "Creative Design",
        "category": "creative",
        "hours": 40,
        "rate": 150,
        "cost": 6000,
        "reasoning": "Logo design, brand guidelines, and collateral"
      },
      {
        "serviceName": "Photography",
        "category": "production",
        "hours": 0,
        "rate": 250,
        "cost": 0,
        "reasoning": "Not needed for this project"
      }
      // Include ALL services, even if hours are 0
    ],
    "estimatedTotal": 25000
  },
  "reasoning": "Overall analysis of their needs and why you chose packages vs custom",
  "alternatives": "Other options they should consider",
  "suggestedTotal": 15000,
  "budgetAnalysis": "How the suggested total compares to their budget"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks)
    let suggestions;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);
      suggestions = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      suggestions = {
        packages: [],
        reasoning: responseText,
        alternatives: '',
        suggestedTotal: 0
      };
    }

    // Build initial proposal from suggestions
    let proposalPhases: any[] = [];
    let subtotal = 0;

    if (suggestions.usePackages && suggestions.packages?.length > 0) {
      // Build from predefined packages
      const selectedPackages = packages?.filter(pkg =>
        suggestions.packages?.some((sp: any) => pkg.id === sp.packageId || pkg.package_name === sp.name)
      ) || [];

      proposalPhases = selectedPackages.flatMap((pkg, pkgIdx) =>
        pkg.package_phases?.map((phase: any, phaseIdx: number) => ({
          id: `phase-${pkgIdx}-${phaseIdx}`,
          name: phase.phase_name,
          total: phase.total_cost || 0,
          lineItems: phase.phase_line_items?.map((item: any, itemIdx: number) => ({
            id: `item-${pkgIdx}-${phaseIdx}-${itemIdx}`,
            name: item.line_item_name,
            hours: item.hours || 0,
            rate: item.rate || 0,
            cost: item.cost || 0,
            isEdited: false,
            isOptional: item.is_optional
          })) || []
        })) || []
      );

      subtotal = proposalPhases.reduce((sum, phase) =>
        sum + phase.lineItems.reduce((psum: number, item: any) => psum + item.cost, 0), 0
      );
    } else if (suggestions.customBuild?.roles?.length > 0 || !suggestions.usePackages) {
      // Build custom proposal from role-based hours
      // First, create a map of all available services
      const allServicesByCategory = services?.reduce((acc: any, service: any) => {
        const cat = service.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          serviceName: service.service_name,
          category: cat,
          rate: service.default_rate,
          hours: 0,
          cost: 0,
          reasoning: 'Available for manual addition'
        });
        return acc;
      }, {} as Record<string, any[]>) || {};

      // Merge Claude's suggestions with all services (Claude's suggestions override)
      if (suggestions.customBuild?.roles) {
        suggestions.customBuild.roles.forEach((role: any) => {
          const cat = role.category || 'other';
          if (!allServicesByCategory[cat]) allServicesByCategory[cat] = [];

          // Find and update existing service or add new
          const existingIdx = allServicesByCategory[cat].findIndex(
            (s: any) => s.serviceName === role.serviceName
          );

          if (existingIdx >= 0) {
            allServicesByCategory[cat][existingIdx] = {
              ...role,
              hours: role.hours || 0,
              cost: role.cost || (role.hours * role.rate)
            };
          } else {
            allServicesByCategory[cat].push({
              ...role,
              hours: role.hours || 0,
              cost: role.cost || (role.hours * role.rate)
            });
          }
        });
      }

      // Build phases from all services
      proposalPhases = Object.entries(allServicesByCategory).map(([category, roles]: [string, any], catIdx) => {
        const categoryRoles = roles as any[];
        const lineItems = categoryRoles.map((role, roleIdx) => ({
          id: `custom-${catIdx}-${roleIdx}`,
          name: role.serviceName,
          hours: role.hours || 0,
          rate: role.rate || 0,
          cost: role.cost || 0,
          isEdited: false,
          isOptional: false,
          reasoning: role.reasoning
        }));

        return {
          id: `custom-phase-${catIdx}`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Services`,
          total: lineItems.reduce((sum: number, item: any) => sum + item.cost, 0),
          lineItems
        };
      });

      subtotal = proposalPhases.reduce((sum, phase) =>
        sum + phase.lineItems.reduce((psum: number, item: any) => psum + item.cost, 0), 0
      );
    }

    const proposal = {
      id: `proposal-${Date.now()}`,
      clientName,
      projectType,
      budget,
      phases: proposalPhases,
      subtotal,
      discount: 0,
      total: subtotal
    };

    return NextResponse.json({
      success: true,
      suggestions,
      proposal
    });

  } catch (error) {
    console.error('Error analyzing brief:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze brief'
      },
      { status: 500 }
    );
  }
}
