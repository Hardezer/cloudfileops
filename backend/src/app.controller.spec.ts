import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'appName') {
                return 'CloudFileOps API';
              }

              if (key === 'nodeEnv') {
                return 'development';
              }

              return null;
            },
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API running message', () => {
      expect(appController.getRoot()).toBe('CloudFileOps API running');
    });
  });

  describe('health', () => {
    it('should return API health status', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'CloudFileOps API',
        environment: 'development',
      });
    });
  });
});
