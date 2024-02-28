import { v4 as uuidv4 } from 'uuid';
import Benchmark from 'benchmark';
import { WorkerRequest } from './models/workerRequest.js';
import { FilePartitioner } from './services/filePartitioner.js';
import { ServiceFunctionNames } from './services/serviceExecutor.js';
import { WorkerPool } from './services/workerPool.js';

const largeFile = '2020_Yellow_Taxi_Trip_Data.csv';

/**
 * a benchmark test for parsing a really large file
 */
const benchmarkTest = async () => {
  const partitionSize = 10 * 1000000;// FilePartitionSize.large;
  const fileName = largeFile;
  const requestId = uuidv4();
  const filePartitioner = new FilePartitioner(partitionSize);

  const partitions = filePartitioner.partition(fileName);

  const numberOfPartitions = partitions.length;

  let numberOfWorkers = 1;

  if (numberOfPartitions < numberOfWorkers) {
    numberOfWorkers = numberOfPartitions;
  }

  const timeLabel = 'test benchmark';

  console.time(timeLabel);

  const workerPool = new WorkerPool(numberOfWorkers);
  const resultMap = new Map();
  const futures = [];
  let nextPartition = numberOfPartitions - 1;

  for (let i = numberOfPartitions - 1; i >= numberOfPartitions / 2; i -= 1) {
    const partition = partitions[i];

    const functionName = ServiceFunctionNames.processFile;

    const workerJob = workerPool.submit(
      WorkerRequest.createMessage(functionName, {
        partition, requestId, partitionId: i, fileName, start: Date.now(), filter: '05',
      }),
      (result) => {
        const partitionId = i;
        console.log('current parition returned ' + partitionId + ' ' + nextPartition + ' ' + result?.length);
        if (nextPartition == i) {
          nextPartition = nextPartition - 1;
        } else {
          resultMap.set(i, result);

          if (resultMap.has(nextPartition)) {
            while (resultMap.has(nextPartition)) {
              resultMap.delete(nextPartition);
              nextPartition = nextPartition - 1;
            }
          }
        }
      },
    );

    futures.push(workerJob.future);
  }

  try {
    const result = await Promise.all(futures);

    console.log('total ' + result?.length + ' requests');

    console.timeEnd(timeLabel);

    return result;
  } catch (error) {
    console.log(error);
  }
};

const suite = new Benchmark.Suite('Benchmark filter 2.3gb file test');
suite
  .add('benchmark filter 2.3gb file test', () => {
    benchmarkTest();
  })
  .add('String#indexOf', () => 'Hello World!'.indexOf('o') > -1)
  .run();
