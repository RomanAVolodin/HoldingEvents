import { CacheModule, Module } from '@nestjs/common';
import { CachingService } from './caching.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    }),
  ],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
