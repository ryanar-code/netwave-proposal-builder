-- Brief Speedrun - Reference Data Schema
-- Run this in Supabase SQL Editor

-- Templates table (consolidated proposals)
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'website', 'media', 'branding', 'audit', 'maintenance', 'generic'
  content TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Store any extra info (old filename, version, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing services table (from CSV files)
CREATE TABLE IF NOT EXISTS pricing_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL, -- 'branding', 'website', 'seo', 'social-media', 'video', 'photo'
  tier_name TEXT, -- 'I', 'II', 'III' or null for single-tier services
  tier_description TEXT,
  line_item TEXT NOT NULL,
  hours NUMERIC,
  rate NUMERIC,
  total NUMERIC,
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client profile table
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_pricing_service_type ON pricing_services(service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_tier ON pricing_services(tier_name);

-- Enable RLS (optional - add policies if you want user-based access)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since it's reference data)
CREATE POLICY "Allow public read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Allow public read pricing" ON pricing_services FOR SELECT USING (true);
CREATE POLICY "Allow public read profiles" ON client_profiles FOR SELECT USING (true);

-- Allow insert access for migration and management
CREATE POLICY "Allow insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert pricing" ON pricing_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert profiles" ON client_profiles FOR INSERT WITH CHECK (true);

-- Allow update access for editing
CREATE POLICY "Allow update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Allow update pricing" ON pricing_services FOR UPDATE USING (true);
CREATE POLICY "Allow update profiles" ON client_profiles FOR UPDATE USING (true);
