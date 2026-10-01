export type BulkCreateError = {
  index: number;
  message: string;
};

export type BulkCreateResult = {
  created: number;
  failed: number;
  errors: BulkCreateError[];
};
