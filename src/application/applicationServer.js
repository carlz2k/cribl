import Koa from 'koa';
import { createRequestHandler } from '../services/servicesFactory';
import { QueryParser } from '../services/transformers/queryParaser';
import { Configuration } from '../models/configuration';

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
        limit = Configuration.totalLogsLimit, keyword, fileName,
      } = queryObject;

      requestHandler.retrieveLogs(ctx, fileName, limit, keyword);
    }

    return next();
  }).listen(8181);
};
