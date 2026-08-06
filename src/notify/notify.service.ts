import { Injectable, Logger } from '@nestjs/common';
import { FcmService } from '../fcm/fcm.service';
import { RailsService, Sismo } from '../rails/rails.service';
import { RedisService } from '../redis/redis.service';

const MAGNITUDE_THRESHOLD = 6;

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    private readonly rails: RailsService,
    private readonly redis: RedisService,
    private readonly fcm: FcmService,
  ) {}

  async checkAndNotify() {
    const lock = await this.redis.acquireCheckLock();
    if (!lock) return { skipped: true, reason: 'another check is already running' };

    try {
      const sismos = (await this.rails.fetchRecentSismos()).filter(
        (sismo) => Number(sismo.attributes.magnitude) >= MAGNITUDE_THRESHOLD,
      );
      const tokens = await this.rails.fetchDeviceTokens();
      let notified = 0;
      let sent = 0;
      let failed = 0;

      for (const sismo of sismos) {
        const externalId = sismo.attributes.external_id;
        if (!externalId || await this.redis.alreadyNotified(externalId)) continue;

        const result = await this.fcm.sendEarthquakeAlert(tokens, this.toAlert(sismo));
        await this.redis.markNotified(externalId);
        notified++;
        sent += result.success;
        failed += result.failure;
        this.logger.log(`Processed ${externalId}: ${result.success} sent, ${result.failure} failed`);
      }

      return { checked: sismos.length, notified, sent, failed };
    } finally {
      await this.redis.releaseCheckLock(lock);
    }
  }

  private toAlert(sismo: Sismo) {
    return {
      place: sismo.attributes.place,
      magnitude: Number(sismo.attributes.magnitude),
      externalId: sismo.attributes.external_id,
      url: sismo.links?.external_url ?? `https://telurify-web.vercel.app/sismos/${sismo.id}`,
    };
  }
}
