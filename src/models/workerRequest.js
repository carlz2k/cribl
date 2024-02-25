/**
 * will be used as a message body shared between primary and worker clusters,
 * so the properties have to be serializable, so cannot use get/set of a class
 */
export class WorkerRequest {
  static createMessage(functionName, parameters) {
    return {
      functionName, parameters,
    };
  }

  static getFunctionName(message) {
    return message?.functionName;
  }

  static getParamters(message) {
    return message?.parameters;
  }
}
