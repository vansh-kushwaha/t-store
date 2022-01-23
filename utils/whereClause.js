class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    const searchWord = this.bigQ.search
      ? {
          name: {
            $regex: this.bigQ.search,
            $options: "i",
          },
        }
      : {};

    this.base = this.base.find({ ...searchWord });
    return this;
  }

  pager(resultPerPage) {
    let currentPage = 1;
    if (this.bigQ.page) {
      currentPage = this.bigQ.page;
    }
    let skipVal = resultPerPage * (currentPage - 1);
    this.base = this.base.limit(resultPerPage).skip(skipVal);
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };
    delete copyQ["search"];
    delete copyQ["page"];
    delete copyQ["limit"];
    let copyQString = JSON.stringify(copyQ);
    copyQString = copyQString.replace(/\b(gte||lte)\b/g, (m) => `$${m}`);
    const copyQObj = JSON.parse(copyQString);
    this.base = this.base.find(copyQObj);
    return this;
  }

  length() {
    return this.base.count();
  }
}

module.exports = WhereClause;
