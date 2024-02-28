import { Configuration } from '../models/configuration';
import { LogSearchService } from './logSearchService';
import { OutputStreamFactory } from './outputStreamFactory';
import { RequestHandler } from './requestHandler';
import { serviceExecutor } from './serviceExecutor';
import { SessionObjectStorage } from './sessionObjectStorage';
import { ResponseTransformer } from './transformers/responseTransformer';
import { WorkerPool } from './workerPool';

export const createRequestHandler = () => {
  const workerPoolForConcurrentProcessing = new WorkerPool(
    serviceExecutor,
    Configuration.maxWorkersForFilter,
  );

  const workerPoolForSequentialProcessing = new WorkerPool(
    serviceExecutor,
    1,
  );
  const sessionObjectStorage = new SessionObjectStorage();

  return new RequestHandler(
    new LogSearchService(
      sessionObjectStorage,
      workerPoolForConcurrentProcessing,
      workerPoolForSequentialProcessing,
    ),
    sessionObjectStorage,
    new ResponseTransformer(),
    new OutputStreamFactory(),
  );
};
