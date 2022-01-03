class Scores {
  constructor() {
    this.scoreTotal = null;
    this.scoreFirstQuarter = null;
    this.scoreSecondQuarter = null;
    this.scoreThirdQuarter = null;
    this.scoreFourthQuarter = null;

    this.scoreFirstHalf = null;
    this.scoreSecondHalf = null;

    this.scoreOvertime = null;
  }

  isValid() {
    if (this.scoreTotal == null || typeof this.scoreTotal != "number") {
      return "Scores is not valid (scoreTotal)";
    } else if (this.scoreFirstQuarter != null && typeof this.scoreFirstQuarter != "number") {
      return "Scores is not valid (scoreFirstQuarter)";
    } else if (this.scoreSecondQuarter != null && typeof this.scoreSecondQuarter != "number") {
      return "Scores is not valid (scoreSecondQuarter)";
    } else if (this.scoreThirdQuarter != null && typeof this.scoreThirdQuarter != "number") {
      return "Scores is not valid (scoreThirdQuarter)";
    } else if (this.scoreFourthQuarter != null && typeof this.scoreFourthQuarter != "number") {
      return "Scores is not valid (scoreFourthQuarter)";
    } else if (this.scoreFirstHalf != null && typeof this.scoreFirstHalf != "number") {
      return "Scores is not valid (scoreFirstHalf)";
    } else if (this.scoreSecondHalf != null && typeof this.scoreSecondHalf != "number") {
      return "Scores is not valid (scoreSecondHalf)";
    } else if (this.scoreOvertime != null && typeof this.scoreOvertime != "number") {
      return "Scores is not valid (scoreOvertime)";
    }

    return true;
  }
}

module.exports = Scores;
