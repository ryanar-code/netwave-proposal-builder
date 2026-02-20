const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing pricing data...\n');
  
  // Test service catalog
  const { data: services } = await supabase
    .from('service_catalog')
    .select('service_name, default_rate, category')
    .limit(5);
  console.log('✅ Services:', services?.length);
  
  // Test packages
  const { data: packages } = await supabase
    .from('package_templates')
    .select('package_name, total_cost');
  console.log('✅ Packages:', packages?.length);
  packages?.forEach(p => console.log(`   - ${p.package_name}: $${p.total_cost}`));
  
  // Test one package with phases
  const { data: brandingTier1 } = await supabase
    .from('package_templates')
    .select(`
      *,
      package_phases (
        phase_name,
        total_cost,
        phase_line_items (line_item_name)
      )
    `)
    .eq('package_code', 'branding-tier-i')
    .single();
  
  console.log('\n✅ Branding Tier I details:');
  console.log(`   Total: $${brandingTier1.total_cost}`);
  console.log(`   Phases: ${brandingTier1.package_phases?.length}`);
  brandingTier1.package_phases?.forEach(phase => {
    console.log(`   - ${phase.phase_name}: $${phase.total_cost} (${phase.phase_line_items?.length} items)`);
  });
}

test();
