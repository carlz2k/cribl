import { FilePartitionSize } from "./filePartitioner";

export class LogSearchService {
  constructor(fileReadService, filePartitionService, workerPool) {
    this._fileReadService = fileReadService;
    this._filePartitionService = filePartitionService;
    this._workerPool = workerPool;
  }

  search({
    fileName,
    filter,
  }) {
    if (filter) {

    }
  }

  /**
   * search with a keyword filter,
   * will try to search more blocks at a time
   * 
   * @param {*} filter 
   */
  _searchWithFilter({
    fileName,
    filter,
  }) {
    if (filter) {
      const fileParitionSize = FilePartitionSize.large;
    }
  }
}
