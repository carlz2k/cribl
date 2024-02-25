import Koa from 'koa';
import { PassThrough } from 'stream';

export const startServer = () => {
  const app = new Koa();
  app.use(async (ctx, next) => {
    if (ctx.path !== '/sse') {
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

    const stream = new PassThrough();

    ctx.status = 200;
    ctx.body = stream;

    setInterval(() => {
      stream.write(`data: ${new Date()}\n\n`);
    }, 1000);

    return undefined;
  })
    .use((ctx) => {
      ctx.status = 200;
      ctx.body = 'ok';
    })
    .listen(8080, () => console.log('Listening'));
};
