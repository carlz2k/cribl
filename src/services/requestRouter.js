import EventEmitter from 'events';

const RequestMessaging = {
  logSearching: 'LOG_SEARCHING',
};

/**
 * async request handling using event triggers,
 * this makes the event-streaming APIs non-blocking
 */
export class RequestRouter {
  constructor() {
    this._eventEmitter = new EventEmitter();
    this.onLogSearchingRequest();
  }

  sendLogSearchingRequest() {
    this._eventEmitter.emit(RequestMessaging.logSearching);
  }

  onLogSearchingRequest(id, args) {
    this._eventEmitter.on(RequestMessaging.logSearching, () => {
      
    });
  }
}
