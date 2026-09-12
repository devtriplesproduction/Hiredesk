import { Client } from 'pg';

const connectionString = 'postgres://postgres.jolakpjqgmgeqkvnuona:?kA*TC$mp&xE8!6@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");
    
    // Check if column already exists
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='offers' and column_name='documentData';
    `);
    
    if (checkRes.rows.length === 0) {
      console.log("Adding documentData column to offers table...");
      await client.query(`ALTER TABLE public.offers ADD COLUMN "documentData" JSONB NOT NULL DEFAULT '{}'::jsonb;`);
      console.log("Migration successful.");
    } else {
      console.log("Column documentData already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
