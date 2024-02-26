import { SessionObject } from '../models/sessionObject';

export class SessionObjectStorage {
  constructor() {
    this._map = new Map();
  }

  get(id) {
    return this._map.get(id);
  }

  add() {
    const sessionObject = new SessionObject();
    this._map.set(sessionObject.id, sessionObject);
    return sessionObject;
  }

  update(sessionObject) {
    this._map.set(sessionObject.id, sessionObject);
  }
}
