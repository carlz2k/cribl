export class ResponseTransformer {
  writeSystemMessage(stream, eventName) {
    const response = this._format(
      {
        type: 'event',
        message: eventName,
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
    this.writeSystemMessage(stream, 'errorMessage');
    stream.write(
      this._format(
        {
          type: 'data',
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
      return `event: ${message}\n`;
    }

    if (type === 'data') {
      let messageSting = '';
      if (message) {
        messageSting = JSON.stringify(message);
      }
      return `data: ${messageSting}\n\n`;
    }

    return '';
  }
}
