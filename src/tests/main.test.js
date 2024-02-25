import { FilePartitioner } from '../services/filePartitioner';
import { FileReadService } from '../services/fileReadService';

describe('main', () => {
  const partitionSize = 50 * 1000000.00;
  const filePartitioner = new FilePartitioner(partitionSize);
  const fileReadService = new FileReadService();

  test('should render result', async () => {
    const fileName = 'fhv_tripdata_2017-04.csv';
    const partitions = filePartitioner.partition(fileName);

    const readerList = [];
    const numberOfPartitions = partitions.length;

    const numberOfWorkers = 5;

    for (let i = numberOfPartitions - 1; i > numberOfPartitions - 1 - numberOfWorkers; i -= 1) {
      const partition = partitions[i];
      const reader = fileReadService.createReadStream(fileName, {
        start: partition.start,
        end: partition.end,
        requestId: 'req1',
        partitionId: i,
      });
      readerList.push(reader);
    }

    const content = await Promise.all(
      readerList.map(async (reader) => fileReadService.readStream(reader)),
    );

    expect(content.length).toBe(numberOfWorkers);

    for (const lines of content) {
      expect(lines.length).toBeTruthy;
      expect(lines[lines.length - 1]).toBeTruthy;
    }
  }, 12000000);
});
