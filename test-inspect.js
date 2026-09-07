const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspect() {
  console.log("Checking candidates...");
  const res1 = await supabase.from('candidates').select('*').limit(1);
  console.log("Candidates Error:", res1.error);
  console.log("Candidates Data:", res1.data);

  console.log("\nChecking roles...");
  const res2 = await supabase.from('roles').select('*').limit(1);
  console.log("Roles Error:", res2.error);
  console.log("Roles Data:", res2.data);

  console.log("\nChecking contracts...");
  const res3 = await supabase.from('contracts').select('*').limit(1);
  console.log("Contracts Error:", res3.error);
  console.log("Contracts Data:", res3.data);
}

inspect();
