import { ServiceFunctionNames, serviceExecutor } from "../../services/serviceExecutor";
import { WorkerRequest } from "../workerRequest";
import { WorkerThread } from "../workerThread";

describe('workerThread', () => {
  test('should send a sync request', () => {
    const spyExecuteServiceFunction = jest.spyOn(serviceExecutor, 'executeServiceFunction');
    const workerThread = new WorkerThread(serviceExecutor, 5);
    workerThread.sendRequestNoThreading(new WorkerRequest(ServiceFunctionNames.retrieveFile, {
      fileName: 'abc',
    }));
    expect(spyExecuteServiceFunction).toHaveBeenCalled();
  });
});
