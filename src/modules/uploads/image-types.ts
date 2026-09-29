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
