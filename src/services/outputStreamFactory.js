import { PassThrough } from 'stream';

/**
 * delegate the responsibility of stream creation
 * for looser coupling and easier to mock tests
 */
export class OutputStreamFactory {
  newStream() {
    return new PassThrough();
  }
}
