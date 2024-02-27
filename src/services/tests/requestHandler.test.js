import { SessionObject } from '../../models/sessionObject';
import { RequestHandler } from '../requestHandler';
import { ResponseTransformer } from '../transformers/responseTransformer';

describe('requestHandler', () => {
  test('should prune logs when hit the limit', async () => {
    const sessionObject = new SessionObject();
    sessionObject.logsCount = 3;

    const update = jest.fn();
    const get = jest.fn().mockReturnValue(sessionObject);

    const requestHandler = new RequestHandler({}, {
      update, get,
    });

    const result = requestHandler._updateResponse({
      logs: [1, 2, 3, 4, 5, 6], count: 6, requestId: 'reqId',
    }, 5);

    sessionObject.logsCount = 5;

    expect(update).toHaveBeenCalledWith(sessionObject);

    expect(result).toEqual({ logs: [1, 2], count: 2, requestId: 'reqId' });
  });

  test('should write error message if file name is empty', async () => {
    const requestHandler = new RequestHandler({
      retrieve: jest.fn(),
    }, {
      update: jest.fn(), get: jest.fn(),
    }, new ResponseTransformer());

    const ctx = {
      onerror: jest.fn(),
      req: {
        socket: {
          setTimeout: jest.fn(),
          setNoDelay: jest.fn(),
          setKeepAlive: jest.fn(),
        },
      },
      res: {
        end: jest.fn(),
      },
      set: jest.fn(),
    };

    const stream = {
      write: jest.fn(),
    };

    await requestHandler.retrieveLogs(ctx, stream, '', 500);
    expect(ctx.res.end).toHaveBeenCalled();
    expect(stream.write).toHaveBeenCalledWith('event: {"error":{"message":"\'fileName\' cannot be empty"}}\n\n');
  });
});
