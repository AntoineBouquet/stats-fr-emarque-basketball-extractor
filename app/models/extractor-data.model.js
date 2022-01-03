class ExtractorData {
  constructor() {
    this.match = null;
    // code = 0 OK ; code = 1 WARNING ; code = 2 ERROR
    this.result = {code: 0, messages: []};
  }

  isValid() {
    if(this.result == null) return "ExtractorData not valid (result null)";
    else if(this.result.code != 0) return "ExtractorData not valid (code !== 0)";
    else if(this.result.messages.length > 0) return "ExtractorData not valid (messages length > 0)";
    else if(this.match == null) return "ExtractorData not valid (match null)";

    return this.match.isValid();
  }
}

module.exports = ExtractorData;