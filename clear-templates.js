const fs = require('fs');
const path = require('path');

const base = path.join(process.cwd(), 'src/app/(dashboard)/merchant');

const dirs = [
  'reports', 'foh', 'boh', 'takeout', 'team', 'marketing', 'integrations', 'setup', 'guests', 'menu'
];

dirs.forEach(d => {
  const dirPath = path.join(base, d);
  const filePath = path.join(dirPath, 'page.tsx');
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `export default function Page() {\n  return null;\n}\n`);
  }
});
console.log('Cleared terrible templates');
