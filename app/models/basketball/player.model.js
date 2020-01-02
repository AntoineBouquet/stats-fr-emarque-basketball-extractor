const Stats = require('./stats.model.js');
const Licensee = require('./licensee.model');

class Player extends Licensee {
  constructor() {
    super(new Licensee());
    this.shirtNumber = null;
    this.playedTime = null;
    this.captain = false;
    this.stats = new Stats();
    this.shootPositions = [];

  }
}

module.exports = Player;
