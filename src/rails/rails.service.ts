import { Injectable, Logger } from '@nestjs/common';

export type Sismo = {
  id: number;
  attributes: {
    external_id: string;
    magnitude: number;
    place: string;
    title: string;
    time: string;
  };
  links?: { external_url?: string };
};

@Injectable()
export class RailsService {
  private readonly logger = new Logger(RailsService.name);
  private readonly apiUrl = this.requiredEnv('RAILS_API_URL');
  private readonly adminToken = this.requiredEnv('ADMIN_TOKEN');

  async fetchRecentSismos(): Promise<Sismo[]> {
    const url = new URL('/v1/sismos', this.apiUrl);
    const cutoff = new Date(Date.now() - this.lookbackHours() * 60 * 60 * 1000);
    url.searchParams.set('page', '1');
    url.searchParams.set('per_page', '1000');
    url.searchParams.set('filters[mag_min]', '6');
    url.searchParams.set('filters[date_from]', cutoff.toISOString());

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Telurify-API sismos returned ${response.status}`);
    }

    const payload = (await response.json()) as { data?: Sismo[] };
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async fetchDeviceTokens(): Promise<string[]> {
    const response = await fetch(new URL('/v1/devices', this.apiUrl), {
      headers: { 'X-Admin-Token': this.adminToken },
    });
    if (!response.ok) {
      throw new Error(`Telurify-API devices returned ${response.status}`);
    }

    const payload = (await response.json()) as { data?: unknown };
    return Array.isArray(payload.data) ? payload.data.filter((token): token is string => typeof token === 'string') : [];
  }

  parseSismoTime(time: string): Date {
    const normalized = time.includes('T') ? time : time.replace(' ', 'T');
    return new Date(normalized.endsWith('Z') ? normalized : `${normalized.replace(/ UTC$/, '')}Z`);
  }

  private lookbackHours(): number {
    const value = Number(process.env.LOOKBACK_HOURS ?? 6);
    return Number.isFinite(value) && value > 0 ? value : 6;
  }

  private requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      this.logger.warn(`${name} is not configured`);
    }
    return value ?? '';
  }
}
