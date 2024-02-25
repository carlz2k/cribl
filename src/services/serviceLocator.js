import { FileReadService } from "./fileReadService.js";

const processFile = async ({
  partition, requestId, partitionId, fileName, start,
}) => {
  const fileReadService = new FileReadService();

  const reader = fileReadService.createReadStream(fileName, {
    start: partition.start,
    end: partition.end,
    partitionId,
    requestId,
  });

  const lines = (await fileReadService.readStream(reader));
  // console.log(`${workerInfo.pid} ${partitionId} ${lines[0]}`);
  const end = Date.now();
  console.log(`${partitionId} duration = ${end - start} ${lines.length}`);

  return lines;
};

export const ServiceFunctionNames = {
  processFile: 'PROCESS_FILE',
};

export class ServiceLocator {
  static getServiceFunction(functionName) {
    console.log('find function name ='+functionName);
    console.log('find function name ='+functionName+" "+ServiceFunctionNames.processFile);
    if (functionName === ServiceFunctionNames.processFile) {
      return processFile;
    }

    return undefined;
  }
}
