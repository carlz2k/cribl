import { WorkerPool } from '../workerPool';

describe('workerPool', () => {
  test('should render result', async () => {
    const workerPool = new WorkerPool(5);
    workerPool.request({
      a: 'a',
    });
    workerPool.request({
      a: 'c',
    });
  }, 12000000);
});
