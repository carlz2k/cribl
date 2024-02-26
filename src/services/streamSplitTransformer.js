import { Transform } from 'stream';
import { EOL } from 'os';
import { StringDecoder } from 'string_decoder';

export class StreamSplitTransformer extends Transform {
  constructor(opts) {
    super({ ...opts, readableObjectMode: true, writeableObjectMode: true });
    this._filter = opts?.filter;
    this._encoding = opts?.encoding || 'latin1';
  }

  _transform(chunk, enc, callback) {
    const buf = new StringDecoder(this._encoding).write(chunk);
    let lines = buf.split('\n');
    if (this._filter) {
      lines = lines.filter((line) => line.includes(this._filter));
    }
    const limit = 10;

    let count = 0;

    let linesGroup = [];

    if (lines?.length <= limit) {
      this.push(lines);
    } else {
      for (const line of lines) {
        if (count < limit) {
          linesGroup.push(line);
          count += 1;
        } else {
          this.push(linesGroup);
          linesGroup = [];
          count = 0;
        }
      }

      if (linesGroup?.length) {
        this.push(linesGroup);
      }
    }

    callback(); // next can only be called once.
  }
}
