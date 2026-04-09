const fs = require('fs');
const path = require('path');

const rootBase = 'c:\\Users\\user\\Desktop\\Gebetaa\\src\\app\\(dashboard)\\merchant';

// The script ran from the wrong directory, and created a nested structure. Let's fix that.
const nestedSrc = path.join(rootBase, 'src', 'app', '(dashboard)', 'merchant');

console.log('Checking nested source at:', nestedSrc);

if (fs.existsSync(nestedSrc)) {
  console.log('Found nested structure, moving to correct root location...');
  const items = fs.readdirSync(nestedSrc);
  for(const item of items) {
    if (item === 'page.tsx') {
        fs.copyFileSync(path.join(nestedSrc, item), path.join(rootBase, item));
        continue;
    }
    const nestedDir = path.join(nestedSrc, item);
    const targetDir = path.join(rootBase, item);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const files = fs.readdirSync(nestedDir);
    for(const f of files) {
      fs.copyFileSync(path.join(nestedDir, f), path.join(targetDir, f));
    }
  }
  fs.rmSync(path.join(rootBase, 'src'), { recursive: true, force: true });
}

const dirsToRemove = [
  'analytics', 'channels', 'tables', 'staff', 'settings', 'orders'
];

dirsToRemove.forEach(d => {
  const dirPath = path.join(rootBase, d);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log('Successfully removed old directory:', d);
    } catch(e) {
      console.log('Error removing: ' + d + ' - ' + e.message);
    }
  }
});
console.log('Fixed scaffold paths and cleaned up.');
