import { LogsObjectMapper } from '../logsObjectMapper';

describe('logObjectMppaer', () => {
  test('convert array of logs strings to json object', () => {
    expect(LogsObjectMapper.toJson('req1', [
      'log1', 'log2',
    ])).toEqual({
      count: 2,
      requestId: 'req1',
      logs: [{
        value: 'log1',
      }, {
        value: 'log2',
      }],
    });
  });
});
