class ExtractorData {
  constructor() {
    this.match = null;
    // code = 0 OK ; code = 1 WARNING ; code = 2 ERROR
    this.result = {code: 0, messages: []};
  }
}

module.exports = ExtractorData;