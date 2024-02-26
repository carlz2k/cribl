import fs from 'fs';
import { Configuration } from '../models/configuration.js';
import { StreamSplitWithReverseTransformer } from './streamSplitWithReverseTransformer.js';

export class FileReadService {
  createReadStream(fileName, {
    start, end, requestId, partitionId, encoding = 'latin1',
  }, transformers) {
    let reader = fs.createReadStream(`${Configuration.rootDir}${fileName}`, {
      start,
      end,
      encoding,
      highWaterMark: 200 * 1000,
    });

    // transformers must be in order
    if (transformers?.length) {
      for (const transformer of transformers) {
        reader = reader.pipe(transformer);
      }
    }

    return {
      reader,
      requestId,
      partitionId,
    };
  }

  createReadStreamWithTransformer(fileName, args) {
    return this.createReadStream(fileName, args, [
      new StreamSplitWithReverseTransformer({
        ...args,
      })]);
  }

  async readStream(reader) {
    const streamReader = reader.reader;

    const result = await new Promise((resolve, reject) => {
      let lines = [];

      streamReader.on('data', (chunk) => {
        if (chunk) {
          lines = Array.prototype.concat(lines, chunk);
          // process chunk
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
