import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jolakpjqgmgeqkvnuona.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbGFrcGpxZ21nZXFrdm51b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDMyMjEsImV4cCI6MjEwNDE3OTIyMX0.ts3ghi9RTrA_WVHXKAqQ7BGb685PczBU3SYirHh6LHQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase.from("candidates").select("*");
    if (error) throw error;
    const shital = data.filter(c => c.name?.toLowerCase().includes("shital") || c.resumeFile?.toLowerCase().includes("shital"));
    console.log(JSON.stringify(shital, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
