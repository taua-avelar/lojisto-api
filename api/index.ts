import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Configuração do CORS
    const frontendUrls = process.env.FRONTEND_URL || 'http://localhost:3000';
    const origins = frontendUrls.split(',').map(url => url.trim());

    console.log('CORS configurado para as seguintes origens:', origins);

    app.enableCors({
      origin: origins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Validação global de DTOs
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
}
