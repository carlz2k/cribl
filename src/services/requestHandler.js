import { PassThrough } from 'stream';

export class RequestHandler {
  constructor(logSearchService) {
    this._logSearchService = logSearchService;
  }

  retrieveLogs(ctx) {
    const stream = new PassThrough();
    const limit = 50;

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

      let totalRecords = 0;

      this._logSearchService.retrieve({
        limit: limit - totalRecords,
        fileName,

        onNextData: (response) => {
          if (totalRecords < limit) {
            const result = this._updateResponse(response, totalRecords, limit);
            totalRecords = result.totalRecords;
            stream.write(`data: ${result.responseString}\n\n`);
          }
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
  }

  _updateResponse(response, totalRecords, limit) {
    let logs = response?.logs;
    const count = response?.count;

    // prune data if backend sends over the limit
    if (totalRecords + count > limit) {
      const size = limit - totalRecords;
      logs = logs.slice(0, size);
    }

    return {
      responseString: JSON.stringify({
        ...response,
        logs,
        count: logs.length,
      }),
      totalRecords: Math.min(totalRecords + count, limit),
    };
  }
}
