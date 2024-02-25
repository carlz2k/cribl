import fs from 'fs';
import { EOL } from 'os';
import { StreamSplitTransformer } from './streamSplitTransformer.js';

export class FileReadService {
  createReadStream(fileName, {
    start, end, requestId, partitionId, encoding = 'latin1',
  }, transformer) {
    let reader = fs.createReadStream(fileName, {
      start,
      end,
      encoding,
      highWaterMark: 1 * 1000000,
    });

    if (transformer) {
      reader = reader.pipe(transformer);
    }

    return {
      reader,
      requestId,
      partitionId,
    };
  }

  createReadStreamWithTransformer(fileName, args) {
    return this.createReadStream(fileName, args, new StreamSplitTransformer());
  }

  async readStream(reader, filter) {
    const streamReader = reader.reader;

    const result = await new Promise((resolve, reject) => {
      const lines = [];

      streamReader.on('data', (chunk) => {
        try {
          if (chunk) {
            const temp = chunk.split(EOL);
            for (const line of temp) {
              if (filter) {
                if (line.includes(filter)) {
                  lines.push(line);
                }
              } else {
                lines.push(line);
              }
            }
          }
        } catch (err) {
          reject(err);
        }
      });

      reader.reader.on('end', () => resolve(lines));
      reader.reader.on('error', (error) => {
        reject(error);
      });
    });
    return result;
  }
}
