import _ from 'lodash';
import { SessionObject } from '../../models/sessionObject';
import { RequestHandler } from '../requestHandler';
import { ResponseTransformer } from '../transformers/responseTransformer';

const _mockCtx = () => ({
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
});

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

    expect(result).toEqual({
      logs: [{
        value: 1,
      }, { value: 2 }],
      count: 2,
      requestId: 'reqId',
    });
  });

  test('should write error message if file name is empty', async () => {
    const stream = {
      write: jest.fn(),
      end: jest.fn(),
    };

    const requestHandler = new RequestHandler({
      retrieve: jest.fn(),
    }, {
      update: jest.fn(), get: jest.fn(),
    }, new ResponseTransformer(), {
      newStream: () => stream,
    });

    const ctx = _mockCtx();

    await requestHandler.retrieveLogs(ctx, '', 500);
    expect(ctx.status).toEqual(400);
    expect(stream.write).toHaveBeenCalledWith('event: errorMessage\n');
    expect(stream.write).toHaveBeenCalledWith('data: {"error":{"message":"\'fileName\' cannot be empty"}}\n\n');
    expect(stream.end).toHaveBeenCalled();
  });

  test('should not request next if hit the lmit', async () => {
    const stream = {
      write: jest.fn(),
      end: jest.fn(),
    };

    const sessionObect = new SessionObject();
    sessionObect.logsCount = 60;
    sessionObect.nextPartitionId = 1;

    const logService = {
      retrieve: jest.fn(),
      retrieveNext: jest.fn(),
    };

    const requestHandler = new RequestHandler(logService, {
      update: jest.fn(), get: () => sessionObect,
    }, new ResponseTransformer(), {
      newStream: () => stream,
    });

    const requestId = 'reqId';

    const ctx = _mockCtx();

    await requestHandler._retrieveNext(ctx, stream, requestId, 50);
    expect(logService.retrieveNext).not.toHaveBeenCalled();
    expect(stream.end).toHaveBeenCalled();
  });

  test('should not request next if no more partitions', async () => {
    const stream = {
      write: jest.fn(),
      end: jest.fn(),
    };

    const sessionObect = new SessionObject();
    sessionObect.logsCount = 10;
    sessionObect.nextPartitionId = undefined;

    const logService = {
      retrieve: jest.fn(),
      retrieveNext: jest.fn(),
    };

    const requestHandler = new RequestHandler(logService, {
      update: jest.fn(), get: () => sessionObect,
    }, new ResponseTransformer(), {
      newStream: () => stream,
    });

    const requestId = 'reqId';

    const ctx = _mockCtx();

    await requestHandler._retrieveNext(ctx, stream, requestId, 50);
    expect(logService.retrieveNext).not.toHaveBeenCalled();
    expect(stream.end).toHaveBeenCalled();
  });

  test('should call request next', async () => {
    const stream = {
      write: jest.fn(),
    };

    const sessionObect = new SessionObject();
    sessionObect.logsCount = 20;
    sessionObect.nextPartitionId = 1;

    const logService = {
      retrieve: jest.fn(),
      retrieveNext: jest.fn(),
    };

    const requestHandler = new RequestHandler(logService, {
      update: jest.fn(), get: () => sessionObect,
    }, new ResponseTransformer(), {
      newStream: () => stream,
    });

    const requestId = 'reqId';

    await requestHandler._retrieveNext({}, {}, requestId, 50);
    expect(logService.retrieveNext).toHaveBeenCalled();
  });
});
