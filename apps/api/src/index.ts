import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

async function main() {
  await connectDB();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`API escuchando en http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fallo al iniciar la API');
  process.exit(1);
});
