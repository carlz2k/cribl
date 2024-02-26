import fs from 'fs';
import { StreamSplitWithReverseTransformer } from './streamSplitWithReverseTransformer.js';

export class FileReadService {
  createReadStream(fileName, {
    start, end, requestId, partitionId, encoding = 'latin1',
  }, transformers) {
    let reader = fs.createReadStream(fileName, {
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
      new StreamSplitWithReverseTransformer({})]);
  }

  async readStream(reader) {
    const streamReader = reader.reader;

    const result = await new Promise((resolve, reject) => {
      const lines = [];

      streamReader.on('data', (chunk) => {
        if (chunk) {
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
