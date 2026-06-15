import { errorMiddleware } from '../../../middleware/error.middleware';
import type { Request, Response, NextFunction } from 'express';

const mockReq = {} as Request;
const mockNext = jest.fn() as NextFunction;

const buildRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe('errorMiddleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('uses statusCode from error when present', () => {
    const res = buildRes();
    const err = Object.assign(new Error('Not found'), { statusCode: 404 });
    errorMiddleware(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('defaults to 500 when error has no statusCode', () => {
    const res = buildRes();
    errorMiddleware(new Error('crash'), mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns the actual error message for 4xx errors', () => {
    const res = buildRes();
    const err = Object.assign(new Error('Category not found'), { statusCode: 404 });
    errorMiddleware(err, mockReq, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Category not found' })
    );
  });

  it('returns generic message for 5xx errors', () => {
    const res = buildRes();
    errorMiddleware(new Error('Internal DB connection failed'), mockReq, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something went wrong' })
    );
  });

  it('includes error stack in response body in development for 5xx', () => {
    process.env.NODE_ENV = 'development';
    const res = buildRes();
    errorMiddleware(new Error('crash'), mockReq, res, mockNext);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body).toHaveProperty('error');
  });

  it('does not include error stack in response body in production', () => {
    process.env.NODE_ENV = 'production';
    const res = buildRes();
    errorMiddleware(new Error('crash'), mockReq, res, mockNext);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body).not.toHaveProperty('error');
  });

  it('always sets success: false', () => {
    const res = buildRes();
    errorMiddleware(new Error('any'), mockReq, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('treats 400 as a client error and returns the real message', () => {
    const res = buildRes();
    const err = Object.assign(new Error('Validation failed'), { statusCode: 400 });
    errorMiddleware(err, mockReq, res, mockNext);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toBe('Validation failed');
  });
});
