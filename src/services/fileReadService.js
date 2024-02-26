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
      transformers.forEach((transformer) => {
        reader = reader.pipe(transformer);
      });
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

  /**
   * merge chunks into whole partition and return
   * the entire partition back to client.
   *
   * because it is slow to merge
   * large arrays, we will use this for filter scenario
   * only because we need to merge the partitions together
   * before passing back to the client (as the filter operation
   * processes multiple partitions in parallel,
   * the partitions returned would be out of order)
   */
  async readStream(reader) {
    const streamReader = reader.reader;

    const result = await new Promise((resolve, reject) => {
      let lines = [];

      streamReader.on('data', (chunk) => {
        if (chunk) {
          lines = Array.prototype.concat(lines, chunk);
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
