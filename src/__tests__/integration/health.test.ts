import request from 'supertest';
import app from '../../app';

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns success: true', async () => {
    const res = await request(app).get('/health');
    expect(res.body.success).toBe(true);
  });

  it('returns status: ok', async () => {
    const res = await request(app).get('/health');
    expect(res.body.data.status).toBe('ok');
  });

  it('returns uptime as a number', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('returns db connection state string', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.data.db).toBe('string');
  });

  it('returns env field', async () => {
    const res = await request(app).get('/health');
    expect(res.body.data.env).toBeDefined();
  });
});
