jest.mock('../../config/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() } },
}));

import request from 'supertest';
import app from '../../app';
import { setupDB } from '../setup/db';
import { supabase } from '../../config/supabase';

setupDB();

const TEST_USER = { id: 'supa-cat-integration', email: 'cat-integration@test.com' };
const AUTH = 'Bearer test-token';

beforeEach(() => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: TEST_USER },
    error: null,
  });
});

describe('GET /api/v1/categories', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid auth', async () => {
    const res = await request(app).get('/api/v1/categories').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns an array of categories', async () => {
    const res = await request(app).get('/api/v1/categories').set('Authorization', AUTH);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('includes the default General category created on first login', async () => {
    const res = await request(app).get('/api/v1/categories').set('Authorization', AUTH);
    const names: string[] = res.body.data.map((c: { name: string }) => c.name);
    expect(names).toContain('General');
  });
});

describe('POST /api/v1/categories', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/v1/categories').send({ name: 'Work' });
    expect(res.status).toBe(401);
  });

  it('creates a new category and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'Work Projects' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Work Projects');
  });

  it('returns 400 when name is too short', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is too long', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'A'.repeat(51) });
    expect(res.status).toBe(400);
  });

  it('returns the created category in the response', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'Personal' });
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data).toHaveProperty('name', 'Personal');
  });
});

describe('PATCH /api/v1/categories/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/v1/categories/507f1f77bcf86cd799439011')
      .send({ name: 'New' });
    expect(res.status).toBe(401);
  });

  it('updates a category and returns 200', async () => {
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'Old Name' });
    const id = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/categories/${id}`)
      .set('Authorization', AUTH)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for a non-existent category id', async () => {
    const res = await request(app)
      .patch('/api/v1/categories/507f1f77bcf86cd799439011')
      .set('Authorization', AUTH)
      .send({ name: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid name', async () => {
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'Valid Name' });
    const id = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/categories/${id}`)
      .set('Authorization', AUTH)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/categories/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/v1/categories/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });

  it('deletes a non-default category and returns 200', async () => {
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'ToBeDeleted' });
    const id = createRes.body.data._id;

    const res = await request(app)
      .delete(`/api/v1/categories/${id}`)
      .set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when deleting the default General category', async () => {
    const listRes = await request(app).get('/api/v1/categories').set('Authorization', AUTH);
    const general = listRes.body.data.find((c: { isDefault: boolean }) => c.isDefault);

    const res = await request(app)
      .delete(`/api/v1/categories/${general._id}`)
      .set('Authorization', AUTH);
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent category', async () => {
    const res = await request(app)
      .delete('/api/v1/categories/507f1f77bcf86cd799439011')
      .set('Authorization', AUTH);
    expect(res.status).toBe(404);
  });

  it('confirmed deleted category is no longer listed', async () => {
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'GoneSoon' });
    const id = createRes.body.data._id;

    await request(app).delete(`/api/v1/categories/${id}`).set('Authorization', AUTH);

    const listRes = await request(app).get('/api/v1/categories').set('Authorization', AUTH);
    const ids: string[] = listRes.body.data.map((c: { _id: string }) => c._id);
    expect(ids).not.toContain(id);
  });
});
