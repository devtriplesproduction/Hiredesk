const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Authenticating...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@triplesproduction.com",
    password: "TSP@2024"
  });

  if (authError) {
    console.error("AUTH ERROR:", authError);
    return;
  }

  console.log("Authenticated successfully as", authData.user.email);
  console.log("Access token exists:", !!authData.session.access_token);

  const c = {
    id: "test-" + Date.now(),
    name: "Test User Authenticated",
    email: "test_auth@example.com",
    phone: "1234567890",
    roleId: "dev-ft",
    roleName: "Web/App Developer",
    score: { skills: 50, exp: 50, edu: 50, completeness: 50, total: 50 },
    status: "new",
    city: "Remote",
    gender: "Male",
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

  console.log("Inserting candidate...");
  const { data, error } = await supabase.from('candidates').insert([c]).select();
  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
  }
}

run();
