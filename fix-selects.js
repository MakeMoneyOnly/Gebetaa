const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/user/Desktop/lole/src/components/merchant';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tab.tsx'));

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    let needsImport = false;
    
    // Replace <select> blocks with ModernSelect
    content = content.replace(/<select[\s\S]*?>([\s\S]*?)<\/select>/g, (match, inner) => {
        needsImport = true;
        // Parse options
        const optionRegex = /<option\s+value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/g;
        let opts = [];
        let optionMatch;
        while ((optionMatch = optionRegex.exec(inner)) !== null) {
            opts.push(`{ value: '${optionMatch[1]}', label: '${optionMatch[2]}' }`);
        }
        return `<ModernSelect options={[ ${opts.join(', ')} ]} />`;
    });

    if (needsImport && !content.includes('ModernSelect')) {
        content = content.replace(
            /(import [^\n]+;\n)(?!import)/, 
            `$1import { ModernSelect } from './ModernSelect';\n`
        );
    }

    // Replace the tag styling:
    // "for the Verified Merchant tag, i don't like the color, it should have our own brand color"
    // e.g. bg-blue-50 text-blue-600 border-blue-100
    // Replace with: bg-[#DDF853] text-black border-[#DDF853]/20
    content = content.replace(/bg-blue-50( px-3 py-1 text-\[11px\] font-bold) text-blue-600 border border-blue-100/g, 'bg-[#DDF853]$1 text-black border border-[#DDF853]/20');
    // For anything similar like Verified Merchant that has bg-blue-50:
    content = content.replace(/bg-blue-50 px-3 py-1 text-\[11px\] font-bold text-blue-600 border border-blue-100/g, 'bg-[#DDF853] px-3 py-1 text-[11px] font-bold text-black border border-[#DDF853]/20');

    fs.writeFileSync(p, content);
});
console.log('Selects replaced');
