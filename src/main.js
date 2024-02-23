import readline from 'readline';
import fs from 'fs';
import events from 'events';

export const execute = async (fileName) => {
  if (fileName) {
    const reader = fs.createReadStream(fileName, {
      encoding: null,
      start: 0,
      end: 1000,
    });

    const rl = readline.createInterface({
      input: reader,
    });

    rl.on('line', (line) => {
      console.log(`Line from file: ${line}`);
    });

    await events.once(rl, 'close');
  }
};

execute();
