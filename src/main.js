import {
  isMainThread, parentPort, Worker, workerData,
} from 'worker_threads';
import cluster from 'cluster';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { FilePartitioner } from './services/filePartitioner.js';
import { FileReadService } from './services/fileReadService.js';


// const __filename = fileURLToPath(import.meta.url);

export const execute = async (fileName, {
  partitionSize = 50 * 1000000.00,
}) => {
  if (fileName) {
    if (cluster.isPrimary) {
      console.log("start " + Date.now());
      const requestId = uuidv4();
      const filePartitioner = new FilePartitioner(partitionSize);

      const partitions = filePartitioner.partition(fileName);

      const readerList = [];
      const numberOfPartitions = partitions.length;
      let numberOfWorkers = 40;
      if (numberOfPartitions < numberOfWorkers) {
        numberOfWorkers = numberOfPartitions;
      }
      const workers = [];

      for (let i = numberOfPartitions - 1; i > numberOfPartitions - 1 - numberOfWorkers; i -= 1) {
        const partition = partitions[i];

        const worker = cluster.fork();
        worker.on("message", ({
          pid,
        }) => {
          console.log(`received message ${pid}`);
          if (worker.process.pid === pid) {
            console.log(`received message2 ${pid}`);
            worker.send({
              partition, requestId, partitionId: i,
            });
          }
        });
      }
    } else {
      const workerInfo = { id: process.env.workerId, pid: process.pid };
      console.log('[Worker ', workerInfo, '] started');
      const fileReadService = new FileReadService();

      process.send({ pid: workerInfo.pid });

      process.on('message', async ({
        partition, requestId, partitionId,
      }) => {
        const start = Date.now();
        const reader = fileReadService.createReader(fileName, {
          start: partition.start,
          end: partition.end,
          partitionId,
          requestId,
        });
        const lines = await fileReadService.readStream(reader);
        // console.log(`${workerInfo.pid} ${partitionId} ${lines[0]}`);
        const end = Date.now();
        console.log(`duration = ${end - start}`);
      });
    }
    return undefined;
  }
};

execute('2020_Yellow_Taxi_Trip_Data.csv', {});
