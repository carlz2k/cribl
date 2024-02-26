import { Transform } from 'stream';
import { StringDecoder } from 'string_decoder';

export class StreamReverseTransformer extends Transform {
  constructor(opts) {
    super({
      ...opts,
      readableObjectMode: true,
      writeableObjectMode: true,
      objectMode: true,
    });
    const forward = opts?.forward;
    if (forward === undefined) {
      this._forward = false;
    } else {
      this._fowrad = forward;
    }
    this._buffer = [];
  }

  _transform(chunk, enc, callback) {
    this._buffer.push(chunk);
    //console.log('start');
    //console.log(this._buffer);
    callback();
  }

  _flush(callback) {
    console.log('flush'+this._buffer.length);

    for (const block of this._buffer) {
      this.push(block);
    }

    callback();
  }
}
