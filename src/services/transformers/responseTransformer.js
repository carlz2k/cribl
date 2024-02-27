export class ResponseTransformer {
  writeSystemMessage(stream, message) {
    const response = this._format(
      {
        type: 'event',
        message,
      },
    );
    stream.write(response);
  }

  writeDataObject(stream, object) {
    stream.write(this._format(
      {
        type: 'data',
        message: object,
      },
    ));
  }

  writeErrorMessage(stream, error) {
    stream.write(
      this._format(
        {
          type: 'error',
          message: {
            error: {
              message: error,
            },
          },
        },
      ),
    );
  }

  _format(data) {
    const {
      type, message,
    } = data;

    if (type === 'event') {
      return `event: ${message}\n\n`;
    }

    if (type === 'data') {
      let messageSting = '';
      if (message) {
        messageSting = JSON.stringify(message);
      }
      return `data: ${messageSting}\n\n`;
    }

    if (type === 'error') {
      let messageSting = '';
      if (message) {
        messageSting = JSON.stringify(message);
      }
      return `event: ${messageSting}\n\n`;
    }

    return '';
  }
}
