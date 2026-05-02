import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with custom headers allowed
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
  });
  
  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
  console.log('CORS enabled for http://localhost:5173');
  console.log('Allowed headers: Content-Type, Authorization, user-id');
}
bootstrap();