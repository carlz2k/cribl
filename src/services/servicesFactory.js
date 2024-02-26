import { Configuration } from '../models/configuration';
import { FileReadService } from './fileReadService';
import { LogSearchService } from './logSearchService';
import { ServiceLocator } from './serviceLocator';
import { SessionObjectStorage } from './sessionObjectStorage';
import { WorkerPool } from './workerPool';

const _createServiceLocator = () => {
  const fileReadService = new FileReadService();
  return new ServiceLocator(fileReadService);
};

export const createLogSearchService = () => {
  const workerPool = new WorkerPool(
    _createServiceLocator(),
    Configuration.maxWorkerPoolSize,
  );
  return new LogSearchService(
    new SessionObjectStorage(),
    workerPool,
  );
};
