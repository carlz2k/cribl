export const Configuration = {
  // set max number of logs to be returned per request, we can make it limitless
  // but this mainly serves as a guarding rail for UI's backpressure when there is
  // no API for ui to control the event sending rate
  totalLogsLimit: 200000,
  rootDir: '/var/log/',
  maxLogsPerPage: 150,
  defaultEncoding: 'latin1',
  maxWorkerPoolSize: 50,
  maxWorkersForFilter: 5,
};
