import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { isMainThread } from 'worker_threads';
import Benchmark from 'benchmark';
import { startServer } from './application/applicationServer.js';
import { WorkerRequest } from './models/workerRequest.js';
import { WorkerThread } from './models/workerThread.js';
import { FilePartitionSize, FilePartitioner } from './services/filePartitioner.js';
import { ServiceFunctionNames } from './services/serviceExecutor.js';
import { WorkerPool } from './services/workerPool.js';

export const mainFileName = fileURLToPath(import.meta.url);

export const execute = async (fileName, { partitionSize = FilePartitionSize.small }) => {
  if (fileName) {
    if (isMainThread) {
      const requestId = uuidv4();
      const filePartitioner = new FilePartitioner(partitionSize);

      const partitions = filePartitioner.partition(fileName);

      const numberOfPartitions = partitions.length;

      let numberOfWorkers = 3;

      if (numberOfPartitions < numberOfWorkers) {
        numberOfWorkers = numberOfPartitions;
      }

      let start = Date.now();

      const workerPool = new WorkerPool(numberOfWorkers, mainFileName, true);
      const resultMap = new Map();
      const futures = [];
      let nextPartition = numberOfPartitions - 1;

      const numberOfPartitionsRequested = 1;

      for (let i = numberOfPartitions - 1; i >= 0; i -= 1) {
        const partition = partitions[i];

        const functionName = ServiceFunctionNames.processFile;

        const workerJob = workerPool.submit(
          WorkerRequest.createMessage(functionName, {
            partition, requestId, partitionId: i, fileName, start, //filter: '01/13/2020',
          }),
          (result) => {
            const partitionId = i;
            console.log('current parition returned ' + partitionId + ' ' + nextPartition + ' ' + result?.length);
            if (nextPartition == i) {
              console.log('stream next partition' + i);
              nextPartition = nextPartition - 1;
            } else {
              resultMap.set(i, result);

              if (resultMap.has(nextPartition)) {
                while (resultMap.has(nextPartition)) {
                  resultMap.delete(nextPartition);
                  console.log('stream next partition' + nextPartition);
                  nextPartition = nextPartition - 1;
                }
              }
            }

            console.log(`map size = ${resultMap.size}`);
          },
        );

        futures.push(workerJob.future);
      }

      try {
        console.log('total ' + futures?.length + ' requests');

        const result = await Promise.all(futures);

        console.log('all resolved?? ' + result?.length + ' ' + (Date.now() - start));

        return result;
      } catch (error) {
        console.log(error);
      }
    } else {
      await WorkerThread.handleRequest();
    }

    return undefined;
  }
};

const testKoa = () => {
  startServer();
};

const largeFile = '2020_Yellow_Taxi_Trip_Data.csv';
const smallFile = 'taxi_zone_lookup.csv';
const mediumFile = 'fhv_tripdata_2017-04.csv';

const test = async () => {
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

  const workerPool = new WorkerPool(numberOfWorkers, mainFileName);
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
          console.log('stream next partition' + i);
          nextPartition = nextPartition - 1;
        } else {
          resultMap.set(i, result);

          if (resultMap.has(nextPartition)) {
            while (resultMap.has(nextPartition)) {
              resultMap.delete(nextPartition);
              console.log('stream next partition' + nextPartition);
              nextPartition = nextPartition - 1;
            }
          }
        }

        console.log(`map size = ${resultMap.size}`);
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

// test();

// const suite = new Benchmark.Suite();

// add tests
// suite.add('test fetch all', {
//   setup: function() {
//     // Set up the environment for the benchmark
//     // This function is called before each benchmark is run
//     // You can set the number of cycles here
//     this.cycles = 1;
//     this.count = 10;
//   },
//   fn: function() {
//     test();
//   }
// }).on('cycle', function (event) {
//   event.target.options.iterations = 10;
//   console.log(String(event.target));
// })
//   .on('complete', function () {
//     console.log('Fastest is ' + this.filter('fastest').map('name'));
//   })
//   // run async
//   .run({ 'async': false });

testKoa();

//execute(largeFile, {});
//execute(smallFile, {});
//execute(mediumFile, {});
