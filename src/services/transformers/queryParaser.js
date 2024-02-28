const FilterParams = {
  fileName: 'fileName',
  keyword: 'keyword',
};

export class QueryParser {
  parse(queryObject = {}) {
    const result = {
      ...queryObject,
    };

    const { filter } = result;

    let filterItems = {};

    if (filter) {
      filterItems = this._parseFilter(filter) || {};
    }

    return {
      limit: result.limit,
      ...filterItems,
    };
  }

  // should build filters into a tree
  // but here we will just parse using hardcoded delimiters
  _parseFilter(filter = '') {
    const result = {};
    const filterItems = filter.replaceAll('(', '').replaceAll(')', '').replaceAll('"', '')
      .replaceAll('\'', '')
      .split('and');
    filterItems.forEach((itemString) => {
      const trimmedItemString = itemString.trim();
      if (trimmedItemString) {
        const filterItemElements = trimmedItemString.split('eq');
        if (filterItemElements.length === 2) {
          const label = filterItemElements[0].trim();
          if (Object.keys(FilterParams).includes(label)) {
            result[label] = filterItemElements[1].trim();
          }
        }
      }
    });

    return result;
  }
}
