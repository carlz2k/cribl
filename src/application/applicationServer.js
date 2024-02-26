import Koa from 'koa';
import { PassThrough } from 'stream';
import { FilePartitioner } from '../services/filePartitioner';
import { FileReadService } from '../services/fileReadService';

const processFile = ({
  fileName, filter,
}) => {
  const LIMIT = 1000;

  const requestId = 'som req 1';
  const partitionSize = 30 * 1000000.00;
  const filePartitioner = new FilePartitioner(partitionSize);

  const partitions = filePartitioner.partition(fileName);

  const partition = partitions[0];

  const fileReadService = new FileReadService();

  return fileReadService.createReadStreamWithTransformer(fileName, {
    start: partition.start,
    end: partition.end,
    partitionId: 0,
    requestId,
  });
};

export const startServer = () => {
  const app = new Koa();
  app.use(async (ctx, next) => {
    if (ctx.path !== '/v1/logs/stream') {
      return next();
    }

    ctx.request.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const readStream = processFile({
      fileName: '2020_Yellow_Taxi_Trip_Data.csv',
    }).reader;

    const stream = new PassThrough();

    readStream.on('readable', function () {
      let page = this.read();
      while (page) {
        const object = JSON.stringify({
          count: page?.length,
          logs: page,
        });
        stream.write(`data: ${object}\n\n`);
        page = this.read();
      }
    }).on('error', (err) => ctx.onerror(err))
      .on('end', () => {
      });

    ctx.status = 200;
    ctx.body = stream;

    return undefined;
  }).listen(8181, () => console.log('Listening'));
};
