import { Configuration } from '../models/configuration';
import { LogSearchService } from './logSearchService';
import { serviceExecutor } from './serviceExecutor';
import { SessionObjectStorage } from './sessionObjectStorage';
import { WorkerPool } from './workerPool';

export const createLogSearchService = () => {
  const workerPool = new WorkerPool(
    serviceExecutor,
    Configuration.maxWorkerPoolSize,
  );
  return new LogSearchService(
    new SessionObjectStorage(),
    workerPool,
  );
};
