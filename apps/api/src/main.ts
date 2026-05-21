import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

const appEnvPath = resolve(__dirname, '..', '.env');
if (existsSync(appEnvPath)) {
  loadEnv({ path: appEnvPath });
}

const logger = new Logger('Bootstrap');
const maxPortAttempts = 20;

function resolveStartPort(defaultPort: number): number {
  const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
  if (Number.isInteger(parsedPort) && parsedPort > 0) {
    return parsedPort;
  }

  return defaultPort;
}

async function bootstrap() {
  // Lazy-load AppModule after dotenv has been applied.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppModule } = require('./app.module') as typeof import('./app.module');
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (process.env.ALLOWED_REDIRECT_URLS ?? 'http://localhost:3000')
      .split(',')
      .map((u) => u.trim()),
    credentials: true,
  });

  const startPort = resolveStartPort(3002);
  let selectedPort = startPort;

  for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    try {
      await app.listen(selectedPort);

      if (selectedPort !== startPort) {
        logger.warn(`Port ${startPort} is busy. Falling back to port ${selectedPort}.`);
      }

      logger.log(`API listening on port ${selectedPort}`);
      return;
    } catch (error) {
      const isAddressInUse =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'EADDRINUSE';

      if (!isAddressInUse) {
        throw error;
      }

      selectedPort += 1;
    }
  }

  throw new Error(`No free port found in range ${startPort}-${startPort + maxPortAttempts - 1}`);
}
bootstrap();
