import { EOL } from 'os';
import { Transform } from 'stream';
import { StringDecoder } from 'string_decoder';
import { Configuration } from '../../models/configuration';

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
    let lines = this._splitChunk(chunk);

    lines = this._mergePreviousAndGetNextOverflow(lines);

    lines = this._filterLines(lines);

    this._orderAndBundleLinesInPage(lines);

    callback(); // next can only be called once.
  }

  _splitChunk(chunk) {
    const buf = new StringDecoder(this._encoding).write(chunk);
    return buf.split(EOL);
  }

  /**
   * has side effect that merge the previous overflow with the first line
   * and pop the next overflow
   */
  _mergePreviousAndGetNextOverflow(lines) {
    if (lines?.length) {
      let firstLine = lines[0];

      if (firstLine && this._overflow) {
        firstLine = this._overflow + firstLine;
      }

      if (firstLine) {
        lines[0] = firstLine;
      }
    }

    if (lines?.length > 1) {
      this._overflow = lines[lines.length - 1];
    } else {
      this._overflow = undefined;
    }

    if (this._overflow) {
      lines.pop();
    }

    return lines;
  }

  _filterLines(lines) {
    if (this._filter) {
      return lines.filter((line) => this._containsFilter(line));
    }

    return lines;
  }

  /**
   * if this._forward is false, we are going to assemble line by line
   * last line first, and bundle all lines in to pages based on
   * this._pageLimit, this is to help improve the efficiency of allowing
   * a limited number of logs to be passed to clients per event to avoid
   * too many events being sent to clients or too big payload for each event
   */
  _orderAndBundleLinesInPage(lines) {
    const limit = this._pageLimit;

    let count = 0;

    let linesGroup = [];

    if (!this._forward) {
      const subBuffer = [];

      // assemble backwards
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (line) {
          if (count < limit) {
            linesGroup.push(line);
            count += 1;
          } else {
            subBuffer.push(linesGroup);
            linesGroup = [];
            count = 0;
          }
        }
      }

      if (linesGroup?.length) {
        subBuffer.push(linesGroup);
      }

      if (subBuffer?.length) {
        // last chunk first
        this._buffer = subBuffer.concat(this._buffer);
      }
    } else {
      lines.forEach((line) => {
        if (line) {
          if (count < limit) {
            linesGroup.push(line);
            count += 1;
          } else {
            this.push(linesGroup);
            linesGroup = [];
            count = 0;
          }
        }
      });

      if (linesGroup?.length) {
        this.push(linesGroup);
      }
    }
  }

  /**
   * flush the blocks (stored in reverse order) once the entire partition was read
   */
  _flush(callback) {
    // this._overflow is the line that is broken between chunks or partitions
    // thus there is a need to merge the last line of the previous chunk
    // and the first line of the next chunk

    // if the overflow line (last line of the partition) exists at the end of a partition
    // push it as a single page at the begining
    // so that next partition can merge it

    if (this._overflow && this._containsFilter(this._overflow)) {
      this.push([this._overflow]);
    }

    this._buffer.forEach((block) => {
      this.push(block);
    });

    callback();
  }

  _containsFilter(line) {
    return !this._filter || line.includes(this._filter);
  }
}
