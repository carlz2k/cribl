import { Configuration } from '../models/configuration';
import { LogSearchService } from './logSearchService';
import { RequestHandler } from './requestHandler';
import { serviceExecutor } from './serviceExecutor';
import { SessionObjectStorage } from './sessionObjectStorage';
import { ResponseTransformer } from './transformers/responseTransformer';
import { WorkerPool } from './workerPool';

export const createRequestHandler = () => {
  const workerPool = new WorkerPool(
    serviceExecutor,
    Configuration.maxWorkerPoolSize,
  );
  const sessionObjectStorage = new SessionObjectStorage();

  return new RequestHandler(
    new LogSearchService(
      sessionObjectStorage,
      workerPool,
    ),
    sessionObjectStorage,
    new ResponseTransformer(),
  );
};
