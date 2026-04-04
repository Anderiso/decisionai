import 'dotenv/config';
import { createAdaptorServer } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { api } from './routes/api.js';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'decisions-ai-api',
    time: new Date().toISOString(),
  }),
);

app.route('/api/v1', api);

function listenOnPort(server: ReturnType<typeof createAdaptorServer>, port: number) {
  return new Promise<void>((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      server.off('error', onError);
      reject(err);
    };
    server.once('error', onError);
    // Bind all interfaces so phones / LAN can reach this machine (not only 127.0.0.1).
    server.listen(port, '0.0.0.0', () => {
      server.off('error', onError);
      resolve();
    });
  });
}

function getListeningPort(server: ReturnType<typeof createAdaptorServer>, fallback: number) {
  const addr = server.address();
  if (typeof addr === 'object' && addr !== null) {
    return addr.port;
  }
  return fallback;
}

async function start() {
  const envRaw = process.env.PORT?.trim();
  const envPort = envRaw ? Number(envRaw) : NaN;
  const explicitPort = Number.isFinite(envPort) && envPort > 0;
  const portCandidates = explicitPort ? [envPort] : [3000, 3001, 3002, 3003, 3004];
  let lastError: unknown;

  for (const port of portCandidates) {
    const server = createAdaptorServer({ fetch: app.fetch });
    try {
      await listenOnPort(server, port);
      const actual = getListeningPort(server, port);
      console.log(`\nDecisions AI API → http://localhost:${actual} (and http://<this-PC-LAN-IP>:${actual})`);
      if (!explicitPort && actual !== 3000) {
        console.log(
          '\nNote: port 3000 was already in use, so the API started on a different port.',
        );
        console.log(
          "If the mobile app still points at :3000, either free port 3000 or set EXPO_PUBLIC_API_URL to this machine's LAN IP with this port (see README).\n",
        );
      }
      return;
    } catch (err) {
      lastError = err;
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'EADDRINUSE') {
        continue;
      }
      console.error(err);
      process.exit(1);
    }
  }

  console.error(
    explicitPort
      ? `Port ${portCandidates[0]} is already in use (EADDRINUSE).`
      : `Could not bind any of: ${portCandidates.join(', ')}.`,
  );
  console.error(
    '\nFix: stop whatever is using that port, or set PORT in backend/.env to a free port (e.g. 3001) and match EXPO_PUBLIC_API_URL on your phone.\n',
  );
  if (lastError) console.error(lastError);
  process.exit(1);
}

void start();
