import Koa from 'koa';
import { PassThrough } from 'stream';
import { createLogSearchService } from '../services/servicesFactory';

const API = {
  logsStream: '/v1/logs/stream',
  logsFilter: '/v1/logs/filter',
};

const logFilterHandler = (ctx, logSearchService) => {
  const stream = new PassThrough();

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

    ctx.body = stream;
    ctx.status = 200;

    // start the event pushing to make user unblocking if scanning large files
    stream.write('event: search in progress\n\n');

    logSearchService.filter({
      fileName,
      onNextData: (response) => {
        const logs = response?.logs;
        if (logs?.length) {
          logs.forEach((block) => {
            if (block?.length) {
              const logsResponse = {
                logs: block,
                count: block.length,
                requestId: response.requestId,
              };
              const responseString = JSON.stringify(logsResponse);
              stream.write(`data: ${responseString}\n\n`);
            }
          });
        }
      },
      filter: '01/11/2020',
    });
  } catch (error) {
    console.error('cannot handle the log search : %s', error);
    ctx.onerror(error);
    ctx.status = 500;
  }

  return undefined;
};

const logRetrieveHandler = (ctx, logSearchService) => {
  const stream = new PassThrough();

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

    ctx.body = stream;
    ctx.status = 200;

    logSearchService.retrieve({
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
    ctx.onerror(error);
    ctx.status = 500;
  }

  return undefined;
};

export const startServer = () => {
  const app = new Koa();

  const logSearchService = createLogSearchService();

  app.use(async (ctx, next) => {
    if (API.logsStream === ctx.path) {
      logRetrieveHandler(ctx, logSearchService);
    } else if (API.logsFilter === ctx.path) {
      logFilterHandler(ctx, logSearchService);
    }

    return next();
  }).listen(8181, () => console.log('Listening'));
};
