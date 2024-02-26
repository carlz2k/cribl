export const Configuration = {
  // set max number of logs to be returned per request, we can make it limitless
  // but this mainly serves as a guarding rail for UI's backpressure when there is
  // no API for ui to control the event sending rate
  logsLimitPerRequest: 10000,
  rootDir: '/var/logs/',
};
