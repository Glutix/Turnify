import { Test, TestingModule } from '@nestjs/testing';
import { PortafolioService } from './portafolio.service';

describe('PortafolioService', () => {
  let service: PortafolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortafolioService],
    }).compile();

    service = module.get<PortafolioService>(PortafolioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
