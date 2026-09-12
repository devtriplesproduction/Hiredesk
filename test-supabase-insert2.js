const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const c = { id: "test-" + Date.now(), name: "Test User", email: "test@example.com", phone: "1234567890", roleId: "dev-ft", roleName: "Web/App Developer", score: {}, status: "new", city: "Remote", gender: "Not specified", age: 25, exp: "1 yr", education: "B.Tech", skills: ["React"], resumeFile: "test.pdf", appliedAt: "now", createdAt: new Date().toISOString(), note: "" };
  console.log("Inserting...");
  const { data, error } = await supabase.from('candidates').insert([c]).select();
  console.log(error ? error : "SUCCESS");
}
run();
