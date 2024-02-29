import { FileNotExistsError } from "../models/exceptions/fileNotExistsError";

/**
 * service for handling http requests
 * should make it framework agnostic
 * but right now given time we have, will just pass around
 * koa's ctx
 */
export class RequestHandler {
  constructor(logSearchService, sessionObjectStorage, responseTransformer, outputStreamFactory) {
    this._logSearchService = logSearchService;
    this._sessionObjectStorage = sessionObjectStorage;
    this._responseTransformer = responseTransformer;
    this._outputStreamFactory = outputStreamFactory;
  }

  retrieveLogs(ctx, fileName, limit, filter) {
    const stream = this._outputStreamFactory.newStream();

    try {
      ctx.req.socket.setTimeout(0);
      ctx.req.socket.setNoDelay(true);
      ctx.req.socket.setKeepAlive(true);

      ctx.set({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      ctx.body = stream;
      ctx.status = 200;

      if (!fileName) {
        ctx.status = 400;
        this._responseTransformer.writeErrorMessage(stream, '\'fileName\' cannot be empty');
        // TODO: has to figure out how to close res automatically
        // if we close the connection right away, error message would not be shown
        // has to add some delay, but there is probably a better way
        // ctx.res.end();
        return undefined;
      }

      if (filter) {
        this._handleFilter(ctx, fileName, stream, filter, limit);
      } else {
        this._handleRetrieveOnly(ctx, stream, fileName, limit);
      }
    } catch (error) {
      console.error('cannot handle the log search : %s', error);
      ctx.status = 500;
      this._responseTransformer.writeErrorMessage(stream, error?.message);
      ctx.res.end();
    }

    return undefined;
  }

  /**
   * retrieve partition one by one from last partition first
   * _retrieveFirst returns the first partition
   * then recursively calls _retrieveNext for other partitions
   */
  async _handleRetrieveOnly(ctx, stream, fileName, limit) {
    return this._retrieveFirst(stream, fileName, limit)
      .then((requestId) => this._retrieveNext(ctx, stream, requestId, limit))
      .catch((error) => {
        this._mapErrorToStatus(error, ctx);
        console.error('cannot search log: %s %s', fileName, error);
        this._responseTransformer.writeErrorMessage(stream, error?.message);
        ctx.res.end();
      });
  }

  async _retrieveFirst(stream, fileName, limit) {
    return new Promise((resolve, reject) => {
      let requestId;
      this._logSearchService.retrieve({
        fileName,
        onNextData: (response) => {
          requestId = response?.requestId;
          const responseObject = this._updateResponse(response, limit);
          if (responseObject) {
            this._responseTransformer.writeDataObject(stream, responseObject);
          }
        },
        onEnd: () => {
          resolve(requestId);
        },
        onError: (err) => {
          console.error(err);
          reject(err);
        },
      }).catch((err) => {
        console.error(err);
        reject(err);
      });
    });
  }

  async _retrieveNext(ctx, stream, requestId, limit) {
    if (requestId) {
      const sessionObect = this._sessionObjectStorage.get(requestId);
      if (sessionObect) {
        const logsCount = this._getLogsCount({
          requestId,
        });
        if (logsCount < limit) {
          this._logSearchService.retrieveNext({
            requestId,
            onNextData: (response) => {
              const responseObject = this._updateResponse(response, limit);
              if (responseObject) {
                this._responseTransformer.writeDataObject(stream, responseObject);
              }
            },
            onEnd: () => {
              this._retrieveNext(ctx, stream, requestId, limit);
            },
            onError: (err) => {
              throw err;
            },
          });
        }
      }
    }
  }

  async _handleFilter(ctx, fileName, stream, filter, limit) {
    // start the event pushing to make user unblocking if scanning large files
    this._responseTransformer.writeSystemMessage(stream, 'search in progress');

    this._logSearchService.filter({
      fileName,
      filter,
      onNextData: (response) => {
        const logs = response?.logs;
        logs.forEach((block) => {
          if (block?.length) {
            const logsResponse = {
              logs: block,
              count: block.length,
              requestId: response.requestId,
            };

            const responseObject = this._updateResponse(logsResponse, limit);

            if (responseObject) {
              this._responseTransformer.writeDataObject(stream, responseObject);
            }
          }
        });
      },
      limit,
      onEnd: (response) => {
        if (this._getLogsCount(response) === 0) {
          this._responseTransformer.writeSystemMessage(stream, 'no records found');
        }
        ctx.res.end();
      },
    }).catch((error) => {
      this._mapErrorToStatus(error, ctx);
      console.error('cannot search log with key word: %s %s %s', fileName, filter, error);
      this._responseTransformer.writeErrorMessage(stream, error?.message);
      ctx.res.end();
    });
  }

  _updateResponse(response, limit) {
    const { requestId } = response;

    const sessionObject = this._sessionObjectStorage.get(requestId);

    const logsCount = this._getLogsCount(response);

    if (logsCount >= limit) {
      return '';
    }

    let logs = response?.logs;
    const count = logs?.length;

    // prune data if backend sends over the limit
    if (logsCount + count > limit) {
      const size = limit - logsCount;
      logs = logs.slice(0, size);
    }

    sessionObject.logsCount = Math.min(logsCount + count, limit);
    this._sessionObjectStorage.update(sessionObject);

    return {
      ...response,
      logs,
      count: logs.length,
    };
  }

  _mapErrorToStatus(error, ctx) {
    if (error instanceof FileNotExistsError) {
      ctx.status = 400;
    } else {
      ctx.status = 500;
    }
  }

  _getLogsCount(response) {
    const { requestId } = response;

    const sessionObject = this._sessionObjectStorage.get(requestId);

    return sessionObject.logsCount;
  }
}
