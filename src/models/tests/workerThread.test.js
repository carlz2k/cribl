import { ServiceFunctionNames, ServiceLocator } from "../../services/serviceLocator";
import { WorkerRequest } from "../workerRequest";
import { WorkerThread } from "../workerThread";

describe('workerThread', () => {
  test('should send a sync request', () => {
    const serviceLocator = new ServiceLocator();
    const spyExecuteServiceFunction = jest.spyOn(ServiceLocator, 'executeServiceFunction');
    const workerThread = new WorkerThread(serviceLocator, 5);
    workerThread.sendRequestNoThreading(new WorkerRequest(ServiceFunctionNames.retrieveFile, {
      fileName: 'abc',
    }));
    expect(spyExecuteServiceFunction).toHaveBeenCalled();
  }, 12000000);
});
