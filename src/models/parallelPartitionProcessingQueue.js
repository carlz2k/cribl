import { EventEmitter } from 'events';
import { Configuration } from './configuration';
import { ServiceFunctionNames } from '../services/serviceExecutor';
import { WorkerRequest } from './workerRequest';

const InternalPartitionProcessingEvents = {
  partitionProcessingFinished: 'PARTITION_PROCESSING_FINISH',
  partitionProcessingSubmitted: 'PARTITION_PROCESSING_SUBMITTED',
  allProcessed: 'ALL_PROCESSED',
};

/**
 * use this class if you need to handleconcurrent processing of multiple partitions of the same file
 * and have to process the results in order
 *
 * the queue is synchronized
 */
export class ParallelPartitionProcessingQueue {
  constructor(nextPartitionToBeProcessed, workerPool, maxWorkersAllowed, logsLimit, onEnd) {
    this._nextPartitionToBeProcessed = nextPartitionToBeProcessed;
    this._temporaryResultMap = new Map();
    this._futurePartitionProcessingQueue = [];
    this._eventTrigger = new EventEmitter();
    this._isFinished = false;
    this._workerPool = workerPool;
    this._numberOfSubmissionBeingProcessed = 0;
    this._totalNumberOfLogsRetrieved = 0;
    this._logsLimit = logsLimit || Configuration.totalLogsLimit;
    this._maxWorkersAllowed = maxWorkersAllowed || Configuration.maxWorkersForFilter;
    this.onPartitionProcessingSubmitted();
    this.onPartitonProcessingFinished();
    this._future = this.onEnd();
    this._onEndCallback = onEnd;
  }

  finish(partitonId, result) {
    if (!this._isFinished) {
      this._temporaryResultMap.set(partitonId, result);
      this._eventTrigger.emit(InternalPartitionProcessingEvents.partitionProcessingFinished);
    }
  }

  submit(args) {
    if (!this._isFinished) {
      this._futurePartitionProcessingQueue.push(args);
      this._eventTrigger.emit(InternalPartitionProcessingEvents.partitionProcessingSubmitted);
    }
  }

  destroy() {
    this._futurePartitionProcessingQueue = undefined;
    this._temporaryResultMap = undefined;
  }

  /**
   * process _futurePartitionProcessingQueue when new ones are submitted
   * only allows specified number of jobs running in parallel in worker pool
   */
  onPartitionProcessingSubmitted() {
    this._eventTrigger.on(InternalPartitionProcessingEvents.partitionProcessingSubmitted, () => {
      while (
        !this._isFinished
        && this._futurePartitionProcessingQueue?.length
        && this._numberOfSubmissionBeingProcessed < this._maxWorkersAllowed) {
        this._numberOfSubmissionBeingProcessed += 1;

        const object = this._futurePartitionProcessingQueue.shift();
        const {
          fileName, filter, onNextData, partition, requestId,
        } = object;

        const request = WorkerRequest.createMessage(ServiceFunctionNames.filterFile, {
          partition, requestId, fileName, filter,
        });
        const onResult = (result) => {
          this.finish(partition?.id, {
            requestId,
            result,
            onNextData,
          });
        };

        this._workerPool.submit(request, onResult);
      }
    });
  }

  /**
   * continue retrieving the next partition in the order from he queue,
   * then send back to client.
   *
   * this is to keep the the process synchronous
   */
  onPartitonProcessingFinished() {
    this._eventTrigger.on(InternalPartitionProcessingEvents.partitionProcessingFinished, () => {
      this._numberOfSubmissionBeingProcessed -= 1;
      this._eventTrigger.emit(InternalPartitionProcessingEvents.partitionProcessingSubmitted);

      if (this._shouldProcessingFinish()) {
        this._eventTrigger.emit(InternalPartitionProcessingEvents.allProcessed);
        return;
      }

      // have to process the result in order
      // this._nextPartitionToBeProcessed tracks which partition should be send
      // to client next, if the partition is not ready then wait
      while (!this._isFinished
        && this._temporaryResultMap.size > 0
        && this._totalNumberOfLogsRetrieved < this._logsLimit
        && this._temporaryResultMap.has(this._nextPartitionToBeProcessed)) {
        const {
          onNextData,
          result,
          requestId,
        } = this._temporaryResultMap.get(this._nextPartitionToBeProcessed);

        if (result?.length) {
          this._totalNumberOfLogsRetrieved += result.length;
        }

        if (onNextData) {
          onNextData({
            logs: result,
            requestId,
            partitionId: this._nextPartitionToBeProcessed,
          });
        }
        this._temporaryResultMap.delete(this._nextPartitionToBeProcessed);
        this._nextPartitionToBeProcessed -= 1;

        if (this._shouldProcessingFinish()) {
          this._eventTrigger.emit(InternalPartitionProcessingEvents.allProcessed);
        }
      }
    });
  }

  onEnd() {
    return new Promise((resolve) => {
      this._eventTrigger.on(InternalPartitionProcessingEvents.allProcessed, () => {
        this._isFinished = true;
        this.destroy();
        if (this._onEndCallback) {
          this._onEndCallback();
        }
        resolve('finished');
      });
    });
  }

  get future() {
    return this._future;
  }

  _shouldProcessingFinish = () => Boolean(
    this._totalNumberOfLogsRetrieved >= this._logsLimit
    || this._nextPartitionToBeProcessed < 0,
  );
}
