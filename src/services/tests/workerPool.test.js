import { WorkerPool } from '../workerPool';

describe('workerPool', () => {
  test('should submit a task successfully', async () => {
    const workerPool = new WorkerPool(5);
    const workerJob = workerPool.submit({
      id: 'some req',
    }, jest.fn());
    expect(workerJob.id).toBeDefined();
  }, 12000000);
});
