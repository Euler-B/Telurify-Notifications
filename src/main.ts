import 'reflect-metadata';
import { createApp } from './app';

async function bootstrap() {
  const app = await createApp();
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
