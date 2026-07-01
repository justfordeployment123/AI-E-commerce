import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DESCRIPTIONS = {
  phones:       'Certified refurbished smartphones with warranty. Every handset is unlocked, tested, and backed by our quality guarantee.',
  tablets:      'Refurbished iPads, Samsung Galaxy Tabs and Surface devices. Fully tested, screen checked, and sold with a warranty.',
  consoles:     'Certified refurbished PlayStation, Xbox and Nintendo consoles. Disc drives tested, HDMI verified, controllers included.',
  laptops:      'Refurbished MacBooks, ThinkPads, Dell XPS and more. Every laptop is battery-tested, keyboard-checked, and ships with a warranty.',
  audio:        'Genuine refurbished headphones, earbuds and speakers. Ultrasonic cleaned, battery-tested, and quality-graded.',
  smartwatches: 'Certified refurbished smartwatches from Apple, Samsung and more. Battery-tested and quality-graded.',
  gaming:       'Pre-owned video games and gaming accessories. Fully tested, disc drives verified, and ready to play.',
  games:        'Pre-owned video games at great prices. Fully tested and ready to play.',
  films:        'Pre-owned Blu-rays and DVDs at brilliant prices.',
};

for (const [slug, desc] of Object.entries(DESCRIPTIONS)) {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) { console.log(`Not found: ${slug}`); continue; }
  if (cat.description) { console.log(`Skipped (already set): ${slug} → "${cat.description}"`); continue; }
  await prisma.category.update({ where: { slug }, data: { description: desc } });
  console.log(`✓ Updated: ${slug}`);
}

await prisma.$disconnect();
