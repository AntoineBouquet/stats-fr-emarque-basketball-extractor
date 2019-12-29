const Stats = require('./stats.model.js');
const Coach = require('./coach.model.js');
const Scores = require('./scores.model.js');
const History = require('./event.model.js');

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

    this.history = [];
  }
}

module.exports = Team;
