import { ParallelPartitionProcessingQueue } from '../parallelPartitionProcessingQueue';
import { serviceExecutor } from '../../services/serviceExecutor';
import { WorkerPool } from '../../services/workerPool';

describe('ParallelPartitionProcessingQueue', () => {
  test('should submit only 2 jobs to the worker pool simultaneously', async () => {
    const workerPool = new WorkerPool(serviceExecutor, 10);
    const spyWorkerPoolSubmitFunction = jest.spyOn(workerPool, 'submit');
    const parallelPartitionProcessingQueue = new ParallelPartitionProcessingQueue(5, workerPool, 2);
    const fileName = 'fhv_tripdata_2017-04.csv';

    parallelPartitionProcessingQueue.submit({
      partition: {
        start: 0,
        end: 20,
      },
      fileName,
    });
    parallelPartitionProcessingQueue.submit({
      partition: {
        start: 21,
        end: 40,
      },
      fileName,
    });
    parallelPartitionProcessingQueue.submit({
      partition: {
        start: 41,
        end: 90,
      },
      fileName,
    });
    expect(spyWorkerPoolSubmitFunction).toHaveBeenCalledTimes(3);
  }, 5000);
});
