import { Logger } from "@nestjs/common";
import { join } from "path";
import * as fs from "fs";
import { getImagesUploadDir } from "../../common/config/multer.config";
import type { ImageVariants, ProcessedImage } from "./image-types";

export type { ImageVariants, ProcessedImage } from "./image-types";

const logger = new Logger("ImageProcessor");

/**
 * Resize and convert uploaded images to WebP. Sharp is optional; if it
 * fails or is not installed, the original file is kept.
 */
export async function processUploadedImage(
  filePath: string,
  filename: string,
): Promise<ProcessedImage> {
  const dir = getImagesUploadDir();
  const base = filename.replace(/\.[^.]+$/, "");
  const variants: ImageVariants = {};

  try {
    const sharp = (await import("sharp")).default;
    const image = sharp(filePath);
    const meta = await image.metadata();

    const mainName = `${base}.webp`;
    const mainPath = join(dir, mainName);
    await sharp(filePath)
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(mainPath);

    const cardName = `${base}-card.webp`;
    await sharp(filePath)
      .rotate()
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toFile(join(dir, cardName));
    variants.card = `uploads/images/${cardName}`;

    const thumbName = `${base}-thumb.webp`;
    await sharp(filePath)
      .rotate()
      .resize({ width: 320, height: 320, fit: "cover" })
      .webp({ quality: 72 })
      .toFile(join(dir, thumbName));
    variants.thumb = `uploads/images/${thumbName}`;

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
  } catch (err) {
    logger.warn(
      `Sharp processing failed for ${filename}; keeping original. ${String(err)}`,
    );
    return {
      url: `uploads/images/${filename}`,
      variants: {},
    };
  }
}
