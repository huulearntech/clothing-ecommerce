import { Injectable, Logger } from '@nestjs/common';
import {
  IImageStorageProvider,
  SignedUploadSignatureResponse,
} from '../interfaces/image-storage.interface';

@Injectable()
export class LocalStorageProvider implements IImageStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);

  async generateUploadSignature(
    folder: string = 'products',
    publicId?: string,
  ): Promise<SignedUploadSignatureResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    return {
      signature: 'mock_local_signature',
      timestamp,
      cloudName: 'local_cloud',
      apiKey: 'local_key',
      folder,
      uploadUrl: 'http://localhost:3000/image-storage/mock-upload',
      publicId,
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    this.logger.log(`Local file ${publicId} requested for deletion.`);
    return true;
  }

  async getImageUrl(publicId: string): Promise<string> {
    return `http://localhost:3000/uploads/${publicId}`;
  }
}
