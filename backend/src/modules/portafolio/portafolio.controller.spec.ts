import { Test, TestingModule } from '@nestjs/testing';
import { PortafolioController } from './portafolio.controller';

describe('PortafolioController', () => {
  let controller: PortafolioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortafolioController],
    }).compile();

    controller = module.get<PortafolioController>(PortafolioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
