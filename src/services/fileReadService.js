import fs from 'fs';
import { EOL } from 'os';

export class FileReadService {
  createReader(fileName, {
    start, end, requestId, partitionId, encoding = 'latin1',
  }) {
    const reader = fs.createReadStream(fileName, {
      start,
      end,
      encoding,
      // fastest after playing with different values
      highWaterMark: 500 * 1024,
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
      const start = Date.now();
      const result = await new Promise((resolve, reject) => {
        const lines = [];
        streamReader.on('readable', () => {
          try {
            const chunk = streamReader.read();
            if (chunk) {
              const temp = chunk.split(EOL);
              // TODO: seems like this is the bottleneck here
              // concat is the slowest when merging large arrays
              // iteration seems to be fastest, but not fast enough
              // how can we get away without merging arrays;
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
      // console.debug(`finish read ${reader.requestId} ${reader.partitionId} ${lines.length}`);
    } catch (err) {
      console.error(err);
    }

    return [];
  }
}
