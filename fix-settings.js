const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/user/Desktop/lole/src/components/merchant';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tab.tsx') || f === 'SetupPageClient.tsx');

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // 1. Remove border, shadow classes from setting cards, and apply Home card styling
    // Cards usually have 'rounded-3xl border border-gray-100 bg-white' or 'bg-gray-50'
    // We will replace them with 'rounded-4xl border-b border-gray-100 bg-white' 
    // And remove shadow-X classes completely
    
    // First, remove shadows
    content = content.replace(/\bshadow-(sm|md|lg|xl|2xl|inner|none)\b/g, '');
    
    // Cards match: rounded-3xl border border-gray-100 bg-white
    content = content.replace(/rounded-3xl border border-gray-\d+ bg-white/g, 'rounded-4xl border-b border-gray-100 bg-white');
    content = content.replace(/rounded-3xl border border-dashed border-gray-100 bg-gray-50\/30/g, 'rounded-4xl border-b border-dashed border-gray-100 bg-gray-50/30');
    content = content.replace(/rounded-3xl border border-gray-100 bg-gray-50\/50/g, 'rounded-4xl border-b border-gray-100 bg-gray-50/50');
    content = content.replace(/rounded-3xl border bg-white/g, 'rounded-4xl border-b border-gray-100 bg-white');
    
    // 2. Fix inner badges / capital letter styling
    // The home tab 'vs yesterday' style is: text-[10px] font-medium text-gray-400
    content = content.replace(/INTEGRATIONS DOCUMENT CHECKLIST/g, 'Integrations Document Checklist');
    content = content.replace(/uppercase/g, '');

    // 3. Fix the icons: any div that is flex h-?? w-?? items-center justify-center rounded-[xl|lg|3xl|full] bg-[#DDF853] text-...
    // Some are text-black] text-black] text-black
    // clean up any weird text-black] duplicates
    content = content.replace(/text-black\]/g, 'text-black');
    content = content.replace(/(text-black\s+)+/g, 'text-black ');

    // Match bg-[#DDF853] and following text colors and normalize to: bg-[#DDF853] text-black
    content = content.replace(/bg-\[\#DDF853\][^\"]*(text-(black|gray|white|blue|red|amber|green|purple)[a-zA-Z0-9\-\/]*)/g, 'bg-[#DDF853] text-black');
    
    // Also if it lacks text-black completely:
    content = content.replace(/bg-\[\#DDF853\](?![^\"\']*text-black)/g, 'bg-[#DDF853] text-black');

    // Any square shape icon container (rounded-xl or rounded-lg or rounded-3xl) with bg-[#DDF853] should be just rounded-xl bg-[#DDF853] text-black
    content = content.replace(/rounded-(lg|xl|2xl|3xl|4xl)\s+bg-\[\#DDF853\]/g, 'rounded-xl bg-[#DDF853]');

    fs.writeFileSync(p, content);
});
console.log('Processed files');
