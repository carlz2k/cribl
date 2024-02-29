import { PassThrough } from 'stream';

/**
 * delegate the responsibility of stream creation
 * for looser coupling and easier to mock tests
 */
export class OutputStreamFactory {
  newStream(ctx, closeConnectionWhenDone = true) {
    const stream = new PassThrough();
    stream.on('end', () => {
      if (closeConnectionWhenDone) {
        ctx.res.end();
      }

      stream.destroy();
    });

    return stream;
  }
}
