import { QueryParser } from '../queryParaser';

describe('QueryParser', () => {
  const queryParser = new QueryParser();

  test('should parse fileName, limit, keyword', () => {
    expect(queryParser.parse('')).toEqual({});
    expect(queryParser.parse({ limit: 100 })).toEqual({
      limit: 100,
    });
    expect(queryParser.parse({ limit: 100, filter: '(fileName eq "abc.txt") and (keyword eq "def")' })).toEqual({
      limit: 100,
      fileName: 'abc.txt',
      keyword: 'def',
    });
  });

  test('should parse fileName only', () => {
    expect(queryParser.parse({ limit: 100, filter: '(fileName eq "abc.txt")' })).toEqual({
      limit: 100,
      fileName: 'abc.txt',
    });
  });
});
