import { LogSearchService } from "../logSearchService";
import { serviceExecutor } from "../serviceExecutor";
import { SessionObjectStorage } from "../sessionObjectStorage";
import { WorkerPool } from "../workerPool";

describe('logSearchService', () => {
  test('should search entire file and filter', async () => {
    // TODO: consider mock when having time
    const workerPool = new WorkerPool(serviceExecutor, 10);
    const sessionObjectStorage = new SessionObjectStorage();
    const logSearchService = new LogSearchService(sessionObjectStorage, workerPool);

    const fileName = '2020_Yellow_Taxi_Trip_Data.csv';
    let totalPartitionReturned = 0;

    const numberOfPartitions = 240;
    let nextPartitionId = 240 - 1;

    await logSearchService.filter({
      fileName,
      filter: '3',
      onNextData: (result) => {
        totalPartitionReturned += 1;
        expect(nextPartitionId === result.partitionId);
        nextPartitionId -= 1;
      },
    });

    expect(nextPartitionId).toBe(-1);
    expect(totalPartitionReturned).toBe(numberOfPartitions);
  }, 10000);
});
