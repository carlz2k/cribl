import EventEmitter from 'events';
import { WorkerThread } from '../models/workerThread.js';
import { WorkerJob } from '../models/workerJob.js';

const WorkerPoolTrigger = {
  workerAssignment: 'WORKER_ASSIGNMENT',
};

export class WorkerPool {
  constructor(maxPoolSize, mainFileName, multiThreadMode = false) {
    this._multiThreadMode = multiThreadMode;
    // use for synchronize the worker pool
    this._mainFileName = mainFileName;
    this._eventTrigger = new EventEmitter();
    this._busy = new Set();
    this._maxPoolSize = maxPoolSize;
    this._pending = [];
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
          const worker = new WorkerThread(this._mainFileName);
          this._assignWorker(worker);
        }
      }
    });
  }

  _assignWorker(worker) {
    this._busy.add(worker);
    const workerJob = this._pending.shift();
    const operation = this._multiThreadMode ? worker.sendRequest : worker.sendRequestNoThreading;
    operation(workerJob.request).then((result) => {
      workerJob.triggerReady(result);
      this._release(worker);
    });
  }
}
