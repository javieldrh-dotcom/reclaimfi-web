const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env.local no existe. Debes crearlo manualmente con tus credenciales (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY) antes de continuar.");
  process.exit(1);
} else {
  console.log("OK: .env.local presente.");
}