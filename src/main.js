import {
  isMainThread, parentPort, Worker, workerData,
} from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { FilePartitioner } from './services/filePartitioner.js';
import { FileReadService } from './services/fileReadService.js';

const __filename = fileURLToPath(import.meta.url);

export const execute = async (fileName, {
  partitionSize = 200 * 1000000.00,
}) => {
  if (fileName) {
    if (isMainThread) {
      console.log("start "+Date.now());
      const requestId = uuidv4();
      const filePartitioner = new FilePartitioner(partitionSize);

      const partitions = filePartitioner.partition(fileName);

      const readerList = [];
      const numberOfPartitions = partitions.length;
      let numberOfWorkers = 5;
      if (numberOfPartitions < numberOfWorkers) {
        numberOfWorkers = numberOfPartitions;
      }
      const workers = [];

      for (let i = numberOfPartitions - 1; i > numberOfPartitions - 1 - numberOfWorkers; i -= 1) {
        const partition = partitions[i];

        const worker = new Worker(__filename, {
          workerData: {
            fileName,
            requestId,
            partition,
            partitionId: i,
          },
        });

        workers.push(worker);
      }

      for (let worker of workers) {
        worker.on('error', (err) => { throw err; });
        worker.on('exit', () => {
          console.log("end "+Date.now());
          //console.log(`Thread exiting, ${workers.length} running...`);
        });
        worker.on('message', (msg) => {
          // console.log(msg);
        });
      }
    } else {
      const fileReadService = new FileReadService();
      const {
        partition, requestId, partitionId,
      } = workerData;

      const reader = fileReadService.createReader(fileName, {
        start: partition.start,
        end: partition.end,
        partitionId,
        requestId,
      });

      const lines = await fileReadService.readStream(reader);
      parentPort.postMessage(`${partitionId} ${lines[lines.length - 1]}`);
    }
    return undefined;
  }
};

execute('2020_Yellow_Taxi_Trip_Data.csv', {});
