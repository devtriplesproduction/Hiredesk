import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase.from("candidates").select("*");
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Total candidates:", data.length);
  for (const c of data) {
    console.log(`- ${c.name} (File: ${c.resumeFile}) [Score: ${c.score?.total}]`);
  }
}
main();
