import EventEmitter from 'events';
import { WorkerJob } from '../models/workerJob.js';
import { WorkerThread } from '../models/workerThread.js';

/**
 * a shared worker pool for handling log file search from different request.
 * the purpose is to minimize the memory foot print and number of file descriptors opened
 *
 * Because all of the user requests share the same worker pool, potentially this can be the
 * bottleneck when TPSs are high, but since in production,
 * the log file indexing should happen in the background not on demand,
 * so the indexing process needs to be redesigned as some daemon processes on
 * single or multiple servers in the background for a more production ready product, then this
 * would not be user blocking. Probably too much a few hours POC.
 */
const WorkerPoolTrigger = {
  workerAssignment: 'WORKER_ASSIGNMENT',
};

export class WorkerPool {
  constructor(serviceLocator, maxPoolSize, mainFileName, multiThreadMode = false) {
    this._multiThreadMode = multiThreadMode;
    // use for synchronize the worker pool
    this._mainFileName = mainFileName;
    this._eventTrigger = new EventEmitter();
    this._busy = new Set();
    this._maxPoolSize = maxPoolSize;
    this._pending = [];
    this._serviceLocator = serviceLocator;
    this._assignPendingRequestToWorker();
  }

  submit(req, onResultReady) {
    const workerJob = new WorkerJob(req, onResultReady);
    this._pending.push(workerJob);
    this._eventTrigger.emit(WorkerPoolTrigger.workerAssignment);
    return workerJob;
  }

  _release(worker) {
    if (worker) {
      if (this._busy.has(worker)) {
        this._busy.delete(worker);
        this._eventTrigger.emit(WorkerPoolTrigger.workerAssignment);
      } else {
        worker.shutdown();
      }
    }
  }

  _poolSize() {
    return this._busy.size;
  }

  _assignPendingRequestToWorker() {
    this._eventTrigger.on(WorkerPoolTrigger.workerAssignment, () => {
      if (this._poolSize() < this._maxPoolSize) {
        while (this._poolSize() < this._maxPoolSize && this._pending?.length) {
          const worker = new WorkerThread(
            this._serviceLocator,
            this._mainFileName,
          );
          this._assignWorker(worker);
        }
      }
    });
  }

  _assignWorker(worker) {
    this._busy.add(worker);
    const workerJob = this._pending.shift();
    const operationPromise = this._multiThreadMode ? worker.sendRequest(
      workerJob.request,
    ) : worker.sendRequestNoThreading(workerJob.request);
    operationPromise.then((result) => {
      workerJob.triggerReady(result);
      this._release(worker);
    });
  }
}
