import { v4 as uuidv4 } from 'uuid';
import { FileReadService } from './fileReadService';

export const ServiceFunctionNames = {
  processFile: 'PROCESS_FILE',
  retrieveFile: 'RETRIEVE_FILE',
  filterFile: 'FILTER_FILE',
};

export class ServiceExecutor {
  constructor(fileReadService) {
    this._fileReadService = fileReadService;
  }

  async executeServiceFunction(functionName, args) {
    if (functionName === ServiceFunctionNames.processFile) {
      return this._processFile(args);
    } else if (functionName === ServiceFunctionNames.retrieveFile) {
      return this._fileReadService.retrieve(args);
    } else if (functionName === ServiceFunctionNames.filterFile) {
      return this._fileReadService.retrieveEntirePartitionWithFilter(args);
    }
    return undefined;
  }

  _processFile = async ({
    partition, requestId, partitionId, fileName, filter,
  }) => {
    // trying to benchmark where the slow execution occurs
    // seems like individual processing fo 10mb is pretty quick
    const timeLabel = `actual file reading and processing time ${uuidv4()}`;
    console.time(timeLabel);

    const reader = this._fileReadService.createReadStreamWithTransformer(fileName, {
      start: partition.start,
      end: partition.end,
      partitionId,
      requestId,
      filter,
    });

    const lines = (await this._fileReadService.readStream(reader, filter));
    console.timeEnd(timeLabel);

    return lines;
  };
}

// use a global variable so that Worker Thread can use as it is
// shared between main thread and worker threads
export const serviceExecutor = new ServiceExecutor(new FileReadService());
