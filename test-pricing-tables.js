const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing table access...');
  
  const { data, error } = await supabase
    .from('service_catalog')
    .select('count');
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! Tables exist.');
  }
}

test();
