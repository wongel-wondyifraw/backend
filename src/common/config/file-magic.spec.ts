import { isAllowedDocumentMagic, isAllowedImageMagic } from "./file-magic";

describe("file-magic", () => {
  it("accepts JPEG magic bytes", () => {
    expect(isAllowedImageMagic(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      true,
    );
  });

  it("rejects non-image bytes as images", () => {
    expect(isAllowedImageMagic(Buffer.from("%PDF-1.4"))).toBe(false);
  });

  it("accepts PDF magic for .pdf documents", () => {
    expect(isAllowedDocumentMagic(Buffer.from("%PDF-1.7"), "letter.pdf")).toBe(
      true,
    );
  });

  it("rejects JPEG bytes labeled as PDF", () => {
    expect(
      isAllowedDocumentMagic(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "x.pdf"),
    ).toBe(false);
  });
});
