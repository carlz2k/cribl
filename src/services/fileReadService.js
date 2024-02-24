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
              for (const value of temp) {
                lines.push(value);
              }
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
