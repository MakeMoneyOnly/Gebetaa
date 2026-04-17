const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/user/Desktop/lole/src/components/merchant';
const files = ['BusinessInfoTab.tsx', 'FinancialsTab.tsx', 'SecurityTab.tsx', 'LocationsTab.tsx'];

files.forEach(file => {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    
    if (content.includes('ModernSelect') && !content.includes('import { ModernSelect }')) {
        content = content.replace(
            /(import [^\n]+;\n)/, 
            `$1import { ModernSelect } from './ModernSelect';\n`
        );
        fs.writeFileSync(p, content);
    }
});
console.log('Imports added');
