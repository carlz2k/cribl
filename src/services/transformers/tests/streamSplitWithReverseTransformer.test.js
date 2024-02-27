import fs from 'fs';
import { Configuration } from '../../../models/configuration';
import { StreamSplitWithReverseTransformer } from '../streamSplitWithReverseTransformer';

describe('StreamSplitWithReverseTransformer', () => {
  test('should handle all chunks without any breaking lines', (done) => {
    const fileName = '1mb_file.csv';
    let firstPage = true;
    const pageLimit = 20;
    const blocks = [];
    fs.createReadStream(`${fileName}`, {
      encoding: Configuration.defaultEncoding,
      highWaterMark: 50 * 1000,
    }).pipe(new StreamSplitWithReverseTransformer({
      pageLimit,
    }))
      .on('data', (page) => {
        blocks.push(page);
      }).on('end', () => {
        for (let i = 0; i < blocks.length; i += 1) {
          const block = blocks[i];
          if (i === blocks.length - 1) {
            expect(block?.length).toBe(19);
          } else {
            expect(block?.length).toBe(pageLimit);
          }
        }
        done();
      });
  }, 5000);
});
