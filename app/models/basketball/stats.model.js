class Stats {
  constructor() {
    this.points = null;
    this.fieldGoalsMade = null;
    this.threePointsMade = null;
    this.twoPointsExtMade = null;
    this.twoPointsIntMade = null;
    this.freeThrowMade = null;
    this.totalFouls = null;
  }

  isValid() {
    if (this.points == null || typeof this.points != "number") {
      return "Stats is not valid (points)";
    } else if (this.fieldGoalsMade == null || typeof this.fieldGoalsMade != "number") {
      return "Stats is not valid (fieldGoalsMade)";
    } else if (this.threePointsMade == null || typeof this.threePointsMade != "number") {
      return "Stats is not valid (threePointsMade)";
    } else if (this.twoPointsExtMade == null || typeof this.twoPointsExtMade != "number") {
      return "Stats is not valid (twoPointsExtMade)";
    } else if (this.twoPointsIntMade == null || typeof this.twoPointsIntMade != "number") {
      return "Stats is not valid (twoPointsIntMade)";
    } else if (this.freeThrowMade == null || typeof this.freeThrowMade != "number") {
      return "Stats is not valid (freeThrowMade)";
    } else if (this.totalFouls == null || typeof this.totalFouls != "number") {
      return "Stats is not valid (totalFouls)";
    }

    return true;
  }
}

module.exports = Stats;
