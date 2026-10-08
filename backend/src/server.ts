import { app } from './app.ts';
import { env } from './config/env.ts';
import { pool } from './db/pool.ts';

const server = app.listen(env.PORT, () => {
  console.log(`BookEasy API running on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);