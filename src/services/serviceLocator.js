import { v4 as uuidv4 } from 'uuid';
import { FileReadService } from "./fileReadService.js";

const processFile = async ({
  partition, requestId, partitionId, fileName, filter,
}) => {
  const fileReadService = new FileReadService();

  // trying to benchmark where the slow execution occurs
  // seems like individual processing fo 10mb is pretty quick
  const timeLabel = `actual file reading and processing time ${uuidv4()}`;
  console.time(timeLabel);

  const reader = fileReadService.createReadStreamWithTransformer(fileName, {
    start: partition.start,
    end: partition.end,
    partitionId,
    requestId,
  });

  const lines = (await fileReadService.readStream(reader, filter));
  console.timeEnd(timeLabel);

  return lines;
};

const processNextPartition = async (requestId, args) => {
};

export const ServiceFunctionNames = {
  processFile: 'PROCESS_FILE',
  search: 'SEARCH',
  searchNext: 'SEARCH_NEXT',
  filter: 'FILTER',
};

export class ServiceLocator {
  constructor(_logSearchService) {
    this._logSearchService = _logSearchService;
  }

  getServiceFunction(functionName) {
    if (functionName === ServiceFunctionNames.processFile) {
      return processFile;
    } else if (functionName === ServiceFunctionNames.search) {
      return this._logSearchService.search;
    }

    return undefined;
  }
}
