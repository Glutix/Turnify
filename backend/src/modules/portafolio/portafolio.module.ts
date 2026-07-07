import { Module } from '@nestjs/common';
import { PortafolioController } from './portafolio.controller';
import { PortafolioService } from './portafolio.service';

@Module({
  controllers: [PortafolioController],
  providers: [PortafolioService]
})
export class PortafolioModule {}
