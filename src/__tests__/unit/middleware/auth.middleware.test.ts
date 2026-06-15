jest.mock('../../../config/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() } },
}));

jest.mock('../../../services/user.service', () => ({
  userService: { findOrCreate: jest.fn() },
}));

import { authMiddleware } from '../../../middleware/auth.middleware';
import { supabase } from '../../../config/supabase';
import { userService } from '../../../services/user.service';
import type { Request, Response, NextFunction } from 'express';

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFindOrCreate = userService.findOrCreate as jest.Mock;

const buildRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe('authMiddleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} } as Request;
    const res = buildRes();
    await authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when Authorization header is not Bearer format', async () => {
    const req = { headers: { authorization: 'Basic sometoken' } } as Request;
    const res = buildRes();
    await authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when Supabase returns an error', async () => {
    const req = { headers: { authorization: 'Bearer bad-token' } } as Request;
    const res = buildRes();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    await authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when Supabase returns no user and no error', async () => {
    const req = { headers: { authorization: 'Bearer bad-token' } } as Request;
    const res = buildRes();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await authMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('sets req.user and calls next on valid token', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } } as unknown as Request;
    const res = buildRes();
    const next = jest.fn() as NextFunction;
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'supa-1', email: 'test@example.com' } },
      error: null,
    });
    mockFindOrCreate.mockResolvedValue({ _id: 'mongo-1', email: 'test@example.com' });

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ userId: 'mongo-1', email: 'test@example.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('calls userService.findOrCreate with correct supabaseId and email', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } } as unknown as Request;
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'supa-abc', email: 'user@test.com' } },
      error: null,
    });
    mockFindOrCreate.mockResolvedValue({ _id: 'mongo-abc', email: 'user@test.com' });

    await authMiddleware(req, buildRes(), jest.fn());

    expect(mockFindOrCreate).toHaveBeenCalledWith('supa-abc', 'user@test.com');
  });

  it('returns 401 when an unexpected exception is thrown', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } } as unknown as Request;
    const res = buildRes();
    mockGetUser.mockRejectedValue(new Error('Network failure'));

    await authMiddleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns message TOKEN_MISSING when header is absent', async () => {
    const req = { headers: {} } as Request;
    const res = buildRes();
    await authMiddleware(req, res, jest.fn());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toBe('Authentication token missing');
  });

  it('returns message TOKEN_INVALID when token is bad', async () => {
    const req = { headers: { authorization: 'Bearer bad' } } as Request;
    const res = buildRes();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('x') });
    await authMiddleware(req, res, jest.fn());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toBe('Invalid authentication token');
  });
});
