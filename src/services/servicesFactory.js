import { Configuration } from '../models/configuration';
import { LogSearchService } from './logSearchService';
import { RequestHandler } from './requestHandler';
import { serviceExecutor } from './serviceExecutor';
import { SessionObjectStorage } from './sessionObjectStorage';
import { WorkerPool } from './workerPool';

export const createRequestHandler = () => {
  const workerPool = new WorkerPool(
    serviceExecutor,
    Configuration.maxWorkerPoolSize,
  );
  return new RequestHandler(
    new LogSearchService(
      new SessionObjectStorage(),
      workerPool,
    ),
  );
};
