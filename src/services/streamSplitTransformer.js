import { Transform } from 'stream';
import { StringDecoder } from 'string_decoder';
import { EOL } from 'os';

export class StreamSplitTransformer extends Transform {
  _transform(chunk, enc, callback) {
    try {
      const buf = new StringDecoder('latin1').write(chunk);
      const list = buf.split(EOL);
      for (let i = 0; i < list.length; i += 1) {
        this.push(list[i]);
      }
      callback();
    } catch (err) {
      callback(err);
    }

    return undefined;
  }
}
