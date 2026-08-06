import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';

const NOTIFIED_PREFIX = 'telurify:notifications:notified:';
const LOCK_KEY = 'telurify:notifications:check-lock';
const NOTIFIED_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOCK_TTL_SECONDS = 60;

@Injectable()
export class RedisService {
  private readonly redis = this.createClient();

  async acquireCheckLock(): Promise<string | null> {
    const value = randomUUID();
    const acquired = await this.redis.set(LOCK_KEY, value, { nx: true, ex: LOCK_TTL_SECONDS });
    return acquired === 'OK' ? value : null;
  }

  async releaseCheckLock(value: string): Promise<void> {
    const current = await this.redis.get<string>(LOCK_KEY);
    if (current === value) await this.redis.del(LOCK_KEY);
  }

  async alreadyNotified(externalId: string): Promise<boolean> {
    return (await this.redis.get(`${NOTIFIED_PREFIX}${externalId}`)) !== null;
  }

  async markNotified(externalId: string): Promise<void> {
    await this.redis.set(`${NOTIFIED_PREFIX}${externalId}`, '1', { ex: NOTIFIED_TTL_SECONDS });
  }

  private createClient(): Redis {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
    return new Redis({ url, token });
  }
}
