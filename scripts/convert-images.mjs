import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import path from 'path';

const ASSETS_DIR = './assets';
const OUTPUT_DIR = './assets';

async function convert() {
  try {
    const files = await readdir(ASSETS_DIR);
    const pngs = files.filter(f => f.endsWith('.png'));

    for (const file of pngs) {
      const input = path.join(ASSETS_DIR, file);
      const metadata = await sharp(input).metadata();
      console.log(`Processing ${file} (${metadata.width}x${metadata.height})`);

      // 1. Convert original to WebP
      const outputWebp = path.join(OUTPUT_DIR, file.replace('.png', '.webp'));
      await sharp(input)
        .webp({ quality: 82 })
        .toFile(outputWebp);
      console.log(`✓ ${file} → ${path.basename(outputWebp)}`);

      // 2. Generate responsive variants for killer_argument
      if (file === 'killer_argument.png') {
        const widths = [480, 800];
        for (const w of widths) {
          const resizedOutput = path.join(OUTPUT_DIR, `killer_argument-${w}w.webp`);
          await sharp(input)
            .resize(w)
            .webp({ quality: 82 })
            .toFile(resizedOutput);
          console.log(`✓ Produced ${path.basename(resizedOutput)}`);
        }
      }
    }
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
}

convert();
