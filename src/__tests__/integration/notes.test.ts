jest.mock('../../config/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() } },
}));

import request from 'supertest';
import app from '../../app';
import { setupDB } from '../setup/db';
import { supabase } from '../../config/supabase';

setupDB();

const TEST_USER = { id: 'supa-notes-integration', email: 'notes-integration@test.com' };
const AUTH = 'Bearer test-token';

beforeEach(() => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: TEST_USER },
    error: null,
  });
});

// Fetch the General category id fresh each time (DB is cleared between tests)
const getDefaultCategoryId = async (): Promise<string> => {
  const res = await request(app).get('/api/v1/categories').set('Authorization', AUTH);
  const general = res.body.data.find((c: { isDefault: boolean }) => c.isDefault);
  return general._id;
};

describe('POST /api/v1/notes', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/v1/notes').send({ title: 'x', markdownContent: 'x', categoryId: 'y' });
    expect(res.status).toBe(401);
  });

  it('creates a note and returns 201', async () => {
    const catId = await getDefaultCategoryId();
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'My Note', markdownContent: '# Hello', categoryId: catId });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Note');
    expect(res.body.data._id).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const catId = await getDefaultCategoryId();
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ markdownContent: '# x', categoryId: catId });
    expect(res.status).toBe(400);
  });

  it('returns 400 when markdownContent is missing', async () => {
    const catId = await getDefaultCategoryId();
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Note', categoryId: catId });
    expect(res.status).toBe(400);
  });

  it('returns 400 when categoryId is missing', async () => {
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Note', markdownContent: '# x' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent category', async () => {
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Note', markdownContent: '# x', categoryId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/notes', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/notes');
    expect(res.status).toBe(401);
  });

  it('returns 200 with an array of notes', async () => {
    const res = await request(app).get('/api/v1/notes').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('includes pagination metadata', async () => {
    const res = await request(app).get('/api/v1/notes').set('Authorization', AUTH);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  it('does not include markdownContent in list response', async () => {
    const catId = await getDefaultCategoryId();
    await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'List Check', markdownContent: '# secret', categoryId: catId });

    const res = await request(app).get('/api/v1/notes').set('Authorization', AUTH);
    const note = res.body.data.find((n: { title: string }) => n.title === 'List Check');
    expect(note).toBeDefined();
    expect(note.markdownContent).toBeUndefined();
  });

  it('filters notes by categoryId query param', async () => {
    const catId = await getDefaultCategoryId();
    const otherRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'FilterTarget' });
    const otherCatId = otherRes.body.data._id;

    await request(app).post('/api/v1/notes').set('Authorization', AUTH)
      .send({ title: 'In General', markdownContent: 'x', categoryId: catId });
    await request(app).post('/api/v1/notes').set('Authorization', AUTH)
      .send({ title: 'In Other', markdownContent: 'x', categoryId: otherCatId });

    const res = await request(app)
      .get(`/api/v1/notes?categoryId=${otherCatId}`)
      .set('Authorization', AUTH);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('In Other');
  });
});

describe('GET /api/v1/notes/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/notes/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });

  it('returns the full note including markdownContent', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Full Note', markdownContent: '# Full markdown', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app).get(`/api/v1/notes/${noteId}`).set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.data.markdownContent).toBe('# Full markdown');
    expect(res.body.data.title).toBe('Full Note');
  });

  it('returns 404 for a non-existent note id', async () => {
    const res = await request(app)
      .get('/api/v1/notes/507f1f77bcf86cd799439011')
      .set('Authorization', AUTH);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/notes/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).patch('/api/v1/notes/507f1f77bcf86cd799439011').send({ title: 'x' });
    expect(res.status).toBe(401);
  });

  it('updates a note and returns 200', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Old Title', markdownContent: '# old', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/notes/${noteId}`)
      .set('Authorization', AUTH)
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for a non-existent note', async () => {
    const res = await request(app)
      .patch('/api/v1/notes/507f1f77bcf86cd799439011')
      .set('Authorization', AUTH)
      .send({ title: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when markdownContent is empty string', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Note', markdownContent: '# x', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/notes/${noteId}`)
      .set('Authorization', AUTH)
      .send({ markdownContent: '' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/notes/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/v1/notes/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });

  it('deletes a note and returns 200', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Delete Me', markdownContent: '# bye', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app).delete(`/api/v1/notes/${noteId}`).set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('deleted note is no longer accessible', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Gone', markdownContent: '# gone', categoryId: catId });
    const noteId = createRes.body.data._id;

    await request(app).delete(`/api/v1/notes/${noteId}`).set('Authorization', AUTH);

    const res = await request(app).get(`/api/v1/notes/${noteId}`).set('Authorization', AUTH);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent note', async () => {
    const res = await request(app)
      .delete('/api/v1/notes/507f1f77bcf86cd799439011')
      .set('Authorization', AUTH);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/notes/:id/move', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/v1/notes/507f1f77bcf86cd799439011/move')
      .send({ categoryId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(401);
  });

  it('moves note to another category and returns 200', async () => {
    const catId = await getDefaultCategoryId();
    const targetRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', AUTH)
      .send({ name: 'MoveTarget' });
    const targetCatId = targetRes.body.data._id;

    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Moveable', markdownContent: '# move me', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/notes/${noteId}/move`)
      .set('Authorization', AUTH)
      .send({ categoryId: targetCatId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when categoryId is missing from body', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Note', markdownContent: '# x', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/notes/${noteId}/move`)
      .set('Authorization', AUTH)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when note does not exist', async () => {
    const catId = await getDefaultCategoryId();
    const res = await request(app)
      .patch('/api/v1/notes/507f1f77bcf86cd799439011/move')
      .set('Authorization', AUTH)
      .send({ categoryId: catId });
    expect(res.status).toBe(404);
  });

  it('returns 404 when target category does not exist', async () => {
    const catId = await getDefaultCategoryId();
    const createRes = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', AUTH)
      .send({ title: 'Note', markdownContent: '# x', categoryId: catId });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/notes/${noteId}/move`)
      .set('Authorization', AUTH)
      .send({ categoryId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/notes/search', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/notes/search?query=hello');
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid auth', async () => {
    const res = await request(app).get('/api/v1/notes/search').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns an array in data field', async () => {
    const res = await request(app).get('/api/v1/notes/search').set('Authorization', AUTH);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns pagination metadata', async () => {
    const res = await request(app).get('/api/v1/notes/search').set('Authorization', AUTH);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination).toHaveProperty('total');
  });
});
