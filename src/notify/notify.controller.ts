import { Controller, Post, UseGuards } from '@nestjs/common';
import { NotifySecretGuard } from './notify-secret.guard';
import { NotifyService } from './notify.service';

@Controller('notify')
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post('check')
  @UseGuards(NotifySecretGuard)
  check() {
    return this.notifyService.checkAndNotify();
  }
}
