import { extname } from "path";

function hasPrefix(buf: Buffer, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false;
  return bytes.every((b, i) => buf[i] === b);
}

function isJpeg(buf: Buffer): boolean {
  return hasPrefix(buf, [0xff, 0xd8, 0xff]);
}

function isPng(buf: Buffer): boolean {
  return hasPrefix(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function isGif(buf: Buffer): boolean {
  return (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  );
}

function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  );
}

function isPdf(buf: Buffer): boolean {
  return buf.toString("ascii", 0, 4) === "%PDF";
}

function isZip(buf: Buffer): boolean {
  return hasPrefix(buf, [0x50, 0x4b, 0x03, 0x04]);
}

function isOle(buf: Buffer): boolean {
  return hasPrefix(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function isEbml(buf: Buffer): boolean {
  return hasPrefix(buf, [0x1a, 0x45, 0xdf, 0xa3]);
}

function isIsoBmff(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  return buf.toString("ascii", 4, 8) === "ftyp";
}

export function isAllowedImageMagic(buf: Buffer): boolean {
  return isJpeg(buf) || isPng(buf) || isGif(buf) || isWebp(buf);
}

export function isAllowedDocumentMagic(
  buf: Buffer,
  originalname: string,
): boolean {
  const ext = extname(originalname).toLowerCase();

  if (ext === ".txt") {
    return true;
  }
  if (ext === ".pdf") {
    return isPdf(buf);
  }
  if (ext === ".docx") {
    return isZip(buf);
  }
  if (ext === ".doc") {
    return isOle(buf);
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return isJpeg(buf);
  }
  if (ext === ".png") {
    return isPng(buf);
  }
  if (ext === ".mp4" || ext === ".mov") {
    return isIsoBmff(buf);
  }
  if (ext === ".webm") {
    return isEbml(buf);
  }

  return false;
}
