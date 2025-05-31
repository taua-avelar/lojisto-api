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
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Permitir requisições sem origin (ex: Postman, curl)
        if (!origin) return callback(null, true);

        // Verificar se a origin está na lista permitida
        if (origins.includes(origin)) {
          return callback(null, true);
        }

        console.log(`CORS: Origin ${origin} não permitida. Origens permitidas:`, origins);
        return callback(new Error('Not allowed by CORS'), false);
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods'
      ],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
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
