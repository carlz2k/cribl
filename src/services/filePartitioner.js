import fs from 'fs';

export class FilePartitioner {
  constructor(partitionSize) {
    this._partitionSize = partitionSize;
  }

  partition(fileName) {
    const partitions = [];

    if (fileName) {
      const stats = fs.statSync(fileName);
      const fileSizeInBytes = stats.size;
      const numberOfPartitions = Math.ceil(fileSizeInBytes / this._partitionSize);
      for (let i = 0; i < numberOfPartitions; i += 1) {
        partitions.push({
          partitionId: i,
          start: i * this._partitionSize,
          end: (i + 1) * this._partitionSize - 1,
        });
      }
    }

    return partitions;
  }
}
