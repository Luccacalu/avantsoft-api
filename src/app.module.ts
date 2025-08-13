import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './modules/clients/clients.module';
import { PrismaModule } from './core/database/prisma.module';
import { SalesModule } from './modules/sales/sales.module';

@Module({
  imports: [ClientsModule, PrismaModule, SalesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
