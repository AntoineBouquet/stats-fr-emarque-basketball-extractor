const Stats = require("./stats.model.js");
const Coach = require("./coach.model.js");
const Scores = require("./scores.model.js");
const History = require("./event.model.js");

class Team {
  constructor(home) {
    this.name = null;
    this.number = null;
    this.shirtColor = null;
    this.scores = new Scores();
    this.home = home;
    this.players = [];
    this.headCoach = new Coach();
    this.assistantCoach = null;

    this.statsTotal = new Stats();
    this.statsStartingLineup = new Stats();
    this.statsBench = new Stats();

    this.statsFirstHalf = new Stats();
    this.statsSecondHalf = new Stats();
    this.statsOvertime = new Stats();

    this.maxPointsLead = null;
    this.maxPointsSeries = null;
    this.avantageTime = null;

    this.history = [];
  }

  isValid() {
    if (this.name == null || typeof this.name != "string") {
      return "Team is not valid (name)";
    } else if (this.number == null || typeof this.number != "string") {
      return "Team is not valid (number)";
    } else if (this.shirtColor == null || typeof this.shirtColor != "string") {
      return "Team is not valid (shirtColor)";
    } else if (this.scores == null) {
      return "Team is not valid (scores)";
    } else if (this.home == null || typeof this.home != "boolean") {
      return "Team is not valid (home)";
    } else if (this.players == null || !Array.isArray(this.players)) {
      return "Team is not valid (players)";
    } else if (this.headCoach == null) {
      return "Team is not valid (headCoach)";
    } else if (this.statsTotal == null) {
      return "Team is not valid (statsTotal)";
    } else if (this.statsStartingLineup == null) {
      return "Team is not valid (statsStartingLineup)";
    } else if (this.statsBench == null) {
      return "Team is not valid (statsBench)";
    } else if (this.statsFirstHalf == null) {
      return "Team is not valid (statsFirstHalf)";
    } else if (this.statsSecondHalf == null) {
      return "Team is not valid (statsSecondHalf)";
    } else if (this.statsOvertime == null) {
      return "Team is not valid (statsOvertime)";
    } else if (this.maxPointsLead != null && typeof this.maxPointsLead != "number") {
      return "Team is not valid (maxPointsLead)";
    } else if (this.maxPointsSeries != null && typeof this.maxPointsSeries != "number") {
      return "Team is not valid (maxPointsSeries)";
    } else if (this.avantageTime != null && typeof this.avantageTime != "string") {
      return "Team is not valid (avantageTime)";
    } else if (this.history == null || !Array.isArray(this.history)) {
      return "Team is not valid (history)";
    }

    const scoresValidation = this.scores.isValid();
    if (typeof scoresValidation != "boolean") {
      return scoresValidation;
    }

    const headCoachValidation = this.headCoach.isValid();
    if (typeof headCoachValidation != "boolean") {
      return headCoachValidation;
    }

    if (this.assistantCoach != null) {
      const assistantCoachValidation = this.assistantCoach.isValid();
      if (typeof assistantCoachValidation != "boolean") {
        return assistantCoachValidation;
      }
    }

    const statsTotalValidation = this.statsTotal.isValid();
    if (typeof statsTotalValidation != "boolean") {
      return statsTotalValidation;
    }

    const statsStartingLineupValidation = this.statsStartingLineup.isValid();
    if (typeof statsStartingLineupValidation != "boolean") {
      return statsStartingLineupValidation;
    }

    const statsBenchValidation = this.statsBench.isValid();
    if (typeof statsBenchValidation != "boolean") {
      return statsBenchValidation;
    }

    const statsFirstHalfValidation = this.statsFirstHalf.isValid();
    if (typeof statsFirstHalfValidation != "boolean") {
      return statsFirstHalfValidation;
    }

    const statsSecondHalfValidation = this.statsSecondHalf.isValid();
    if (typeof statsSecondHalfValidation != "boolean") {
      return statsSecondHalfValidation;
    }

    const statsOvertimeValidation = this.statsOvertime.isValid();
    if (typeof statsOvertimeValidation != "boolean") {
      return statsOvertimeValidation;
    }

    const historyValidations = this.history.map((event) => event.isValid());
    if (!historyValidations.every((validation) => validation === true)) {
      return historyValidations.filter((v) => typeof v != "boolean").join(", ");
    }

    return true;
  }
}

module.exports = Team;
