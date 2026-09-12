const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const c = {
    id: "test-" + Date.now(),
    name: "Test User",
    email: "test@example.com",
    phone: "1234567890",
    roleId: "dev-ft",
    roleName: "Web/App Developer",
    score: { skills: 50, exp: 50, edu: 50, completeness: 50, total: 50 },
    status: "new",
    city: "Remote",
    gender: "Not specified",
    age: 25,
    exp: "1 yr",
    education: "B.Tech",
    skills: ["React"],
    resumeFile: "test.pdf",
    resumeUrl: null,
    resumeText: "Test text",
    appliedAt: new Date().toLocaleDateString("en-IN"),
    createdAt: new Date().toISOString(),
    note: ""
  };
  console.log("Inserting...");
  const { data, error } = await supabase.from('candidates').insert([c]).select();
  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}
run();
