import { v4 as uuidv4 } from 'uuid';
import { FilePartitionSize, FilePartitioner } from './filePartitioner';
import { SessionObject } from '../models/sessionObject';

export class LogSearchService {
  constructor(fileReadService, workerPool, sessionObjectStorage) {
    this._fileReadService = fileReadService;
    this._workerPool = workerPool;
    this._sessionObjectStorage = sessionObjectStorage;
  }

  /**
   * to search one file one chunk at a time with a smaller chunk size
   * because the search always starts from a fixed position and have
   * large enough logs to return, so speed is not a huge concern, regular file scanning is enough
   */
  search({
    fileName,
  }) {
    const partition = this._getParition(fileName, undefined, FilePartitionSize.small);

    const sessionObject = this._sessionObjectStorage.add();

    sessionObject.nextPartitionId = partition.id - 1;

    return this._fileReadService.createReadStreamWithTransformer(fileName, {
      start: partition.start,
      end: partition.end,
      partitionId: partition.id,
      requestId: sessionObject.id,
    });
  }

  searchNext(requestId) {
    const sessionObject = this._sessionObjectStorage.get(requestId);

    if (sessionObject?.partitionId) {
      const partition = this._getParition(
        sessionObject.fileName,
        sessionObject.partitionId,
        FilePartitionSize.small,
      );

      return this._fileReadService.createReadStreamWithTransformer(
        sessionObject.fileName,
        {
          start: partition.start,
          end: partition.end,
          partitionId: partition.id,
          requestId: sessionObject.id,
        },
      );
    }

    return undefined;
  }

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
    const filePartitionService = new FilePartitioner(partitionSize);
    const partitions = filePartitionService.partition(fileName);

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
