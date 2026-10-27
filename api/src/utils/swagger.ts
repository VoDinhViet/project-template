import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  INTERNAL_KEY_HEADER,
  INTERNAL_KEY_SCHEME,
  SWAGGER_PATH,
} from '../constants/app.constant.js';

export function setupSwagger(app: INestApplication): void {
  const documentConfig = new DocumentBuilder()
    .setTitle('Quản lý dự án API')
    .setVersion('0.1.0')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: INTERNAL_KEY_HEADER },
      INTERNAL_KEY_SCHEME,
    )
    .addSecurityRequirements(INTERNAL_KEY_SCHEME)
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, documentConfig, {
    // operationId = tên method controller nên Swagger hiển thị tên thao tác gọn (`getHealth`).
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
  SwaggerModule.setup(SWAGGER_PATH, app, openApiDocument, {
    jsonDocumentUrl: `${SWAGGER_PATH}-json`,
  });
}
