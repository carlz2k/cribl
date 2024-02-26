import { v4 as uuidv4 } from 'uuid';

export class LogSearchService {
  constructor(fileReadService, filePartitionService, workerPool) {
    this._fileReadService = fileReadService;
    this._filePartitionService = filePartitionService;
    this._workerPool = workerPool;
  }

  /**
   * to search one file one chunk at a time with a smaller chunk size
   * because the search always starts from a fixed position and have
   * large enough logs to return, so speed is not a huge concern, regular file scanning is enough
   */
  async search({
    fileName,
  }) {
    // trying to benchmark where the slow execution occurs
    // seems like individual processing of a single partition (10 to 50 mb) is pretty quick
    // even on a slow machine
    const timeLabel = `actual file reading and processing time ${uuidv4()}`;
    console.time(timeLabel);

    const reader = this._fileReadService.createReadStreamWithTransformer(fileName, {
      start: partition.start,
      end: partition.end,
      partitionId: partition.id,
    });
  }

  async searchNext(requestId, args) {

  };

  /**
   * filter needs to scan through a file, so there is a
   * performance to need to handle it efficiently,
   *
   * so need to search in parallel and use bigger chunk size
   * to improve the speed of scanning large files
   */
  async filter() {

  }

  _getParition(fileName, partitionId, partitionSize) {
    const partitions = this._filePartitionService.partition(fileName);

    const numberOfPartitions = partitions.length;

    if (partitionId) {
      if (partitionId < numberOfPartitions) {
        return partitions[partitionId];
      }
    } else {
      // always return the last partition first
      return partitions[numberOfPartitions - 1];
    }

    return undefined;
  }
}
