
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Writable } from 'stream';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  async uploadFile(fileBuffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream: Writable = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error: Error | undefined, result: UploadApiResponse) => {
          if (error) return reject(new Error(error.message));
          if (!result.secure_url) return reject(new Error('No secure_url returned by Cloudinary'));
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(stream);
    });
  }

   async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  extractPublicId(url: string): string {
    try {
      // Ex: https://res.cloudinary.com/demo/image/upload/v1312461204/project-management-app/avatars/sample.jpg
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      const publicIdWithExt = parts.slice(uploadIndex + 2).join('/'); 
      
      // Scoatem extensia (.jpg, .png etc)
      return publicIdWithExt.replace(/\.[^/.]+$/, "");
    } catch (error) {
      console.error('Error extracting publicId:', error);
      return '';
    }
  }
}
