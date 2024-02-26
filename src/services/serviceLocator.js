import { v4 as uuidv4 } from 'uuid';
import { FileReadService } from './fileReadService';

export const ServiceFunctionNames = {
  processFile: 'PROCESS_FILE',
  retrieveFile: 'RETRIEVE_FILE',
  filterFile: 'FILTER_FILE',
};

const fileReadService = new FileReadService();

export class ServiceLocator {
  static executeServiceFunction(functionName, args) {
    if (functionName === ServiceFunctionNames.processFile) {
      return ServiceLocator._processFile(args);
    } else if (functionName === ServiceFunctionNames.retrieveFile) {
      return fileReadService.retrieve(args);
    }
    return undefined;
  }

  static _retrieve = (args) => {
    fileReadService.retrieve(args);
  };

  static _processFile = async ({
    partition, requestId, partitionId, fileName, filter,
  }) => {
    // trying to benchmark where the slow execution occurs
    // seems like individual processing fo 10mb is pretty quick
    const timeLabel = `actual file reading and processing time ${uuidv4()}`;
    console.time(timeLabel);

    console.log('here:' + this + ' ' + this?._fileReadService);
    const reader = fileReadService.createReadStreamWithTransformer(fileName, {
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
