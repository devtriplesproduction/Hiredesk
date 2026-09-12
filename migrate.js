const { Client } = require('pg');
const connectionString = 'postgres://postgres:%3FkA%2ATC%24mp%26xE8%216@db.jolakpjqgmgeqkvnuona.supabase.co:5432/postgres';
async function runMigration() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected.');
    await client.query('ALTER TABLE public.offers ADD COLUMN "documentData" JSONB NOT NULL DEFAULT \'{}\'::jsonb;');
    console.log('Migration successful.');
  } catch (err) {
    if (err.message.includes('already exists')) console.log('Column already exists.');
    else console.error(err);
  } finally {
    await client.end();
  }
}
runMigration();
