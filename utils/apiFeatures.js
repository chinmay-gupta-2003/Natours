class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const exculdedFields = ['sort', 'page', 'limit', 'fields'];

    const queryObj = { ...this.queryString };
    exculdedFields.forEach((queryItem) => delete queryObj[queryItem]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (matched) => `$${matched}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortByStr = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortByStr);
    } else {
      this.query = this.query.sort('price -rating duration');
    }
    return this;
  }

  selectFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(`-_id ${fields}`);
    } else {
      this.query = this.query.select('-_id -__v');
    }
    return this;
  }

  pagination() {
    const skipToPage = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 20;
    const skippedTours = limit * (skipToPage - 1);

    this.query = this.query.skip(skippedTours).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
