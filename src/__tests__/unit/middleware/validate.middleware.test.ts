import { validate } from '../../../middleware/validate.middleware';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const schema = z.object({ name: z.string().min(2) });

const buildRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe('validate middleware', () => {
  it('calls next with no args when body is valid', () => {
    const req = { body: { name: 'hello' } } as Request;
    const next = jest.fn();
    validate(schema)(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 400 when body is invalid', () => {
    const req = { body: { name: 'x' } } as Request;
    const res = buildRes();
    const next = jest.fn();
    validate(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns success: false on validation failure', () => {
    const req = { body: {} } as Request;
    const res = buildRes();
    validate(schema)(req, res, jest.fn());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('returns "Validation error" message on failure', () => {
    const req = { body: {} } as Request;
    const res = buildRes();
    validate(schema)(req, res, jest.fn());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toBe('Validation error');
  });

  it('includes Zod error details in the response', () => {
    const req = { body: {} } as Request;
    const res = buildRes();
    validate(schema)(req, res, jest.fn());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(body.error)).toBe(true);
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('passes non-ZodError exceptions to next', () => {
    const badSchema = {
      parse: () => {
        throw new TypeError('unexpected');
      },
    } as unknown as z.ZodSchema;
    const req = { body: {} } as Request;
    const next = jest.fn();
    validate(badSchema)(req, buildRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(TypeError));
  });
});
