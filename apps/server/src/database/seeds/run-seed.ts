// src/database/seeds/run-seed.ts
import { NestFactory } from '@nestjs/core';
import { SeederModule, SeederService } from './seeder.module';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ Cannot run seed script in production!');
    process.exit(1);
  }

  // Create Nest Application Context without starting HTTP server
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const seeder = appContext.get(SeederService);

  try {
    console.log('🌱 Starting database seeding...');
    await seeder.seedAll();
    console.log('✅ Seeding completed successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
