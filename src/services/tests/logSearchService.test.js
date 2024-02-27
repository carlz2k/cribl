import { Configuration } from "../../models/configuration";
import { LogSearchService } from "../logSearchService";
import { serviceExecutor } from "../serviceExecutor";
import { SessionObjectStorage } from "../sessionObjectStorage";
import { WorkerPool } from "../workerPool";

describe('logSearchService', () => {
  const rootDir = Configuration.rootDir;

  beforeEach(() => {
    Configuration.rootDir = '';
  });

  afterEach(() => {
    Configuration.rootDir = rootDir;
  });

  test('should search entire file and filter', async () => {
    // TODO: consider mock when having time
    const workerPool = new WorkerPool(serviceExecutor, 10);
    const sessionObjectStorage = new SessionObjectStorage();
    const logSearchService = new LogSearchService(sessionObjectStorage, workerPool);

    const fileName = '1mb_file.csv';
    let totalPartitionReturned = 0;

    const numberOfPartitions = 1;
    let nextPartitionId = 0;

    await logSearchService.filter({
      fileName,
      filter: 'VendorID',
      onNextData: (result) => {
        totalPartitionReturned += 1;
        expect(nextPartitionId === result.partitionId);
        nextPartitionId -= 1;
      },
      onEnd: () => undefined,
    });

    expect(nextPartitionId).toBe(-1);
    expect(totalPartitionReturned).toBe(numberOfPartitions);
  }, 20000);
});
