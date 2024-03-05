import { FileNotExistsError } from "../models/exceptions/fileNotExistsError";
import { LogsObjectMapper } from "./transformers/logsObjectMapper";

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
    const stream = this._outputStreamFactory.newStream(ctx);

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
        stream.end();
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
      stream.end();
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
        stream.end();
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
            this._responseTransformer.writeSystemMessage(stream, 'logs');
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
                this._responseTransformer.writeSystemMessage(stream, 'logs');
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
        } else {
          stream.end();
        }
      }
    }
  }

  async _handleFilter(ctx, fileName, stream, filter, limit) {
    // start the event pushing to make user unblocking if scanning large files
    this._logSearchService.filter({
      fileName,
      filter,
      onNextData: (response) => {
        const logs = response?.logs;
        this._responseTransformer.writeSystemMessage(stream, 'logs');
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
          this._responseTransformer.writeDataObject(stream, LogsObjectMapper
            .toJson(response?.requestId, []));
        }
        stream.end();
      },
    }).catch((error) => {
      this._mapErrorToStatus(error, ctx);
      console.error('cannot search log with key word: %s %s %s', fileName, filter, error);
      this._responseTransformer.writeErrorMessage(stream, error?.message);
      stream.end();
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

    return LogsObjectMapper.toJson(requestId, logs);
  }

  /**
   * map error object to http response status code
   * 200, 400, etc
   */
  _mapErrorToStatus(error, ctx) {
    // TODO: trying to figure out how
    // to pass stream data and set
    // error code at the same time
    // for now just use 200 for everything
    // to allow erro object to be passed
    // as data
    if (error instanceof FileNotExistsError) {
      ctx.status = 200;
    } else {
      ctx.status = 200;
    }
  }

  _getLogsCount(response) {
    const { requestId } = response;

    const sessionObject = this._sessionObjectStorage.get(requestId);

    return sessionObject.logsCount;
  }
}
