import { asyncHandler } from '../../../utils/asyncHandler';
import type { Request, Response, NextFunction } from 'express';

describe('asyncHandler', () => {
  const mockReq = {} as Request;
  const mockRes = {} as Response;

  it('calls the wrapped function with req, res, next', async () => {
    const next = jest.fn() as NextFunction;
    const fn = jest.fn().mockResolvedValue(undefined);
    await asyncHandler(fn)(mockReq, mockRes, next);
    expect(fn).toHaveBeenCalledWith(mockReq, mockRes, next);
  });

  it('calls next with the error when the function rejects', async () => {
    const next = jest.fn() as NextFunction;
    const error = new Error('async failure');
    const fn = jest.fn().mockRejectedValue(error);
    await asyncHandler(fn)(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next when the function resolves successfully', async () => {
    const next = jest.fn() as NextFunction;
    const fn = jest.fn().mockResolvedValue(undefined);
    await asyncHandler(fn)(mockReq, mockRes, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards any thrown error type to next', async () => {
    const next = jest.fn() as NextFunction;
    const customError = Object.assign(new Error('Not found'), { statusCode: 404 });
    const fn = jest.fn().mockRejectedValue(customError);
    await asyncHandler(fn)(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledWith(customError);
  });
});
