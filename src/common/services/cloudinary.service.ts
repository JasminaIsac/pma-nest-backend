
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Writable } from 'stream';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
      // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      // api_key: process.env.CLOUDINARY_API_KEY,
      // api_secret: process.env.CLOUDINARY_API_SECRET,
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
    // url ex: https://res.cloudinary.com/name/image/upload/v1765481878/project-management-app/avatars/filename.jpg
    const parts = url.split('/');
    const fileName = parts.pop();
    const folder = parts.slice(parts.indexOf('upload') + 1).join('/');
    const publicId = `${folder}/${fileName?.replace(/\.[^/.]+$/, '')}`; // scoatem extensia
    return publicId;
  }
}
