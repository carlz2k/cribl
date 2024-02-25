import fs from 'fs';
import { EOL } from 'os';

export class FileReadService {
  createReadStream(fileName, {
    start, end, requestId, partitionId, encoding = 'latin1',
  }) {
    const reader = fs.createReadStream(fileName, {
      start,
      end,
      encoding,
      highWaterMark: 1 * 1000000,
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
      const start = Date.now();
      const result = await new Promise((resolve, reject) => {
        const lines = [];
        streamReader.on('data', (chunk) => {
          try {
            if (chunk) {
              const temp = chunk.split(EOL);
              Array.prototype.push.apply(lines, temp);
            }
          } catch (err) {
            reject(err);
          }
        });

        reader.reader.on('end', () => resolve(lines));
        reader.reader.on('error', (error) => {
          console.error(error);
          reject(error);
        });
      });

      const end = Date.now();

      console.log(`${result.length} chunk processing ${end - start}`);
      return result;
    } catch (err) {
      console.error(err);
    }

    return '';
  }
}
