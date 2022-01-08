const Person = require('./person.model.js');
const Fouls = require('./fouls.model.js');

class Licensee extends Person {
  constructor() {
    super(new Person());
    this.fouls = new Fouls();
    this.licence = null;
  }

  extractFouls(licenseeContent) {
    this.fouls.standard = licenseeContent.filter(content => content.str === "P").length;
    this.fouls.technical = licenseeContent.filter(content => content.str === "T").length;
    this.fouls.unsporting = licenseeContent.filter(content => content.str === "U").length;
    this.fouls.disqualified = licenseeContent.filter(content => content.str === "D").length;
    this.fouls.technicalCoach = licenseeContent.filter(content => content.str === "C").length;
    this.fouls.technicalBench = licenseeContent.filter(content => content.str === "B").length;
  }

  extractFoulsFromStr(licenseeContent) {
    this.fouls.standard = (licenseeContent.match(new RegExp("P", "g")) || []).length;
    this.fouls.technical = (licenseeContent.match(new RegExp("T", "g")) || []).length;
    this.fouls.unsporting = (licenseeContent.match(new RegExp("U", "g")) || []).length;
    this.fouls.disqualified = (licenseeContent.match(new RegExp("D", "g")) || []).length;
    this.fouls.technicalCoach = (licenseeContent.match(new RegExp("C", "g")) || []).length;
    this.fouls.technicalBench = (licenseeContent.match(new RegExp("B", "g")) || []).length;
  }

  isValid() {
    let personValid = super.isValid();

    if(typeof personValid !== "boolean") {
      return personValid;
    } else if (this.licence == null || typeof this.licence != "string") {
      return "Licensee is not valid (licence)";
    } else if(this.fouls == null) {
      return "Licensee is not valid (fouls)";
    }

    return this.fouls.isValid();
  }
}

module.exports = Licensee;
