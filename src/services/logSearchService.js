import fs from 'fs';
import { Configuration } from '../models/configuration';
import { ParallelPartitionProcessingQueue } from '../models/parallelPartitionProcessingQueue';
import { WorkerRequest } from '../models/workerRequest';
import { FilePartitionSize, FilePartitioner } from './filePartitioner';
import { ServiceFunctionNames } from './serviceExecutor';

const validator = {
  validateFileName: (fileName) => {
    const fullFileName = `${Configuration.rootDir}${fileName}`;
    if (!fs.existsSync(fullFileName)) {
      throw new Error(`cannot open file ${fullFileName}`);
    }
  },
};

/**
 * the core service for retrieving files
 *
 * @param workerPoolForConcurrentProcessing used by @class{ParallelPartitionProcessingQueue} to
 * break file into small partitions and search in parallel
 * @param workerPoolForSequentialProcessing used by 
 */
export class LogSearchService {
  constructor(
    sessionObjectStorage,
    workerPoolForConcurrentProcessing,
    workerPoolForSequentialProcessing,
  ) {
    this._sessionObjectStorage = sessionObjectStorage;
    this._workerPoolForConcurrentProcessing = workerPoolForConcurrentProcessing;
    this._workerPoolForSequentialProcessing = workerPoolForSequentialProcessing;
  }

  /**
   * to retrieve one file one partition at a time with a smaller partition size
   * because the search always starts from a fixed position and have
   * enough number of ORDERED logs to return,
   * so speed is not a huge concern, regular sequential file scanning is enough
   */
  async retrieve({
    fileName, onNextData, onError, onEnd,
  }) {
    validator.validateFileName(fileName);

    const partition = this._getParition(fileName, undefined, FilePartitionSize.small);

    const sessionObject = this._sessionObjectStorage.add({
      partition,
      fileName,
    });

    this._submitRetrieveRequest(partition, sessionObject, onNextData, onError, onEnd);
  }

  /**
   * to retrieve the next partition, based on requestId, if has not reach the limit of
   * total logs to be returned to the client
   */
  async retrieveNext({
    requestId, onNextData, onError, onEnd,
  }) {
    const sessionObject = this._sessionObjectStorage.get(requestId);

    if (sessionObject?.nextPartitionId) {
      const partition = this._getParition(
        sessionObject.fileName,
        sessionObject.nextPartitionId,
        sessionObject.partitionSize,
      );
      this._submitRetrieveRequest(partition, sessionObject, onNextData, onError, onEnd);
    }
  }

  /**
   * filter needs to scan the entire file, so there is a
   * performance need to handle the scan efficiently,
   *
   * so the basic idea is to to scan partitions of a file in parallel
   * and use bigger partition size to improve the speed of scanning large files.
   * Benchmarking does show that partitioning and parallel processing
   * do reduce the file processing time by 1-2 second for a 2gb file
   */
  async filter({
    fileName, filter, onNextData, limit, onEnd,
  }) {
    validator.validateFileName(fileName);

    const partitions = this._getAllParitions(fileName, FilePartitionSize.large);

    const startingPoint = partitions.length - 1;

    let numberOfPartitonsRemaining = partitions.length;

    const sessionObject = this._sessionObjectStorage.add({
      partition: partitions[startingPoint],
      fileName,
    });

    const requestId = sessionObject.id;

    // make sure the partitions are dispatched in order
    const parallelPartitionProcessingQueue = new ParallelPartitionProcessingQueue(
      startingPoint,
      this._workerPoolForConcurrentProcessing,
      limit,
      () => {
        onEnd({ requestId });
      },
    );

    // use only a portion of the total worker pool for each request to
    // prevent resource starvation
    while (numberOfPartitonsRemaining > 0) {
      const partition = partitions[numberOfPartitonsRemaining - 1];

      numberOfPartitonsRemaining -= 1;
      parallelPartitionProcessingQueue.submit({
        fileName, filter, onNextData, partition, requestId,
      });
    }
    // return a promise when everything is processed (or hit the limit)
    // just in case
    return parallelPartitionProcessingQueue.future;
  }

  _getAllParitions(fileName, partitionSize) {
    const filePartitionService = new FilePartitioner(partitionSize);
    return filePartitionService.partition(fileName);
  }

  _getParition(fileName, partitionId, partitionSize) {
    const partitions = this._getAllParitions(fileName, partitionSize);

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

  _submitRetrieveRequest(partition, sessionObject, onNextData, onError, onEnd) {
    const requestId = sessionObject.id;

    this._sessionObjectStorage.setToNextPartitionId(requestId);

    this._workerPoolForSequentialProcessing.submit(WorkerRequest.createMessage(
      ServiceFunctionNames.retrieveFile,
      {
        partition, requestId, fileName: sessionObject.fileName, onNextData, onError, onEnd,
      },
    ), () => { });
  }
}
