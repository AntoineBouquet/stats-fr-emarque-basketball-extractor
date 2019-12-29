const Match = require('../models/match.model.js');
const Team = require('../models/team.model.js');
const Player = require('../models/player.model.js');
const Stats = require('../models/stats.model.js');
const Utils = require('../utils/utils');
const Person = require('../models/person.model.js');
ExtractorHandler = require('./extractor-handler.service');

const utils = new Utils();

function RecapExtractor() {}

const extractPlayers = function(contents) {
  let players = [];
  let contentsGroupByY = utils.groupBy('y')(contents);

  Object.keys(contentsGroupByY).forEach(keyY => {
    let playerContent = contentsGroupByY[keyY];
    let player = new Player();

    player.shirtNumber = utils.extractDataFromXY(60, Math.floor(keyY), playerContent);
    player.lastnameFirstname = utils.extractDataFromXY(84, Math.floor(keyY), playerContent);
    player.playedTime  = utils.extractDataFromXY(300, Math.floor(keyY), playerContent);
    player.stats = extractStats(Math.floor(keyY), playerContent);

    players.push(player);
  });

  return players;
};

const extractStats = function(keyY, contents) {
  let stats = new Stats();

  stats.points = utils.extractDataFromXY(332, Math.floor(keyY), contents);
  stats.fieldGoalsMade = utils.extractDataFromXY(365, Math.floor(keyY), contents);
  stats.threePointsMade = utils.extractDataFromXY(400, Math.floor(keyY), contents);
  stats.twoPointsExtMade = utils.extractDataFromXY(428, Math.floor(keyY), contents);
  stats.twoPointsIntMade = utils.extractDataFromXY(460, Math.floor(keyY), contents);
  stats.freeThrowMade = utils.extractDataFromXY(491, Math.floor(keyY), contents);
  stats.totalFouls = utils.extractDataFromXY(522, Math.floor(keyY), contents);

  return stats;
};

RecapExtractor.prototype.extract = function(file) {
  let match = new Match();
  const handler = new ExtractorHandler();

  return new Promise((resolve, reject) =>
    handler.extractHandler(file).then((data) => {
      if(data != null && data.pages != null) {
        data.pages.forEach(page => {
          if(page.pageInfo.num === 1 && page.content != null) {
            let contentPage1 = page.content;

            match.number = utils.extractDataFromXY(218, 100, contentPage1);
            match.date = utils.extractDataFromXY(273, 100, contentPage1);
            match.hourBegin = utils.extractDataFromXY(349,100, contentPage1);
            match.city = utils.extractDataFromXY(402,100, contentPage1);

            let teamHome = new Team(true);
            let teamAway = new Team(false);

            teamHome.name = utils.extractDataFromXY(48, 168, contentPage1);
            teamAway.name = utils.extractDataFromXY(48, 484, contentPage1);

            teamHome.scores.scoreTotal = utils.extractDataFromXY(530, 49, contentPage1);
            teamAway.scores.scoreTotal = utils.extractDataFromXY(530, 65, contentPage1);

            teamHome.statsTotal = extractStats(369, contentPage1);
            teamHome.statsStartingLineup = extractStats(383, contentPage1);
            teamHome.statsBench = extractStats(397, contentPage1);
            teamHome.statsFirstHalf = extractStats(410, contentPage1);
            teamHome.statsSecondHalf = extractStats(424, contentPage1);
            teamHome.statsOvertime = extractStats(437, contentPage1);

            teamAway.statsTotal = extractStats(686, contentPage1);
            teamAway.statsStartingLineup = extractStats(699, contentPage1);
            teamAway.statsBench = extractStats(713, contentPage1);
            teamAway.statsFirstHalf = extractStats(726, contentPage1);
            teamAway.statsSecondHalf = extractStats(740, contentPage1);
            teamAway.statsOvertime = extractStats(753, contentPage1);

            teamHome.players.push(...extractPlayers(contentPage1.filter(content => content.x > 0 && content.y >= 207 && content.y <= 369)));

            teamAway.players.push(...extractPlayers(contentPage1.filter(content => content.x > 0 && content.y >= 523 && content.y <= 686)));

            teamHome.headCoach.lastnameFirstnameReduced = utils.extractDataFromXY(265, 451, contentPage1);
            teamHome.headCoach.totalFouls = utils.extractDataFromXY(527, 451, contentPage1);
            teamAway.headCoach.lastnameFirstnameReduced = utils.extractDataFromXY(265, 767, contentPage1);
            teamAway.headCoach.totalFouls = utils.extractDataFromXY(527, 767, contentPage1);

            match.teams.push(teamHome);
            match.teams.push(teamAway);

            let referee1 = utils.extractDataFromXY(260, 114.2, contentPage1.filter(content => content.x <= 387 && content.y < 170));
            if(referee1) {
              let referee = new Person();
              referee.lastnameFirstnameReduced = referee1;
              match.referees.push(referee);
            }

            let referee2 = utils.extractDataFromXY(422, 114.2, contentPage1.filter(content => content.x >= 398 && content.y < 170));
            if(referee2) {
              let referee = new Person();
              referee.lastnameFirstnameReduced = referee2;
              match.referees.push(referee);
            }

          }
        });
      }

      resolve(match);
    }).catch((err) => reject(err)));
};

module.exports = RecapExtractor;