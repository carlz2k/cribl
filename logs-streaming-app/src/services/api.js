export const maxLogsAllowed = 1000000;

export const retrieveLogs = (fileName, limit, keyword, onData, onError) => {
  let url = `http://127.0.0.1:8181/v1/streaming/logs?limit=${limit || maxLogsAllowed}&filter=(fileName eq "${fileName}") `;
  if (keyword) {
    url += `and (keyword eq "${keyword}")`
  }
  const events = new EventSource(url);
  events.onmessage = event => {
    if (event?.data) {
      onData(event?.data);
    }
  };
  events.onerror = event => {
    onError(event);
  }
}