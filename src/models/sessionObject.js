import { v4 as uuidv4 } from 'uuid';

/**
 * for managing each request 'session'.  This is important
 * when we use event streaming and there is no database, as we
 * want to keep some sort of state to track multiple chained user requests.
 *
 * also, internally when each request needs to retrieve the same file
 * in multiple iterations, for example, reading / searching a file
 * partition by partition, the progression will be tracked by the id of
 * sessionObject
 */
export class SessionObject {
  constructor() {
    this._id = uuidv4();
  }

  get id() {
    return this._id;
  }

  /**
   * number of logs retrieved so far
   */
  get logCount() {
    return this._logCount;
  }

  set logCount(count) {
    this._logCount = count;
  }

  get nextPartitionId() {
    return this._nextPartitionId;
  }

  set nextPartitionId(pId) {
    this._nextPartitionId = pId;
  }

  get partitionSize() {
    return this._partitionSize;
  }

  set partitionSize(size) {
    this._partitionSize = size;
  }

  get currentChunk() {
    return this._currentChunk;
  }

  set currentChunk(chunk) {
    this._currentChunk = chunk;
  }

  get fileName() {
    return this._fileName;
  }

  set fileName(fileName) {
    this._fileName = fileName;
  }

  get filter() {
    return this._filter;
  }

  set filter(filter) {
    this._filter = this.filter;
  }
}
