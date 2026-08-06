import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class NotifySecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const supplied = Buffer.from(request.headers['x-notify-secret'] ?? '');
    const configured = Buffer.from(process.env.NOTIFY_SECRET ?? '');

    if (configured.length === 0 || supplied.length !== configured.length) {
      throw new UnauthorizedException();
    }

    if (!timingSafeEqual(supplied, configured)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
