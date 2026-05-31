/**
 * Download brand logos from Clearbit Logo API.
 * Run once before seeding: node apps/api/prisma/seed/download-assets.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, 'logos');

if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

const BRANDS = [
  { slug: 'apple',     domain: 'apple.com' },
  { slug: 'samsung',   domain: 'samsung.com' },
  { slug: 'sony',      domain: 'sony.com' },
  { slug: 'microsoft', domain: 'microsoft.com' },
  { slug: 'google',    domain: 'google.com' },
  { slug: 'oneplus',   domain: 'oneplus.com' },
  { slug: 'nintendo',  domain: 'nintendo.com' },
  { slug: 'dell',      domain: 'dell.com' },
  { slug: 'lenovo',    domain: 'lenovo.com' },
  { slug: 'hp',        domain: 'hp.com' },
  { slug: 'asus',      domain: 'asus.com' },
  { slug: 'bose',      domain: 'bose.com' },
  { slug: 'nothing',   domain: 'nothing.tech' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  ✓ Already exists: ${path.basename(dest)}`);
      return resolve();
    }

    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    client.get(url, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', (err) => { fs.unlinkSync(dest); reject(err); });
    }).on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading brand logos from Clearbit...\n');

  for (const brand of BRANDS) {
    const url = `https://logo.clearbit.com/${brand.domain}?size=256`;
    const dest = path.join(LOGOS_DIR, `${brand.slug}.png`);
    process.stdout.write(`  ${brand.slug.padEnd(12)}`);
    try {
      await download(url, dest);
      if (!process.stdout.columns) console.log('  ✓');
      else console.log(`  → ${path.basename(dest)}`);
    } catch (e) {
      console.log(`  ✗ Failed: ${e.message}`);
    }
  }

  console.log('\nDone. Logos saved to: apps/api/prisma/seed/logos/');
}

main();
