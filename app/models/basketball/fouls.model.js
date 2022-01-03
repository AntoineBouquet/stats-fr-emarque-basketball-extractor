class Fouls {
  constructor() {
    this.standard = null;
    this.unsporting = null;
    this.technical = null;
    this.disqualified = null;
    this.technicalCoach = null;
    this.technicalBench = null;

  }

  isValid() {
    if (this.standard != null && typeof this.standard != "number") {
      return "Fouls is not valid (standard)";
    } else if (this.unsporting != null && typeof this.unsporting != "number") {
      return "Fouls is not valid (unsporting)";
    } else if (this.technical != null && typeof this.technical != "number") {
      return "Fouls is not valid (technical)";
    } else if (this.disqualified != null && typeof this.disqualified != "number") {
      return "Fouls is not valid (disqualified)";
    } else if (this.technicalCoach != null && typeof this.technicalCoach != "number") {
      return "Fouls is not valid (technicalCoach)";
    } else if (this.technicalBench != null && typeof this.technicalBench != "number") {
      return "Fouls is not valid (technicalBench)";
    }

    return true;
  }
}

module.exports = Fouls;
