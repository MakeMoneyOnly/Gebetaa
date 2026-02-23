const { execSync } = require('child_process');
const fs = require('fs');

const envs = ['production', 'preview'];
const vars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://axuegixbqsvztdraenkz.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_xV3cFx219IXO9zJVsvIrDQ_WyvDApiB',
  JWT_SECRET: '34dad80b65a9b247a21a151bbfd8c77db2f6981188876c2aede619dc23c90b5b',
  HMAC_SECRET: '63da3181438f587e2956d8693854674d0d480cd8eaac3f3953f42b938e57542f',
  QR_HMAC_SECRET: 'cadcb4ce98090eda01b58301ab5eb9048b57e1233809021a1cf538d244f713b4'
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
