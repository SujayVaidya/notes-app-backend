export interface PaginationParams {
  page: number;
  limit: number;
}

export const parsePagination = (query: Record<string, unknown>): PaginationParams => ({
  page: Math.max(1, parseInt(String(query.page || '1'), 10)),
  limit: Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10))),
});

export const buildPagination = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});
