import {
  isMainThread, parentPort, Worker, workerData,
} from 'worker_threads';
import { WorkerRequest } from './workerRequest.js';
import { serviceExecutor } from '../services/serviceExecutor.js';

/**
 * POC for preprocessing a large file in parellel
 * when processing a large file, we could just streaming thre file
 * chunk by chunk, but it is a sequential process, so will be slow
 * when streaming the file back to user
 * With preprocessing using multiple workers, even though the processing of
 * each chunk is still average (2/3 seconds for 50 mb chunk each and 20 workers)
 * but the entire 1 gb file will be processed in parrel for the same duration.
 * I have assume pre-processing is how a production log streaming server is supposed to do
 * when log volumes are large (both number of logs and log size) and repeated actions are performed
 * on the same file.
 *
 * implement the worker thread using worker_threads.
 * initially was using cluster, which has a much better performance
 * was able to handle 2GB reading in 4/5 seconds on average because cluster always forks
 * a new process; however because the communication between parent and child uses serialized
 * strings only while worker threads share memories with parent thread,
 * so for the purpose of memory efficiency which is important for the project because of the limited
 * resources of my laptop, worker thread is used.
 *
 * Worker threads have to compete for resources in the same parent process, and are not build for
 * intensive i/o operations, so the performance is a bit aweful on my laptop,
 * but still should serve as a good POC
 */
export class WorkerThread {
  constructor(
    serviceLocator,
    mainFileName,
  ) {
    this._serviceLocator = serviceLocator;
    this._mainFileName = mainFileName;
  }

  shutdown() {
    if (isMainThread) {
      this._worker.terminate();
      this._ready = false;
    }
  }

  async sendRequestNoThreading(currentRequest) {
    return serviceExecutor.executeServiceFunction(
      WorkerRequest.getFunctionName(currentRequest),
      WorkerRequest.getParamters(currentRequest),
    );
  }

  async sendRequest(currentRequest) {
    return new Promise((resolve, reject) => {
      if (isMainThread) {
        this._createWorker(currentRequest);
        // trying to benchmark where the slow execution occurs
        // not sure why the actual function called by the worker is pretty fast,
        // but the execution of the worker entirely (after worker is created til
        // when result is returned) is really slow (ms vs s), where is the overhead?
        const timeLabel = `total processing time  ${currentRequest?.parameters?.partitionId}`;
        console.time(timeLabel);
        this._worker.on('message', ({
          result, error,
        }) => {
          if (result) {
            console.timeEnd(timeLabel);
            resolve(result);
          } else if (error) {
            reject(error);
          } else {
            resolve(undefined);
          }
        });
      } else {
        resolve(undefined);
      }
    });
  }

  static async handleRequest() {
    if (!isMainThread) {
      try {
        const currentRequest = workerData?.request;
        const result = await serviceExecutor.executeServiceFunction(
          WorkerRequest.getFunctionName(currentRequest),
          WorkerRequest.getParamters(currentRequest),
        );
        parentPort.postMessage({
          result,
        });
      } catch (error) {
        parentPort.postMessage({
          error,
        });
      }
    }
  }

  _createWorker(request) {
    this._worker = new Worker(this._mainFileName, {
      workerData: {
        request,
      },
    });
    this._ready = true;
  }
}
