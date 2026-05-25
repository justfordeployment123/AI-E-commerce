const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../apps/api/prisma/downloads');
const destBaseDir = path.join(__dirname, '../apps/web/public');

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory does not exist: ${srcDir}`);
  process.exit(1);
}

const files = fs.readdirSync(srcDir);
let count = 0;

files.forEach(file => {
  if (file === 'products.json') return;
  const srcPath = path.join(srcDir, file);
  
  // Skip if it's a directory
  if (fs.statSync(srcPath).isDirectory()) return;

  let destSubDir = '';

  if (file.startsWith('apple-iphone-')) {
    destSubDir = 'phones/iphone';
  } else if (file.startsWith('samsung-galaxy-')) {
    destSubDir = 'phones/samsung';
  } else if (file.startsWith('apple-ipad-')) {
    destSubDir = 'tablets/ipad';
  } else if (file.startsWith('apple-macbook-')) {
    destSubDir = 'laptops/MacBook';
  } else if (file.startsWith('microsoft-xbox-') || file.startsWith('sony-playstation-') || file.startsWith('sony-dualsense-')) {
    destSubDir = 'consoles';
  } else if (file.startsWith('apple-20w-usb-c-') || file.startsWith('apple-magsafe-') || file.startsWith('apple-pencil-')) {
    destSubDir = 'Other';
  } else {
    // Default fallback
    destSubDir = 'Other';
  }

  const destDir = path.join(destBaseDir, destSubDir);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, file);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${file} -> ${destSubDir}/${file}`);
  count++;
});

console.log(`Successfully copied ${count} images to web/public.`);
