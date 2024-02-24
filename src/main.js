import { isMainThread } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import { FilePartitioner } from './services/filePartitioner';
import { FileReadService } from './services/fileReadService';

export const execute = async (fileName, {
  partitionSize = 50 * 1000000.00,
  numberOfWorkers = 10,
}) => {
  if (isMainThread && fileName) {
    const requestId = uuidv4();
    const filePartitioner = new FilePartitioner(partitionSize);
    const fileReadService = new FileReadService();

    const partitions = filePartitioner.partition(fileName);

    const readerList = [];
    const numberOfPartitions = partitions.length;

    for (let i = numberOfPartitions - 1; i > numberOfPartitions - 1 - numberOfWorkers; i -= 1) {
      const partition = partitions[i];
      const reader = fileReadService.createReader(fileName, {
        start: partition.start,
        end: partition.end,
        partitonId: i,
        requestId,
      });
      readerList.push(reader);
    }

    return Promise.all(readerList.map(async (reader) => fileReadService.readStream(reader)));
  }

  return [];
};

// execute('2020_Yellow_Taxi_Trip_Data.csv');
