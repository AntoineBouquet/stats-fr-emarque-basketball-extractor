class Match {
  constructor() {
    this.number = null;
    this.category = null;
    this.city = null;
    this.date = null;
    this.hourBegin = null;
    this.hourEnd = null;
    this.referees = [];
    this.teams = [];
    this.history = [];
  }

  isValid() {
    if (this.number == null || typeof this.number != "string") {
      return "Match is not valid (number)";
    } else if (this.category == null || typeof this.category != "string") {
      return "Match is not valid (category)";
    } else if (this.city == null || typeof this.city != "string") {
      return "Match is not valid (city)";
    } else if (this.date == null || typeof this.date != "string") {
      return "Match is not valid (date)";
    } else if (this.hourBegin == null || typeof this.hourBegin != "string") {
      return "Match is not valid (hourBegin)";
    } else if (this.hourEnd == null || typeof this.hourEnd != "string") {
      return "Match is not valid (hourEnd)";
    } else if (this.referees == null || !Array.isArray(this.referees)) {
      return "Match is not valid (referee)";
    } else if (this.teams == null || !Array.isArray(this.teams)) {
      return "Match is not valid (teams)";
    } else if (this.history == null || !Array.isArray(this.history)) {
      return "Match is not valid (history)";
    }

    const refereesValidations = this.referees.map((referee) => referee.isValid());
    if (!refereesValidations.every((validation) => validation === true)) {
      return refereesValidations.filter((v) => typeof v != "boolean").join(", ");
    }

    const teamsValidations = this.teams.map((team) => team.isValid());
    if (!teamsValidations.every((validation) => validation === true)) {
      return teamsValidations.filter((v) => typeof v != "boolean").join(", ");
    }

    const historyValidations = this.history.map((event) => event.isValid());
    if (!historyValidations.every((validation) => validation === true)) {
      return historyValidations.filter((v) => typeof v != "boolean").join(", ");
    }

    return true;
  }
}

module.exports = Match;
