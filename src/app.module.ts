import { Module } from '@nestjs/common';
import { FcmService } from './fcm/fcm.service';
import { NotifyController } from './notify/notify.controller';
import { NotifyService } from './notify/notify.service';
import { RailsService } from './rails/rails.service';
import { RedisService } from './redis/redis.service';

@Module({
  controllers: [NotifyController],
  providers: [FcmService, NotifyService, RailsService, RedisService],
})
export class AppModule {}
