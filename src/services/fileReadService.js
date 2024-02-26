import fs from 'fs';
import { StreamSplitTransformer } from './streamSplitTransformer.js';

export class FileReadService {
  createReadStream(fileName, {
    start, end, requestId, partitionId, encoding = 'latin1',
  }, transformer) {
    let reader = fs.createReadStream(fileName, {
      start,
      end,
      encoding,
      highWaterMark: 200 * 1000,
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
    return this.createReadStream(fileName, args, new StreamSplitTransformer({}));
  }

  async readStream(reader, filter) {
    const streamReader = reader.reader;

    const result = await new Promise((resolve, reject) => {
      const lines = [];

      streamReader.pipe(new StreamSplitTransformer({
        filter,
      }));

      reader.reader.on('end', () => resolve(lines));
      reader.reader.on('error', (error) => {
        reject(error);
      });
    });
    return result;
  }
}
