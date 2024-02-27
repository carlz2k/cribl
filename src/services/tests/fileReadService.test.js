import { FileReadService } from '../fileReadService';

describe('fileReadService', () => {
  test('should read all lines of a file block with a filter', async () => {
    const fileReadService = new FileReadService();
    const fileName = 'taxi_zone_lookup.csv';

    const lines = await fileReadService.retrieveEntirePartitionWithFilter({
      partition: {
        start: 200, end: 2000, id: 2,
      },
      requestId: 'req1',
      fileName,
      filter: 'Arden Heights',
    });

    expect(lines[0].length).toBe(1);
    expect(lines[0][0].includes(
      '5,"Staten Island","Arden Heights","Boro Zone"')
    ).toBeTruthy;
  });
});
