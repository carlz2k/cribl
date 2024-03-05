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
    const maxRecords = 30000;
    const ttl = 10 * 60 * 1000;
    this._map = lru(maxRecords, ttl);
  }

  get(id) {
    return this._map.get(id);
  }

  add({
    partition, fileName,
  } = {}) {
    const sessionObject = new SessionObject();
    sessionObject.nextPartitionId = partition?.id;
    sessionObject.partitionSize = partition?.size;
    sessionObject.fileName = fileName;
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
    } else {
      // if no more partitions return undefined, maybe should use optional
      object.nextPartitionId = undefined;
    }
    this.update(object);
  }
}
