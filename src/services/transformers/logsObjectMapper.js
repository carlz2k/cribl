export class LogsObjectMapper {
  static toJson(requestId, logs = []) {
    return {
      count: logs?.length,
      logs: logs.map((log) => ({
        value: log,
      })),
      requestId,
    };
  }
}
