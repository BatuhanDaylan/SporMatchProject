// Migration runner — supabase/migrations/*.sql dosyalarını sırayla uygular.
// Migration'lar idempotent yazıldığından tekrar çalıştırmak güvenlidir.
//   node supabase/migrate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));

// supabase/.env'den SUPABASE_DB_URL oku (dotenv'siz basit parse)
function readDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const envPath = path.join(here, '.env');
  const txt = fs.readFileSync(envPath, 'utf8');
  const m = txt.match(/^SUPABASE_DB_URL=(.+)$/m);
  if (!m) throw new Error('supabase/.env içinde SUPABASE_DB_URL yok.');
  return m[1].trim();
}

async function main() {
  const connectionString = readDbUrl();
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const dir = path.join(here, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`${files.length} migration bulundu.`);
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    process.stdout.write(`→ ${f} … `);
    try {
      await client.query(sql);
      console.log('OK');
    } catch (e) {
      console.log('HATA');
      console.error(e.message);
      await client.end();
      process.exit(1);
    }
  }
  await client.end();
  console.log('✅ Tüm migration\'lar uygulandı.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
