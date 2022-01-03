const Stats = require('./stats.model.js');
const Licensee = require('./licensee.model');

class Player extends Licensee {
  constructor() {
    super(new Licensee());
    this.shirtNumber = null;
    this.playedTime = null;
    this.captain = false;
    this.starter = false;
    this.stats = new Stats();
    this.shootPositions = [];
  }

  isValid() {
    let licenseeValid = super.isValid();

    if(typeof licenseeValid !== "boolean") {
      return licenseeValid;
    } else if (this.shirtNumber == null || typeof this.shirtNumber != "number") {
      return "Player is not valid (shirtNumber)";
    } else if (this.playedTime == null || typeof this.playedTime != "string") {
      return "Player is not valid (playedTime)";
    } else if (this.captain == null || typeof this.captain != "boolean") {
      return "Player is not valid (captain)";
    } else if (this.starter == null || typeof this.starter != "boolean") {
      return "Player is not valid (starter)";
    } else if(this.stats == null) {
      return "Player is not valid (stats null)"
    } else if(this.shootPositions == null || ! Array.isArray(this.shootPositions)) {
      return "Player is not valid (shoot positions null)"
    }

    const statsValidation = stats.isValid();
    if(typeof statsValidation != "boolean") {
      return statsValidation;
    }

    const shootPositionsValidations = this.shootPositions.map((shootPosition) => shootPosition.isValid());
    if (!shootPositionsValidations.every((validation) => validation === true)) {
      return shootPositionsValidations.filter((v) => typeof v != "boolean").join(", ");
    }

    return true;
  }
}

module.exports = Player;
