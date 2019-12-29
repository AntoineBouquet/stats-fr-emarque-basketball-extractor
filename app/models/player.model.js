const Stats = require('../models/stats.model.js');
const Licensee = require('./licensee.model');

class Player extends Licensee {
  constructor() {
    super(new Licensee());
    this.shirtNumber = null;
    this.playedTime = null;
    this.captain = false;
    this.stats = new Stats();
  }
}

module.exports = Player;
