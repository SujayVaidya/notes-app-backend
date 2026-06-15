export interface PaginationParams {
  page: number;
  limit: number;
}

export const parsePagination = (query: Record<string, unknown>): PaginationParams => {
  const rawPage = parseInt(String(query.page ?? ''), 10);
  const rawLimit = parseInt(String(query.limit ?? ''), 10);
  return {
    page: Math.max(1, isNaN(rawPage) ? 1 : rawPage),
    limit: Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit)),
  };
};

export const buildPagination = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});
