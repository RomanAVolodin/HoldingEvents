import { TrimPipe } from '@app/share/pipes/trimBody.pipe';

if (!process.env.IS_TS_NODE) {
  require('module-alias/register');
}

import { AppModule } from '@app/app.module';
import { NestFactory } from '@nestjs/core';

const bootstrap = async () => {
  const APP_PORT = process.env.APP_PORT || 3000;

  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new TrimPipe());

  await app.listen(APP_PORT, () =>
    console.log(`Application has been started on port ${APP_PORT}`),
  );
};
bootstrap().then();
