import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';

const WorkerJobInternalEvent = {
  resultReady: 'RESULT_READY',
};

export class WorkerJob {
  constructor(request, onResultReady) {
    this._id = uuidv4();
    this._request = request;
    this._eventTrigger = new EventEmitter();
    this._future = this._onResultReady(onResultReady);
  }

  get id() {
    return this._id;
  }

  get request() {
    return this._request;
  }

  get future() {
    return this._future;
  }

  isReady() {
    return this._ready;
  }

  triggerReady(result) {
    console.log('is ready'+this._eventTrigger.emit);
    this._eventTrigger.emit(WorkerJobInternalEvent.resultReady, result);
  }

  _onResultReady(callback) {
    return new Promise((resolve, reject) => {
      console.log('is ready2'+this._eventTrigger.on);
      this._eventTrigger.on(WorkerJobInternalEvent.resultReady, (result) => {
        try {
          callback(result);
          resolve('some result');
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
