-- Brief Speedrun - Comprehensive Pricing Schema
-- Run this in Supabase SQL Editor

-- =======================
-- 1. SERVICE CATALOG
-- =======================
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_code TEXT UNIQUE,
  category TEXT,
  default_rate NUMERIC NOT NULL,
  billing_unit TEXT DEFAULT 'hour',
  description TEXT,
  is_vendor_service BOOLEAN DEFAULT false,
  vendor_cost NUMERIC,
  markup_multiplier NUMERIC,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 2. PACKAGE TEMPLATES
-- =======================
CREATE TABLE IF NOT EXISTS package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name TEXT NOT NULL,
  package_code TEXT UNIQUE,
  service_type TEXT NOT NULL,
  tier_level TEXT,
  description TEXT,
  total_hours NUMERIC,
  total_cost NUMERIC,
  is_fixed_package BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 3. PACKAGE PHASES
-- =======================
CREATE TABLE IF NOT EXISTS package_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES package_templates(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_number INTEGER,
  description TEXT,
  total_hours NUMERIC,
  total_cost NUMERIC,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 4. PHASE LINE ITEMS
-- =======================
CREATE TABLE IF NOT EXISTS phase_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES package_phases(id) ON DELETE CASCADE,
  service_id UUID REFERENCES service_catalog(id),
  line_item_name TEXT NOT NULL,
  description TEXT,
  hours NUMERIC,
  rate NUMERIC,
  cost NUMERIC,
  is_optional BOOLEAN DEFAULT false,
  deliverables TEXT[],
  revision_rounds INTEGER,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 5. PROPOSALS (Draft Builder)
-- =======================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_type TEXT,
  budget NUMERIC,
  selected_packages UUID[],
  custom_services JSONB,
  adjustments JSONB,
  subtotal NUMERIC,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- 6. PROPOSAL LINE ITEMS (Snapshot)
-- =======================
CREATE TABLE IF NOT EXISTS proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  phase_name TEXT,
  service_name TEXT,
  line_item_name TEXT,
  hours NUMERIC,
  rate NUMERIC,
  cost NUMERIC,
  is_edited BOOLEAN DEFAULT false,
  original_hours NUMERIC,
  original_cost NUMERIC,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- INDEXES
-- =======================
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_package_templates_service_type ON package_templates(service_type);
CREATE INDEX IF NOT EXISTS idx_package_templates_tier ON package_templates(tier_level);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_name);

-- =======================
-- RLS POLICIES
-- =======================
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;

-- Public read for catalog/templates
CREATE POLICY "Allow public read service_catalog" ON service_catalog FOR SELECT USING (true);
CREATE POLICY "Allow public read package_templates" ON package_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read package_phases" ON package_phases FOR SELECT USING (true);
CREATE POLICY "Allow public read phase_line_items" ON phase_line_items FOR SELECT USING (true);

-- Public insert/read/update for proposals
CREATE POLICY "Allow public insert proposals" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read proposals" ON proposals FOR SELECT USING (true);
CREATE POLICY "Allow public update proposals" ON proposals FOR UPDATE USING (true);
CREATE POLICY "Allow public insert proposal_line_items" ON proposal_line_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read proposal_line_items" ON proposal_line_items FOR SELECT USING (true);
CREATE POLICY "Allow public update proposal_line_items" ON proposal_line_items FOR UPDATE USING (true);
