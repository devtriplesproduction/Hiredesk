const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('roles').select('*').limit(1);
  console.log(error ? "ERROR:" + JSON.stringify(error) : "SUCCESS, roles found: " + data.length);
}
run();
