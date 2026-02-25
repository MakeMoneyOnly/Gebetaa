/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const b64 = fs.readFileSync('public/splash-bg-opt.webp').toString('base64');
const uri = 'data:image/webp;base64,' + b64;
let c = fs.readFileSync('src/app/(guest)/[slug]/page.tsx', 'utf8');
const start = c.indexOf('src="data:image/webp;base64,');
const end = c.indexOf('"', start + 5);
const nt = c.substring(0, start) + 'src="' + uri + c.substring(end);
fs.writeFileSync('src/app/(guest)/[slug]/page.tsx', nt);
console.log('done');
