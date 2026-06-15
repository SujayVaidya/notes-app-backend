import { parsePagination, buildPagination } from '../../../utils/pagination';

describe('parsePagination', () => {
  it('returns defaults when no query params provided', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20 });
  });

  it('parses valid page and limit', () => {
    expect(parsePagination({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });

  it('clamps page to minimum 1 for zero', () => {
    expect(parsePagination({ page: '0' }).page).toBe(1);
  });

  it('clamps page to minimum 1 for negative values', () => {
    expect(parsePagination({ page: '-5' }).page).toBe(1);
  });

  it('clamps limit to maximum 100', () => {
    expect(parsePagination({ limit: '500' }).limit).toBe(100);
  });

  it('clamps limit to minimum 1 for zero', () => {
    expect(parsePagination({ limit: '0' }).limit).toBe(1);
  });

  it('clamps limit to minimum 1 for negative values', () => {
    expect(parsePagination({ limit: '-10' }).limit).toBe(1);
  });

  it('falls back to default page when value is non-numeric', () => {
    expect(parsePagination({ page: 'abc' }).page).toBe(1);
  });

  it('falls back to default limit when value is non-numeric', () => {
    expect(parsePagination({ limit: 'xyz' }).limit).toBe(20);
  });

  it('accepts limit of exactly 100', () => {
    expect(parsePagination({ limit: '100' }).limit).toBe(100);
  });

  it('accepts limit of exactly 1', () => {
    expect(parsePagination({ limit: '1' }).limit).toBe(1);
  });
});

describe('buildPagination', () => {
  it('calculates correct page count', () => {
    expect(buildPagination(100, 1, 20)).toEqual({ page: 1, limit: 20, total: 100, pages: 5 });
  });

  it('rounds up for partial last page', () => {
    expect(buildPagination(21, 1, 20).pages).toBe(2);
  });

  it('returns 0 pages when total is 0', () => {
    expect(buildPagination(0, 1, 20).pages).toBe(0);
  });

  it('returns 1 page when total equals limit', () => {
    expect(buildPagination(20, 1, 20).pages).toBe(1);
  });

  it('returns 1 page when total is less than limit', () => {
    expect(buildPagination(5, 1, 20).pages).toBe(1);
  });

  it('passes page and limit through unchanged', () => {
    const result = buildPagination(50, 3, 10);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });
});
