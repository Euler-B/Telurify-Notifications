import { ExecutionContext } from '@nestjs/common';
import { NotifySecretGuard } from './notify-secret.guard';

function contextWithSecret(secret?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: secret ? { 'x-notify-secret': secret } : {} }),
    }),
  } as ExecutionContext;
}

describe('NotifySecretGuard', () => {
  const original = process.env.NOTIFY_SECRET;

  afterEach(() => {
    if (original === undefined) delete process.env.NOTIFY_SECRET;
    else process.env.NOTIFY_SECRET = original;
  });

  it('accepts the configured secret', () => {
    process.env.NOTIFY_SECRET = 'secret';
    expect(new NotifySecretGuard().canActivate(contextWithSecret('secret'))).toBe(true);
  });

  it('rejects a missing or invalid secret', () => {
    process.env.NOTIFY_SECRET = 'secret';
    expect(() => new NotifySecretGuard().canActivate(contextWithSecret())).toThrow();
    expect(() => new NotifySecretGuard().canActivate(contextWithSecret('wrong'))).toThrow();
  });
});
