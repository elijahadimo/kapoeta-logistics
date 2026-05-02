import { Controller, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  @Post('delivery')
  @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: './uploads/deliveries',
      filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);
        const filename = `${uuidv4()}${extension}`;
        callback(null, filename);
      },
    }),
  }))
  async uploadDeliveryPhoto(@UploadedFile() file: Express.Multer.File) {
    const photoUrl = `/uploads/deliveries/${file.filename}`;
    return { photoUrl };
  }
}
