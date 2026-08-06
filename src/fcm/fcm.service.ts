import { Injectable } from '@nestjs/common';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const FCM_BATCH_SIZE = 500;

type Alert = {
  place: string;
  magnitude: number;
  externalId: string;
  url: string;
};

@Injectable()
export class FcmService {
  async sendEarthquakeAlert(tokens: string[], alert: Alert): Promise<{ success: number; failure: number }> {
    if (tokens.length === 0) return { success: 0, failure: 0 };
    const messaging = getMessaging(this.firebaseApp());
    let success = 0;
    let failure = 0;

    for (let index = 0; index < tokens.length; index += FCM_BATCH_SIZE) {
      const batch = tokens.slice(index, index + FCM_BATCH_SIZE);
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        data: {
          title: `Sismo de magnitud ${alert.magnitude.toFixed(1)}`,
          body: alert.place,
          external_id: alert.externalId,
          url: alert.url,
        },
        webpush: {
          fcmOptions: { link: alert.url },
        },
      });
      success += response.successCount;
      failure += response.failureCount;
    }

    return { success, failure };
  }

  private firebaseApp() {
    const existing = getApps()[0];
    if (existing) return existing;

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is required');
    const serviceAccount = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });
  }
}
