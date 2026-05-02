import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    ShipmentsModule,
  ],
  controllers: [UploadController],
})
export class UploadModule {}
