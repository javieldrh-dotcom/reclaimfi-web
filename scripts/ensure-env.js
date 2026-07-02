const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");

const content = `NEXT_PUBLIC_SUPABASE_URL=https://ygfqyhgjkyvrixfcjkgy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZnF5aGdqa3l2cml4ZmNqa2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzQxNDUsImV4cCI6MjA5Nzc1MDE0NX0.Fe74XQlNNW4ZMUH3wnpTZWpMHCD5cKF0bMieT_OAwX0
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, content, "utf8");
  console.log("⚠️  .env.local no existía — se recreó automáticamente.");
} else {
  console.log("✓ .env.local presente.");
}