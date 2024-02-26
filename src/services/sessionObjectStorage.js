import { lru } from 'tiny-lru';
import { SessionObject } from '../models/sessionObject';

/**
 * for storing request session object.
 *
 * use a lru cache to reduce the memory footprint
 * to make sure there is no memory leak
 * any request session that is dormant for 10 minutes
 * will be removed.
 * just a poc to show that memory efficiency / server stability is part of
 * the non functional requirement.
 */
export class SessionObjectStorage {
  constructor() {
    this._map = lru(30000, 10 * 60 * 1000);
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

  setToNextPartitionId(id) {
    const object = this.get(id);
    if (object && object.nextPartitionId > 0) {
      object.nextPartitionId -= 1;
      this.update(object);
    }
  }
}
