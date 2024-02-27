import { RequestHandler } from '../requestHandler';

describe('requestHandler', () => {
  test('should prune logs when hit the limit', async () => {
    const requestHandler = new RequestHandler();
    const result = requestHandler._updateResponse({
      logs: [1, 2, 3, 4, 5, 6], count: 6,
    }, 3, 5);

    expect(result.responseString).toBe('{"logs":[1,2],"count":2}');
    expect(result.totalRecords).toBe(5);
  }, 10000);
});
