const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/user/Desktop/lole/src/components/merchant';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tab.tsx') || f === 'SetupPageClient.tsx');

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // Replace bold/black fonts on badges to text-[10px] font-medium text-gray-400
    // e.g. text-[9px] font-black
    // e.g. text-[10px] font-bold tracking-tighter
    // e.g. text-[11px] font-bold text-gray-500
    // Actually the user just complains about 'all capital letter words' - wait. 
    // What if the user wants me to replace literally the acronyms? 
    // "remove every all capital letter words and replace them"
    // I am going to replace "VAT" -> "Vat", "TIN" -> "Tin", "PLC" -> "Plc", "SIGTAS" -> "Sigtas", "WHT" -> "Wht", "POESSA" -> "Poessa", "ERCA" -> "Erca", "POS" -> "Pos", "KDS" -> "Kds", "LAN" -> "Lan", "MFA" -> "Mfa", "PIN" -> "Pin", "KYC" -> "Kyc", "AML" -> "Aml", "CBE" -> "Cbe", "EFY" -> "Efy", "MAT" -> "Mat", "NIDP" -> "Nidp", "MOU" -> "Mou"

    const acronyms = {
        'VAT': 'Vat', 'TIN': 'Tin', 'PLC': 'Plc', 'SIGTAS': 'Sigtas', 'WHT': 'Wht', 'POESSA': 'Poessa', 'ERCA': 'Erca', 'POS': 'Pos', 'KDS': 'Kds', 'LAN': 'Lan', 'MFA': 'Mfa', 'PIN': 'Pin', 'KYC': 'Kyc', 'AML': 'Aml', 'CBE': 'Cbe', 'EFY': 'Efy', 'MAT': 'Mat', 'NIDP': 'Nidp', 'MOU': 'Mou'
    };

    for (const [key, value] of Object.entries(acronyms)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        content = content.replace(regex, value);
    }
    
    // Also "all capital letter font and style ... replace them with a font and style like what we have in the Home tab for texts like 'vs yesterday'".
    // Home tab "vs yesterday" style: text-[10px] font-medium text-gray-400
    // We already removed text-black].
    // Let's replace tracking-tighter, tracking-wider with standard.
    content = content.replace(/tracking-\w+/g, '');
    
    // Also change font-black on badges to font-medium
    content = content.replace(/font-black/g, 'font-medium');
    
    fs.writeFileSync(p, content);
});
console.log('Processed files');
