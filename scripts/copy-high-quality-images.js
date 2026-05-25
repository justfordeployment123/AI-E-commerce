const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\6c79ba39-3fcc-4cd9-80fd-d0a100c1617f';
const destBaseDir = path.join(__dirname, '../apps/web/public');

const copies = [
  // Google Pixel
  { src: 'google_pixel_1_1779717168875.png', dest: 'phones/Google/pixel_1.png' },
  { src: 'google_pixel_2_1779717185639.png', dest: 'phones/Google/pixel_2.png' },
  { src: 'google_pixel_3_1779717201703.png', dest: 'phones/Google/pixel_3.png' },

  // OnePlus
  { src: 'phone_1_1779715192194.png', dest: 'phones/OnePlus/oneplus_1.png' },
  { src: 'phone_2_1779715219656.png', dest: 'phones/OnePlus/oneplus_2.png' },
  { src: 'samsung_galaxy_1779714864609.png', dest: 'phones/OnePlus/oneplus_3.png' },

  // iPad / Tablets
  { src: 'ipad_pro_1779715005693.png', dest: 'tablets/ipad/ipad_pro_1.png' },
  { src: 'tablet_1_1779715247562.png', dest: 'tablets/ipad/ipad_pro_2.png' },
  { src: 'tablet_2_1779715277155.png', dest: 'tablets/ipad/ipad_pro_3.png' },

  // Watch
  { src: 'Other/watch/galaxy_watch_promo_1778927696615.png', dest: 'Other/watch/watch_1.png', isFromPublic: true },
  { src: 'Other/watch/galaxy_watch_promo_1778927696615.png', dest: 'Other/watch/watch_2.png', isFromPublic: true },
  { src: 'Other/watch/galaxy_watch_promo_1778927696615.png', dest: 'Other/watch/watch_3.png', isFromPublic: true },
];

copies.forEach(item => {
  const srcPath = item.isFromPublic 
    ? path.join(destBaseDir, item.src)
    : path.join(brainDir, item.src);
    
  const destPath = path.join(destBaseDir, item.dest);
  const destDir = path.dirname(destPath);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${srcPath} -> ${destPath}`);
  } else {
    console.warn(`Source file not found: ${srcPath}`);
  }
});

console.log('Copy operation completed.');
