// Migration script: Pricing CSVs → Supabase Comprehensive Schema
// Run: node migrate-pricing-to-supabase.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const refDir = path.join(__dirname, 'reference-documents');

// Helper to parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================
// 1. POPULATE SERVICE CATALOG
// ============================
async function populateServiceCatalog() {
  console.log('\n📋 Populating service catalog...');

  const services = [
    { name: 'Account Service', code: 'account-service', category: 'management', rate: 100 },
    { name: 'Production Management', code: 'production-mgmt', category: 'management', rate: 100 },
    { name: 'Marketing Coordinator', code: 'marketing-coord', category: 'management', rate: 100 },
    { name: 'Consulting', code: 'consulting', category: 'strategy', rate: 175 },
    { name: 'Strategic Planning', code: 'strategic-planning', category: 'strategy', rate: 150 },
    { name: 'Creative Direction', code: 'creative-direction', category: 'creative', rate: 150 },
    { name: 'Creative Design', code: 'creative-design', category: 'creative', rate: 150 },
    { name: 'Website Design', code: 'web-design', category: 'creative', rate: 150 },
    { name: 'Copywriting', code: 'copywriting', category: 'creative', rate: 150 },
    { name: 'Website Development', code: 'web-development', category: 'development', rate: 150 },
    { name: 'Photography', code: 'photography', category: 'production', rate: 250 },
    { name: 'Photography Assistant', code: 'photo-assistant', category: 'production', rate: 100 },
    { name: 'Video Editing', code: 'video-editing', category: 'production', rate: 250 },
    { name: 'Email Campaigns', code: 'email-campaigns', category: 'marketing', rate: 125 },
    { name: 'Social Media', code: 'social-media', category: 'marketing', rate: 125 },
    { name: 'SEO', code: 'seo', category: 'marketing', rate: 125 },
    { name: 'SEO Foundations', code: 'seo-foundations', category: 'marketing', rate: 1198,
      isVendor: true, vendorCost: 599, markup: 2.0, unit: 'month' },
    { name: 'Formulating New Business', code: 'new-business', category: 'strategy', rate: 100 }
  ];

  for (const service of services) {
    const { error } = await supabase.from('service_catalog').insert({
      service_name: service.name,
      service_code: service.code,
      category: service.category,
      default_rate: service.rate,
      billing_unit: service.unit || 'hour',
      is_vendor_service: service.isVendor || false,
      vendor_cost: service.vendorCost || null,
      markup_multiplier: service.markup || null,
      sort_order: services.indexOf(service)
    });

    if (error && !error.message.includes('duplicate')) {
      console.error(`❌ Error inserting ${service.name}:`, error.message);
    }
  }

  console.log(`✅ Populated ${services.length} services`);
}

// ============================
// 2. MIGRATE BRANDING PACKAGES
// ============================
async function migrateBrandingPackages() {
  console.log('\n🎨 Migrating Branding packages...');

  const csvPath = path.join(refDir, 'Internal Estimate_ Client - Branding.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const tiers = [
    { level: 'I', description: 'Ideal for startups or small businesses that need a clean, professional logo and foundational visual identity to get to market quickly.', total: 6050 },
    { level: 'II', description: 'Ideal for established small-to-midsize businesses ready to elevate their brand with more strategic exploration and refined creative development.', total: 10150 },
    { level: 'III', description: 'Ideal for growing businesses that require a robust, scalable brand identity system with expanded creative exploration and versatility across platforms.', total: 14400 }
  ];

  for (const tier of tiers) {
    // Create package
    const { data: pkg, error: pkgError } = await supabase
      .from('package_templates')
      .insert({
        package_name: `Branding Tier ${tier.level}`,
        package_code: `branding-tier-${tier.level.toLowerCase()}`,
        service_type: 'branding',
        tier_level: tier.level,
        description: tier.description,
        total_cost: tier.total,
        is_fixed_package: true
      })
      .select()
      .single();

    if (pkgError) {
      console.error(`❌ Error creating package Tier ${tier.level}:`, pkgError.message);
      continue;
    }

    console.log(`✅ Created Branding Tier ${tier.level}`);

    // Parse phases from CSV
    const phases = [];
    let currentPhase = null;

    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const cols = parseCSVLine(line);
      const tierCol = tier.level === 'I' ? 0 : tier.level === 'II' ? 3 : 6;
      const hoursCol = tierCol + 1;

      const phaseName = cols[tierCol]?.trim();
      const hours = cols[hoursCol] ? parseFloat(cols[hoursCol]) : null;

      // Detect phase headers (have hours)
      if (phaseName && hours && hours > 0) {
        if (currentPhase) {
          phases.push(currentPhase);
        }
        currentPhase = {
          name: phaseName,
          hours: hours,
          cost: hours,
          items: []
        };
      } else if (phaseName && currentPhase) {
        // Add line item to current phase
        currentPhase.items.push(phaseName);
      }
    }
    if (currentPhase) phases.push(currentPhase);

    // Insert phases
    for (let j = 0; j < phases.length; j++) {
      const phase = phases[j];
      const { data: phaseData, error: phaseError } = await supabase
        .from('package_phases')
        .insert({
          package_id: pkg.id,
          phase_name: phase.name,
          phase_number: j + 1,
          total_hours: phase.hours,
          total_cost: phase.cost,
          sort_order: j
        })
        .select()
        .single();

      if (phaseError) {
        console.error(`❌ Error creating phase ${phase.name}:`, phaseError.message);
        continue;
      }

      // Insert line items
      for (let k = 0; k < phase.items.length; k++) {
        await supabase.from('phase_line_items').insert({
          phase_id: phaseData.id,
          line_item_name: phase.items[k],
          sort_order: k
        });
      }
    }
  }
}

// ============================
// 3. MIGRATE SEO PACKAGE
// ============================
async function migrateSEOPackage() {
  console.log('\n🔍 Migrating SEO package...');

  const { data: pkg, error: pkgError } = await supabase
    .from('package_templates')
    .insert({
      package_name: 'SEO Foundations Monthly',
      package_code: 'seo-foundations-monthly',
      service_type: 'seo',
      description: 'Monthly SEO service including local keyword research, Google Business Profile optimization, and ranking tracking',
      total_cost: 1498,
      is_fixed_package: true,
      is_recurring: true,
      recurring_period: 'monthly'
    })
    .select()
    .single();

  if (pkgError) {
    console.error('❌ Error creating SEO package:', pkgError.message);
    return;
  }

  console.log('✅ Created SEO Foundations Monthly');

  // Create single phase
  const { data: phase } = await supabase
    .from('package_phases')
    .insert({
      package_id: pkg.id,
      phase_name: 'Monthly SEO Services',
      phase_number: 1,
      total_cost: 1498,
      sort_order: 0
    })
    .select()
    .single();

  // Get service IDs
  const { data: seoService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'seo-foundations')
    .single();

  const { data: accountService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'account-service')
    .single();

  // Insert line items
  await supabase.from('phase_line_items').insert([
    {
      phase_id: phase.id,
      service_id: seoService.id,
      line_item_name: 'SEO Foundations (High Altitude)',
      rate: 1198,
      cost: 1198,
      description: 'Local keyword research, GBP optimization, monthly posts, ranking tracking',
      sort_order: 0
    },
    {
      phase_id: phase.id,
      service_id: accountService.id,
      line_item_name: 'Account Management',
      hours: 3,
      rate: 100,
      cost: 300,
      sort_order: 1
    }
  ]);
}

// ============================
// 4. MIGRATE SOCIAL MEDIA AUDIT
// ============================
async function migrateSocialMediaAudit() {
  console.log('\n📱 Migrating Social Media Audit...');

  const { data: pkg, error: pkgError } = await supabase
    .from('package_templates')
    .insert({
      package_name: 'Social Media Audit',
      package_code: 'social-media-audit',
      service_type: 'social-media',
      description: 'Comprehensive social media audit with competitive analysis and presentation',
      total_hours: 6,
      total_cost: 725,
      is_fixed_package: true
    })
    .select()
    .single();

  if (pkgError) {
    console.error('❌ Error creating Social Media Audit:', pkgError.message);
    return;
  }

  console.log('✅ Created Social Media Audit');

  const { data: phase } = await supabase
    .from('package_phases')
    .insert({
      package_id: pkg.id,
      phase_name: 'Audit & Presentation',
      phase_number: 1,
      total_hours: 6,
      total_cost: 725,
      sort_order: 0
    })
    .select()
    .single();

  const { data: socialService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'social-media')
    .single();

  const { data: accountService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'account-service')
    .single();

  await supabase.from('phase_line_items').insert([
    {
      phase_id: phase.id,
      service_id: socialService.id,
      line_item_name: 'Social Media Audit',
      hours: 4,
      rate: 125,
      cost: 500,
      sort_order: 0
    },
    {
      phase_id: phase.id,
      service_id: socialService.id,
      line_item_name: 'Audit Presentation',
      hours: 1,
      rate: 125,
      cost: 125,
      sort_order: 1
    },
    {
      phase_id: phase.id,
      service_id: accountService.id,
      line_item_name: 'Presentation Call',
      hours: 1,
      rate: 100,
      cost: 100,
      sort_order: 2
    }
  ]);
}

// ============================
// 5. MIGRATE WEBSITE TEMPLATE
// ============================
async function migrateWebsiteTemplate() {
  console.log('\n🌐 Migrating Website Template...');

  const { data: pkg, error: pkgError } = await supabase
    .from('package_templates')
    .insert({
      package_name: 'Website Development Template',
      package_code: 'website-template',
      service_type: 'website',
      description: 'Customizable website development template for WordPress or Squarespace projects',
      total_hours: 0,
      total_cost: 0,
      is_fixed_package: false
    })
    .select()
    .single();

  if (pkgError) {
    console.error('❌ Error creating Website Template:', pkgError.message);
    return;
  }

  console.log('✅ Created Website Template');

  const phases = [
    { name: 'Phase 1: Discovery & Planning', services: ['account-service', 'creative-direction', 'copywriting'] },
    { name: 'Phase 2: Design', services: ['web-design', 'creative-direction'] },
    { name: 'Phase 3: Development', services: ['web-development'] },
    { name: 'Phase 4: Launch & Training', services: ['account-service', 'production-mgmt'] }
  ];

  for (let i = 0; i < phases.length; i++) {
    const { data: phase } = await supabase
      .from('package_phases')
      .insert({
        package_id: pkg.id,
        phase_name: phases[i].name,
        phase_number: i + 1,
        total_hours: 0,
        total_cost: 0,
        sort_order: i
      })
      .select()
      .single();

    // Add service line items
    for (const serviceCode of phases[i].services) {
      const { data: service } = await supabase
        .from('service_catalog')
        .select('id, service_name, default_rate')
        .eq('service_code', serviceCode)
        .single();

      if (service) {
        await supabase.from('phase_line_items').insert({
          phase_id: phase.id,
          service_id: service.id,
          line_item_name: service.service_name,
          hours: 0,
          rate: service.default_rate,
          cost: 0,
          sort_order: phases[i].services.indexOf(serviceCode)
        });
      }
    }
  }
}

// ============================
// 6. MIGRATE VIDEO/PHOTO TEMPLATE
// ============================
async function migrateVideoPhotoTemplate() {
  console.log('\n📸 Migrating Video/Photo Template...');

  const { data: pkg, error: pkgError } = await supabase
    .from('package_templates')
    .insert({
      package_name: 'Video/Photo Production Template',
      package_code: 'video-photo-template',
      service_type: 'video-photo',
      description: 'Customizable video and photography production template',
      total_hours: 0,
      total_cost: 0,
      is_fixed_package: false
    })
    .select()
    .single();

  if (pkgError) {
    console.error('❌ Error creating Video/Photo Template:', pkgError.message);
    return;
  }

  console.log('✅ Created Video/Photo Template');

  const { data: photoService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'photography')
    .single();

  const { data: photoAssistService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'photo-assistant')
    .single();

  const { data: creativeService } = await supabase
    .from('service_catalog')
    .select('id')
    .eq('service_code', 'creative-direction')
    .single();

  // Pre-Production Phase
  const { data: phase1 } = await supabase
    .from('package_phases')
    .insert({
      package_id: pkg.id,
      phase_name: 'Phase 1: Pre-Production',
      phase_number: 1,
      total_hours: 0,
      total_cost: 0,
      sort_order: 0
    })
    .select()
    .single();

  // Production Phase with shoot options
  const { data: phase2 } = await supabase
    .from('package_phases')
    .insert({
      package_id: pkg.id,
      phase_name: 'Phase 2: Production',
      phase_number: 2,
      total_hours: 0,
      total_cost: 0,
      sort_order: 1
    })
    .select()
    .single();

  await supabase.from('phase_line_items').insert([
    {
      phase_id: phase2.id,
      service_id: photoService.id,
      line_item_name: 'Full-day Photo Shoot (8 hours)',
      hours: 8,
      rate: 250,
      cost: 2000,
      is_optional: true,
      sort_order: 0
    },
    {
      phase_id: phase2.id,
      service_id: photoAssistService.id,
      line_item_name: 'Photography Assistant (8 hours)',
      hours: 8,
      rate: 100,
      cost: 800,
      is_optional: true,
      sort_order: 1
    },
    {
      phase_id: phase2.id,
      service_id: creativeService.id,
      line_item_name: 'Creative Direction (8 hours)',
      hours: 8,
      rate: 100,
      cost: 800,
      is_optional: true,
      sort_order: 2
    },
    {
      phase_id: phase2.id,
      service_id: photoService.id,
      line_item_name: 'Half-day Photo Shoot (4 hours)',
      hours: 4,
      rate: 250,
      cost: 1000,
      is_optional: true,
      sort_order: 3
    }
  ]);
}

// ============================
// 7. MIGRATE PROJECT TEMPLATE
// ============================
async function migrateProjectTemplate() {
  console.log('\n📋 Migrating Custom Project Template...');

  const { data: pkg, error: pkgError } = await supabase
    .from('package_templates')
    .insert({
      package_name: 'Custom Project Template',
      package_code: 'custom-project-template',
      service_type: 'custom',
      description: 'Fully customizable project template - build your own scope',
      total_hours: 0,
      total_cost: 0,
      is_fixed_package: false
    })
    .select()
    .single();

  if (pkgError) {
    console.error('❌ Error creating Project Template:', pkgError.message);
    return;
  }

  console.log('✅ Created Custom Project Template');

  const { data: phase } = await supabase
    .from('package_phases')
    .insert({
      package_id: pkg.id,
      phase_name: 'Available Services',
      phase_number: 1,
      total_hours: 0,
      total_cost: 0,
      sort_order: 0
    })
    .select()
    .single();

  // Add all services as optional line items
  const { data: allServices } = await supabase
    .from('service_catalog')
    .select('id, service_name, default_rate')
    .order('category, service_name');

  for (let i = 0; i < allServices.length; i++) {
    await supabase.from('phase_line_items').insert({
      phase_id: phase.id,
      service_id: allServices[i].id,
      line_item_name: allServices[i].service_name,
      hours: 0,
      rate: allServices[i].default_rate,
      cost: 0,
      is_optional: true,
      sort_order: i
    });
  }
}

// ============================
// MAIN MIGRATION
// ============================
async function migrate() {
  console.log('🚀 Starting comprehensive pricing migration...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing pricing data...');
    await supabase.from('phase_line_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('package_phases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('package_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('service_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    await populateServiceCatalog();
    await migrateBrandingPackages();
    await migrateSEOPackage();
    await migrateSocialMediaAudit();
    await migrateWebsiteTemplate();
    await migrateVideoPhotoTemplate();
    await migrateProjectTemplate();

    console.log('\n✅ Migration complete!');
    console.log('\n📊 Summary:');
    console.log('  - 18 services in catalog');
    console.log('  - 3 branding tier packages');
    console.log('  - 1 SEO monthly package');
    console.log('  - 1 social media audit package');
    console.log('  - 1 website template');
    console.log('  - 1 video/photo template');
    console.log('  - 1 custom project template');
    console.log('\n✨ All pricing data migrated!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  }
}

migrate();
