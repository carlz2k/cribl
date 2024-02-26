import { FilePartitionSize, FilePartitioner } from './filePartitioner';

export class LogSearchService {
  constructor(fileReadService, sessionObjectStorage) {
    this._fileReadService = fileReadService;
    this._sessionObjectStorage = sessionObjectStorage;
  }

  /**
   * to search one file one partition at a time with a smaller partition size
   * because the search always starts from a fixed position and have
   * enough number of ORDERED logs to return,
   * so speed is not a huge concern, regular sequential file scanning is enough
   */
  search({
    fileName, onNextData, onError, onEnd,
  }) {
    const partition = this._getParition(fileName, undefined, FilePartitionSize.small);

    const sessionObject = this._sessionObjectStorage.add();

    this._createReader(partition, sessionObject, onNextData, onError, onEnd);
  }

  searchNext({
    requestId, onNextData, onError, onEnd,
  }) {
    const sessionObject = this._sessionObjectStorage.get(requestId);

    if (sessionObject?.partitionId) {
      const partition = this._getParition(
        sessionObject.fileName,
        sessionObject.partitionId,
        FilePartitionSize.small,
      );

      this._createReader(partition, sessionObject, onNextData, onError, onEnd);
    }
  }

  /**
   * filter needs to scan the entire file, so there is a
   * performance need to handle the scan efficiently,
   *
   * so the basic idea is to to scan partitions of a file in parallel
   * and use bigger partition size to improve the speed of scanning large files.
   * Benchmarking does show that partitioning and parallel processing
   * do reduce the file processing time by 1-2 second for a 2gb file
   */
  async filter() {
    return undefined;
  }

  _getParition(fileName, partitionId, partitionSize) {
    const filePartitionService = new FilePartitioner(partitionSize);
    const partitions = filePartitionService.partition(fileName);

    const numberOfPartitions = partitions.length;

    if (partitionId) {
      if (partitionId < numberOfPartitions) {
        return partitions[partitionId];
      }
    } else {
      // always return the last partition first
      return partitions[numberOfPartitions - 1];
    }

    return undefined;
  }

  _createReader(partition, sessionObject, onNextData, onError, onEnd) {
    const requestId = sessionObject.id;

    this._sessionObjectStorage.setToNextPartitionId(requestId);

    const { reader } = this._fileReadService.createReadStreamWithTransformer(
      sessionObject.fileName,
      {
        start: partition.start,
        end: partition.end,
        partitionId: partition.id,
        requestId,
      },
    );

    // TODO: move me to fileReadService when having time
    reader.on('readable', () => {
      let page = reader.read();
      // use pause mode to avoid
      // back pressure
      while (page) {
        const response = {
          count: page?.length,
          logs: page,
          requestId,
        };
        onNextData(response);

        page = reader.read();
      }
    }).on('error', onError)
      .on('end', onEnd);

    return reader;
  }
}
