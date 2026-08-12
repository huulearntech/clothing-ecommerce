import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageStorageService } from './image_storage.service';
import { ImageStorageController } from './image_storage.controller';
import { IMAGE_STORAGE_PROVIDER } from './interfaces/image-storage.interface';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';

export interface ImageStorageModuleOptions {
  provider?: 'cloudinary' | 'local';
}

@Module({})
export class ImageStorageModule {
  static register(options?: ImageStorageModuleOptions): DynamicModule {
    const providerType =
      options?.provider ||
      (process.env.IMAGE_STORAGE_PROVIDER as 'cloudinary' | 'local') ||
      'cloudinary';

    const storageProvider: Provider = {
      provide: IMAGE_STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        if (providerType === 'local') {
          return new LocalStorageProvider();
        }
        return new CloudinaryStorageProvider(configService);
      },
      inject: [ConfigService],
    };

    return {
      module: ImageStorageModule,
      imports: [ConfigModule],
      controllers: [ImageStorageController],
      providers: [storageProvider, ImageStorageService],
      exports: [ImageStorageService],
    };
  }
}
