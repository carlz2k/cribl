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

  const reader = fileReadService.createReadStream(fileName, {
    start: partition.start,
    end: partition.end,
    partitionId,
    requestId,
  });

  const lines = (await fileReadService.readStream(reader, filter));
  console.timeEnd(timeLabel);

  return lines;
};

export const ServiceFunctionNames = {
  processFile: 'PROCESS_FILE',
};

export class ServiceLocator {
  static getServiceFunction(functionName) {
    if (functionName === ServiceFunctionNames.processFile) {
      return processFile;
    }

    return undefined;
  }
}
