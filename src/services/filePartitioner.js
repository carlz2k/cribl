import fs from 'fs';
import { Configuration } from '../models/configuration';

export const FilePartitionSize = {
  large: 20 * 1000000, // 20m
  small: 500 * 1000, // 500k
};

export class FilePartitioner {
  constructor(partitionSize) {
    this._partitionSize = partitionSize;
  }

  partition(fileName) {
    const partitions = [];

    if (fileName) {
      const stats = fs.statSync(`${Configuration.rootDir}${fileName}`);
      const fileSizeInBytes = stats.size;
      const numberOfPartitions = Math.ceil(fileSizeInBytes / this._partitionSize);
      for (let i = 0; i < numberOfPartitions; i += 1) {
        partitions.push({
          id: i,
          start: i * this._partitionSize,
          end: (i + 1) * this._partitionSize - 1,
        });
      }
    }

    return partitions;
  }
}
