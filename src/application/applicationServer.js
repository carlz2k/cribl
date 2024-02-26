import Koa from 'koa';
import { PassThrough } from 'stream';
import { FilePartitioner } from '../services/filePartitioner';
import { FileReadService } from '../services/fileReadService';
import { ServiceLocator } from '../services/serviceLocator';
import { LogSearchService } from '../services/logSearchService';
import { SessionObjectStorage } from '../services/sessionObjectStorage';
import { RequestRouter } from '../services/requestRouter';
import { create } from 'browser-sync';

const API = {
  logsStream: '/v1/logs/stream',
};

const createServiceLocator = () => {
  const sessionObjectStorage = new SessionObjectStorage();
  const fileReadService = new FileReadService();
  const logSearchService = new LogSearchService(fileReadService, sessionObjectStorage);
  return new ServiceLocator(logSearchService);
};

const createRequestRouter = () => new RequestRouter();

const processFile = ({
  fileName, filter,
}) => {
  const LIMIT = 1000;

  const requestId = 'som req 1';
  const partitionSize = 30 * 1000000.00;
  const filePartitioner = new FilePartitioner(partitionSize);

  const partitions = filePartitioner.partition(fileName);

  const partition = partitions[partitions.length - 1];

  const fileReadService = new FileReadService();

  return fileReadService.createReadStreamWithTransformer(fileName, {
    start: partition.start,
    end: partition.end,
    partitionId: partitions.length - 1,
    requestId,
  });
};

const logStreamHandler = (ctx, requestRouter) => {
  try {
    ctx.request.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const fileName = '2020_Yellow_Taxi_Trip_Data.csv';

    const stream = new PassThrough();
    ctx.body = stream;
    ctx.status = 200;

    requestRouter.sendLogSearchingRequest({
      fileName,
      onNextData: (response) => {
        const responseString = JSON.stringify(response);
        stream.write(`data: ${responseString}\n\n`);
      },
      onEnd: () => undefined,
      onError: (err) => {
        console.error('cannot search log: %s %s', fileName, err);
        ctx.onerror(err);
        ctx.status = 500;
      },
    });
  } catch (error) {
    console.error('cannot handle the log search : %s', error);
  }

  return undefined;
};

export const startServer = () => {
  const app = new Koa();

  const serviceLocator = createServiceLocator();
  const requestRouter = createRequestRouter();

  app.use(async (ctx, next) => {
    if (API.logsStream === ctx.path) {
      logStreamHandler();
    }

    return next();
  }).listen(8181, () => console.log('Listening'));
};
