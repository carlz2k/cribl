export const maxLogsAllowed = 500000;

export const retrieveLogs = (fileName, limit, keyword, onData, onError, onInProgress) => {
  let url = `http://127.0.0.1:8181/v1/streaming/logs?limit=${limit || maxLogsAllowed}&filter=(fileName eq "${fileName}") `;
  if (keyword) {
    url += `and (keyword eq "${keyword}")`
  }
  const events = new EventSource(url);
  events.addEventListener('errorMessage', (event) => {
    const erroObject = JSON.parse(event.data);
    onError(erroObject);
  });

  events.onopen = () => {
    onInProgress(true);
  };

  events.addEventListener('logs', (event) => {
    if (event?.data) {
      onData(event?.data);
    }
  });
  
  events.onerror = event => {
    // disable auto reconnect if server alaready 
    // closes the connection
    if (events.readyState === events.CONNECTING) {
      events.close();
      onInProgress(false);
    } else {
      onError(event);
    }

  }
}