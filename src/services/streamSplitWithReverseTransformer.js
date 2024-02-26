import { EOL } from 'os';
import { Transform } from 'stream';
import { StringDecoder } from 'string_decoder';
import { Configuration } from '../models/configuration';

/**
 * this transformer first splits the chunk into individual lines
 * also will store all the chunk in the buffer in the reverse order
 * and flush at the end.
 * With 10mb per paritition (partition is the parent of chunks)
 * and 50 wokers in the pool, at most we will
 * have 500mb in the memory at the one time, so should be manageable
 *
 * the biggest question would be whether or not writing a manual
 * file read function that reads each partition in the reverse order
 * would be more efficient than this.  probably can test out, but
 * current this seems to be pretty fast even on a slow machine
 * (2gb file in 3 to 4 seconds on a i5 machine, flash storage, with only 8gb memory)
 */
export class StreamSplitWithReverseTransformer extends Transform {
  constructor(opts) {
    super({
      ...opts,
      readableObjectMode: true,
      writeableObjectMode: true,
      objectMode: true,
    });
    this._filter = opts?.filter;
    this._pageLimit = Configuration.maxLogsPerPage;
    if (opts?.pageLimit) {
      this._pageLimit = Math.min(opts?.pageLimit, this._pageLimit);
    }
    const forward = opts?.forward;
    if (forward === undefined) {
      this._forward = false;
    } else {
      this._fowrad = forward;
    }

    // probably can use some library to detect encoding
    this._encoding = opts?.encoding || Configuration.defaultEncoding;
    this._buffer = [];
  }

  _transform(chunk, enc, callback) {
    const buf = new StringDecoder(this._encoding).write(chunk);
    let lines = buf.split(EOL);
    if (this._filter) {
      lines = lines.filter((line) => line.includes(this._filter));
    }
    const limit = this._pageLimit;

    let count = 0;

    let linesGroup = [];

    if (!this._forward) {
      const subBuffer = [];

      // assemble backwards
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (count < limit) {
          linesGroup.push(line);
          count += 1;
        } else {
          subBuffer.push(linesGroup);
          linesGroup = [];
          count = 0;
        }
      }

      if (linesGroup?.length) {
        subBuffer.push(linesGroup);
      }

      if (subBuffer?.length) {
        // last chunk first
        this._buffer = subBuffer.concat(this.buffer);
      }
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

  /**
   * flush the blocks (stored in reverse order) once the entire partition was read
   */
  _flush(callback) {
    this._buffer.forEach((block) => {
      this.push(block);
    });

    callback();
  }
}
