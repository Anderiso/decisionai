import { Hono } from 'hono';
import { decisions } from './decisions.js';

export const api = new Hono();

api.get('/hello', (c) =>
  c.json({
    message: 'Decisions AI API',
    version: '0.1.0',
    hint: 'Use POST /api/v1/decisions/refine and /recommend from the mobile app.',
  }),
);

api.route('/decisions', decisions);
