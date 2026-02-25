/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');

const envs = ['production', 'preview'];
const vars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_dummy_key',
  JWT_SECRET: process.env.JWT_SECRET || 'dummy_jwt_secret_please_update_me_in_vercel',
  HMAC_SECRET: process.env.HMAC_SECRET || 'dummy_hmac_secret_please_update_me_in_vercel',
  QR_HMAC_SECRET: process.env.QR_HMAC_SECRET || 'dummy_qr_hmac_secret_please_update_me_in_vercel',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || 'PASTE_YOUR_SB_SECRET_HERE' // IMPORTANT: Update this with your actual secret key
};

for (const env of envs) {
  for (const [key, value] of Object.entries(vars)) {
    console.log(`Adding ${key} to ${env}...`);
    try {
      fs.writeFileSync('.tmp-val', value);
      // vercel env add [name] [environment]
      // We pipe the file content to stdin
      execSync(`vercel env rm ${key} ${env} -y`, { stdio: 'ignore' }); // Remove old one first if exists
      execSync(`type .tmp-val | vercel env add ${key} ${env}`, { stdio: 'inherit', shell: 'cmd.exe' });
    } catch (e) {
      console.error(`Failed to add ${key} to ${env}:`, e.message);
    }
  }
}
if (fs.existsSync('.tmp-val')) fs.unlinkSync('.tmp-val');
