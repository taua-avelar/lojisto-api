import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  // Configuração do CORS
  const frontendUrls = configService.get('FRONTEND_URL');
  const origins = frontendUrls ? frontendUrls.split(',') : ['http://localhost:3000'];

  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Store-Id'],
    credentials: true,
  });

  console.log('CORS configurado para as seguintes origens:', origins);

  // Validação global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades não definidas no DTO
    transform: true, // Transforma os dados para o tipo correto
  }));

  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
