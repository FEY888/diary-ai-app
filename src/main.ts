import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
    const config = new DocumentBuilder()
    .setTitle('Diary AI API')
    .setDescription('AI 기반 다이어리 분석 서비스 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  
    app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform:true,
    })
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
