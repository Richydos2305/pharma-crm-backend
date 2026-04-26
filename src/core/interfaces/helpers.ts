export interface FindOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface ResponseHandlerParams {
  status: number;
  message: string;
  data?: unknown;
  error?: { code: string };
}
