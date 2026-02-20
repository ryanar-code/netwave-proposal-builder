// Migration script: Files → Supabase
// Run: node migrate-to-supabase.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const refDir = path.join(__dirname, 'reference-documents');

async function migrateTemplates() {
  console.log('📄 Migrating proposal templates...');

  const templates = [
    {
      name: 'Website Development - WordPress',
      category: 'website',
      file: 'Proposal_ Client - WordPress Website V2.txt',
      description: 'Custom WordPress website development proposal'
    },
    {
      name: 'Website Development - Squarespace',
      category: 'website',
      file: 'Proposal_ Client - Squarespace Website.txt',
      description: 'Squarespace website development proposal'
    },
    {
      name: 'Website Maintenance & Hosting',
      category: 'maintenance',
      files: [
        'Proposal_ Client - Website Maintenance.txt',
        'Proposal_ Client - Website Hosting and Maintenance.txt'
      ],
      description: 'Website maintenance and hosting services (consolidated)'
    },
    {
      name: 'Website Audit',
      category: 'audit',
      file: 'Proposal_ Client - Website Audit .txt',
      description: 'Comprehensive website audit and recommendations'
    },
    {
      name: 'Brand Identity',
      category: 'branding',
      file: 'Proposal_ Client - Brand Identity.txt',
      description: 'Brand identity development and design'
    },
    {
      name: 'Social Media Audit',
      category: 'audit',
      file: 'Proposal_ Client - Social Media Audit .txt',
      description: 'Social media audit and strategy'
    },
    {
      name: 'Photography Services',
      category: 'media',
      file: 'Proposal_ Client - Photo.txt',
      description: 'Professional photography services'
    },
    {
      name: 'Video Production',
      category: 'media',
      file: 'Proposal_ Client - Video.txt',
      description: 'Video production services'
    },
    {
      name: 'General Project',
      category: 'generic',
      file: 'Proposal_ Client - Project.txt',
      description: 'Generic project proposal template'
    }
  ];

  for (const template of templates) {
    let content = '';

    if (template.file) {
      // Single file
      content = fs.readFileSync(path.join(refDir, template.file), 'utf-8');
    } else if (template.files) {
      // Consolidate multiple files
      const contents = template.files.map(f =>
        fs.readFileSync(path.join(refDir, f), 'utf-8')
      );
      content = contents.join('\n\n--- COMBINED FROM MULTIPLE TEMPLATES ---\n\n');
    }

    const { error } = await supabase.from('templates').insert({
      name: template.name,
      category: template.category,
      content: content,
      description: template.description,
      metadata: { originalFiles: template.files || [template.file] }
    });

    if (error) {
      console.error(`❌ Error inserting ${template.name}:`, error);
    } else {
      console.log(`✅ Migrated: ${template.name}`);
    }
  }
}

async function migratePricing() {
  console.log('\n💰 Migrating pricing tables...');

  // First, clear existing pricing data
  await supabase.from('pricing_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('🗑️  Cleared existing pricing data');

  const pricingFiles = [
    { file: 'Internal Estimate_ Client - Branding.csv', type: 'branding' },
    { file: 'Internal Estimate_ Client - Website.csv', type: 'website' },
    { file: 'Internal Estimate_ CLIENT - SEO I, II, III.csv', type: 'seo' },
    { file: 'Internal Estimate_ Client - Social Media.csv', type: 'social-media' },
    { file: 'Internal Estimate_ Client - Video or Photo.csv', type: 'video-photo' },
    { file: 'Internal Estimate_ Client - Project.csv', type: 'project' }
  ];

  for (const { file, type } of pricingFiles) {
    const csvPath = path.join(refDir, file);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    let sortOrder = 0;
    let tierDescriptions = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parse CSV manually handling quotes
      const cols = parseCSVLine(line);

      // Skip header row (has "Unnamed")
      if (i === 0 || cols[0]?.includes('Unnamed')) {
        // But capture tier headers
        if (cols[0] === 'I') tierDescriptions['I'] = cols[1];
        if (cols[3] === 'II') tierDescriptions['II'] = cols[4];
        if (cols[6] === 'III') tierDescriptions['III'] = cols[7];
        continue;
      }

      // Skip description row (row 2)
      if (i === 1) {
        if (cols[0]) tierDescriptions['I'] = cols[0];
        if (cols[3]) tierDescriptions['II'] = cols[3];
        if (cols[6]) tierDescriptions['III'] = cols[6];
        continue;
      }

      // Parse each tier from the row
      // Tier I: columns 0 (item), 1 (hours)
      // Tier II: columns 3 (item), 4 (hours)
      // Tier III: columns 6 (item), 7 (hours)

      const tiers = [
        { tier: 'I', itemCol: 0, hoursCol: 1 },
        { tier: 'II', itemCol: 3, hoursCol: 4 },
        { tier: 'III', itemCol: 6, hoursCol: 7 }
      ];

      for (const { tier, itemCol, hoursCol } of tiers) {
        const lineItem = cols[itemCol]?.replace(/"/g, '').trim();
        const hoursStr = cols[hoursCol]?.trim();
        const hours = hoursStr && !isNaN(parseFloat(hoursStr)) ? parseFloat(hoursStr) : null;

        // Skip if no line item or if it's metadata
        if (!lineItem || lineItem.length < 3) continue;
        if (lineItem.match(/^(Internal Estimate|Client|Company|TBD|Project)$/i)) continue;

        await supabase.from('pricing_services').insert({
          service_type: type,
          tier_name: tier,
          tier_description: tierDescriptions[tier],
          line_item: lineItem,
          hours: hours,
          sort_order: sortOrder++
        });
      }
    }

    console.log(`✅ Migrated pricing: ${type}`);
  }
}

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

async function migrateClientProfile() {
  console.log('\n👤 Migrating client profile...');

  const profileFile = 'Client Profile_ Client Name.txt';
  const content = fs.readFileSync(path.join(refDir, profileFile), 'utf-8');

  const { error } = await supabase.from('client_profiles').insert({
    template_name: 'Default Client Profile',
    content: content,
    is_default: true
  });

  if (error) {
    console.error('❌ Error inserting client profile:', error);
  } else {
    console.log('✅ Migrated: Client Profile');
  }
}

async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');

  try {
    await migrateTemplates();
    await migratePricing();
    await migrateClientProfile();

    console.log('\n✅ Migration complete!');
    console.log('\n📊 Summary:');
    console.log('  - 9 proposal templates (consolidated from 11)');
    console.log('  - 6 pricing tables');
    console.log('  - 1 client profile');
    console.log('\n🗑️  You can now safely delete reference-documents/ folder');
    console.log('   (or keep as backup)');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  }
}

migrate();
