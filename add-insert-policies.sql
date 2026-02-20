-- Add INSERT and UPDATE policies to allow migration and editing
-- Run this in Supabase SQL Editor

-- Allow insert access for migration and management
CREATE POLICY "Allow insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert pricing" ON pricing_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert profiles" ON client_profiles FOR INSERT WITH CHECK (true);

-- Allow update access for editing
CREATE POLICY "Allow update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Allow update pricing" ON pricing_services FOR UPDATE USING (true);
CREATE POLICY "Allow update profiles" ON client_profiles FOR UPDATE USING (true);
