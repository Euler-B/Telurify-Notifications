import type { Request, Response } from 'express';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/app';

let appPromise: Promise<INestApplication> | undefined;

export default async function handler(req: Request, res: Response) {
  appPromise ??= createApp();
  const app = await appPromise;
  const expressApp = app.getHttpAdapter().getInstance();

  // Vercel mounts this function below /api; Nest routes stay identical
  // locally and in production.
  if (req.url?.startsWith('/api')) req.url = req.url.slice('/api'.length) || '/';

  return expressApp(req, res);
}
