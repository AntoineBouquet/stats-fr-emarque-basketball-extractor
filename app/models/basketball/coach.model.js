const Licensee = require('./licensee.model.js');

class Coach extends Licensee {
  constructor() {
    super(new Licensee());
    this.totalFouls = null;
  }

  isValid() {
    let licenseeValid = super.isValid();

    if(typeof licenseeValid !== "boolean") {
      return licenseeValid;
    } else if (this.totalFouls != null && typeof this.totalFouls != "number") {
      return "Coach is not valid (totalFouls)";
    }

    return true;
  }
}

module.exports = Coach;