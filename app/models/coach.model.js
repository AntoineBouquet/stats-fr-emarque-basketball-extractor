const Licensee = require('./licensee.model.js');

class Coach extends Licensee {
  constructor() {
    super(new Licensee());
    this.totalFouls = null;
  }
}

module.exports = Coach;