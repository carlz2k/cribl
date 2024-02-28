export const Configuration = {
  // set max number of logs to be returned per request, we can make it limitless
  // but this mainly serves as a guarding rail for UI's backpressure when there is
  // no API for ui to control the event sending rate
  // both ui and postman client will freeze for a limit that is beyohd this number.
  // TODO: should implement a rate limit feature to allow client to throttle the response
  totalLogsLimit: 500000,
  rootDir: '/var/log/',
  maxLogsPerPage: 150,
  defaultEncoding: 'latin1',
  maxWorkerPoolSize: 50,
  maxWorkersForFilter: 5,
};
