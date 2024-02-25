import { FileReadService } from '../fileReadService';

describe('fileReadService', () => {
  test('should rend all lines of a file block', async () => {
    const fileReadService = new FileReadService();
    const fileName = 'taxi_zone_lookup.csv';
    const reader = fileReadService.createReadStream(fileName, {
      start: 200,
      end: 2000,
      requestId: 'req1',
      partitionId: 5,
    });

    const lines = await fileReadService.readStream(reader);
    expect(lines.length).toBe(42);
    expect(lines[1].includes('5,"Staten Island","Arden Heights","Boro Zone"')).toBeTruthy;
    expect(lines[lines.length - 1]).toBe('45,"Manhattan","Chinatown","Yello');
  }, 12000000);
});
