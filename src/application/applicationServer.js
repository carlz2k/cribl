import Koa from 'koa';
import { PassThrough } from 'stream';
import { createRequestHandler } from '../services/servicesFactory';
import { QueryParser } from '../services/transformers/queryParaser';

const API = {
  logsStream: '/v1/streaming/logs',
};

export const startServer = () => {
  const app = new Koa();

  const requestHandler = createRequestHandler();

  const queryParser = new QueryParser();

  app.use(async (ctx, next) => {
    const queryObject = queryParser.parse(ctx.request.query);

    if (API.logsStream === ctx.path) {
      const {
        limit, keyword, fileName,
      } = queryObject;

      const stream = new PassThrough();

      requestHandler.retrieveLogs(ctx, stream, fileName, limit, keyword);
    }

    return next();
  }).listen(8181);
};
