import fs from 'fs';
import { EOL } from 'os';

export class FileReadService {
  createReader(fileName, {
    start, end, requestId, partitionId,
  }) {
    const reader = fs.createReadStream(fileName, {
      start,
      end,
    });

    reader.on('error', (error) => {
      console.error(`${requestId} ${partitionId} error: ${error.message}`);
    });

    reader.on('close', () => {
      console.debug(`${requestId} ${partitionId} closed`);
    });

    return {
      reader,
      requestId,
      partitionId,
    };
  }

  async readStream(reader) {
    const streamReader = reader.reader;

    try {
      const text = await new Promise((resolve, reject) => {
        let data = '';
        streamReader.on('readable', () => {
          try {
            let chunk = streamReader.read();
            while (chunk) {
              data += chunk;
              chunk = streamReader.read();
            }
          } catch (err) {
            reject(err);
          }
        });

        reader.reader.on('end', () => resolve(data));
        reader.reader.on('error', (error) => {
          console.error(error);
          reject(error);
        });
      });

      const lines = text.split(EOL);

      console.debug(`finish read ${reader.requestId} ${reader.partitionId} ${lines.length}`);

      return lines;
    } catch (err) {
      console.error(err);
    }

    return undefined;
  }
}
