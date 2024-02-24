import { FilePartitioner } from '../filePartitioner';
import { FileReadService } from '../fileReadService';

describe('fileReadService', () => {
  const partitionSize = 50 * 1000000.00;
  const filePartitioner = new FilePartitioner(partitionSize);
  const fileReadService = new FileReadService();
  const numberOfWorkers = 10;

  test('should render result', async () => {
    const fileName = '2020_Yellow_Taxi_Trip_Data.csv';
    const partitions = filePartitioner.partition(fileName);

    const readerList = [];
    const numberOfPartitions = partitions.length;

    for (let i = numberOfPartitions - 1; i > numberOfPartitions - 1 - numberOfWorkers; i -= 1) {
      const partition = partitions[i];
      const reader = fileReadService.createReader(fileName, {
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
