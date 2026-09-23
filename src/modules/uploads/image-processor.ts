import { join } from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { getImagesUploadDir } from '../../common/config/multer.config';

export type ImageVariants = {
  card?: string;
  thumb?: string;
};

export type ProcessedImage = {
  url: string;
  width?: number;
  height?: number;
  variants: ImageVariants;
};

/**
 * Optimize uploaded images: convert to WebP where useful, create card + thumb variants.
 * Falls back to the original file if processing fails.
 */
export async function processUploadedImage(
  filePath: string,
  filename: string,
): Promise<ProcessedImage> {
  const dir = getImagesUploadDir();
  const base = filename.replace(/\.[^.]+$/, '');
  const variants: ImageVariants = {};

  try {
    const image = sharp(filePath);
    const meta = await image.metadata();

    const mainName = `${base}.webp`;
    const mainPath = join(dir, mainName);
    await sharp(filePath)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(mainPath);

    const cardName = `${base}-card.webp`;
    await sharp(filePath)
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(join(dir, cardName));
    variants.card = `uploads/images/${cardName}`;

    const thumbName = `${base}-thumb.webp`;
    await sharp(filePath)
      .rotate()
      .resize({ width: 320, height: 320, fit: 'cover' })
      .webp({ quality: 72 })
      .toFile(join(dir, thumbName));
    variants.thumb = `uploads/images/${thumbName}`;

    // Remove original if we wrote a different main file
    if (filename !== mainName && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }

    return {
      url: `uploads/images/${mainName}`,
      width: meta.width,
      height: meta.height,
      variants,
    };
  } catch {
    return {
      url: `uploads/images/${filename}`,
      variants: {},
    };
  }
}
