const Match = require('../models/basketball/match.model.js');
const Person = require('../models/basketball/person.model.js');
const Player = require('../models/basketball/player.model.js');
const Team = require('../models/basketball/team.model.js');
const Coach = require('../models/basketball/coach.model.js');
const Event = require('../models/basketball/event.model.js');
const EventTypes = require('../models/basketball/event-types.enum');
const Utils = require('../utils/utils');
ExtractorHandler = require('./extractor-handler.service');

const utils = new Utils();

function SheetExtractor() {}

const extractPlayers = function(contents) {
  let players = [];
  let contentsGroupByY = utils.groupBy('y')(contents);

  Object.keys(contentsGroupByY).forEach(keyY => {
    let playerContent = contentsGroupByY[keyY];
    let player = new Player();

    player.shirtNumber = utils.extractDataFromXY(268, Math.floor(keyY), playerContent);
    if(player.shirtNumber == null || isNaN(player.shirtNumber)) {
      player.shirtNumber = utils.extractDataFromXY(266, Math.floor(keyY), playerContent);
    }
    let playerName = utils.extractDataFromXY(122, Math.floor(keyY), playerContent);

    if(playerName) {
      if(playerName.substr(playerName.length - 5, 5) === "(CAP)") {
        player.captain = true;
        player.lastnameFirstnameReduced = playerName.substring(0, playerName.length - 6);
      } else if(playerName.substr(playerName.length - 6, 6) === "(*CAP)") {
        player.captain = true;
        player.lastnameFirstnameReduced = playerName.substring(0, playerName.length - 7);
      } else {
        player.lastnameFirstnameReduced = playerName;
      }
    }

    player.licence = utils.extractDataFromXY(61, Math.floor(keyY), playerContent);

    player.extractFouls(playerContent.filter(content => content.x > 290));

    players.push(player);
  });

  return players;
};

const extractCoach = function(contentLicence, contentName, yStr, yStrReduced, assistant = false) {
  if(contentLicence == null || contentLicence.length === 0 || contentName === null || contentName.length === 0) {
    return null;
  }

  let coach = new Coach();
  let coachStr = utils.extractDataFromXY(22, yStr, contentLicence);

  if(! assistant) {
    coach.licence = coachStr.split(" ").slice(-1)[0];
    coach.lastnameFirstname = coachStr.substring(0, coachStr.indexOf(coach.licence) - 3);
  } else if(coachStr != null) {
    coach.licence = coachStr;
  }

  let coachStrReduced = utils.extractDataFromXY(assistant ? 195 : 166, yStrReduced, contentName);
  if((assistant && coachStrReduced != null) || ! assistant) {
    if(coachStrReduced.indexOf("(CAP)") !== -1) {
      coachStrReduced = coachStrReduced.substring(0, (coachStrReduced.indexOf("(CAP)") - 1));
    } else if(coachStrReduced.indexOf("(*CAP)") !== -1) {
      coachStrReduced = coachStrReduced.substring(0, (coachStrReduced.indexOf("(*CAP)") - 1));
    }

    coach.lastnameFirstnameReduced = coachStrReduced;
    coach.extractFouls(contentName.filter(content => content.x > 300 && content.y >= yStr - 2 && content.y <= yStrReduced + 2));
  }

  return coach
};

const extractHistoryScore = function(content, homeTeam = true) {
  let firstLineY = 152;
  let rowSize = 12.96;
  let currentScoreColumn = 0;
  let deltaPointColumn = 0;
  let history = [];
  let indexOrder = 0;

  let process = (columnX) => {
    content.filter(content => Math.floor(content.x) >= columnX - 2 && Math.floor(content.x) <= columnX + 2)
      .sort((contentA, contentB) => contentA.y - contentB.y)
      .forEach(content => {
        let points = Math.floor((content.y - firstLineY - (currentScoreColumn * rowSize)) / rowSize) + deltaPointColumn;
        currentScoreColumn += points - deltaPointColumn;
        deltaPointColumn = 0;

        let event = new Event();

        switch(parseInt(points)) {
          case 1:
            event.eventType = EventTypes.ONE_POINT;
            break;
          case 2:
            event.eventType = EventTypes.TWO_POINTS;
            break;
          case 3:
            event.eventType = EventTypes.THREE_POINTS;
            break;

          default:
            throw "Player n°" + content.str + " scores an illegal shoot (not a 1, 2 or 3 pts) --> " + points
              + "\n content position -> x : " + content.x + " - y : " + content.y;
        }
        event.from = content.str;
        event.order = indexOrder++;
        event.team = homeTeam ? 'A' : 'B';

        history.push(event);
      });

    deltaPointColumn = Math.floor(40 % currentScoreColumn);
    currentScoreColumn = 0;
  };

  if(homeTeam) {
    process(364);
    process(435);
    process(506);
  } else {
    process(414);
    process(486);
    process(558);
  }

  return history;

};

SheetExtractor.prototype.extract = function(file) {
  let match = new Match();

  const handler = new ExtractorHandler();
  return new Promise((resolve, reject) =>
    handler.extractHandler(file).then((data) => {
      if(data != null && data.pages != null && data.pages.length > 0 && data.pages[0].content != null) {
        let content = data.pages[0].content.sort((contentA, contentB) => {
          if(contentA.y - contentB.y === 0) {
            return contentA.x - contentB.x;
          } else {
            return contentA.y - contentB.y;
          }
        });

        match.category = utils.extractDataFromXY(50, 92, content);
        match.number = utils.extractDataFromXY(209, 83, content);
        match.date = utils.extractDataFromXY(271, 83, content);
        match.hourBegin = utils.extractDataFromXY(356, 83, content);
        match.hourEnd = utils.extractDataFromXY(387, 742, content);
        match.city = utils.extractDataFromXY(417, 83, content);

        let referee1 = utils.extractDataFromXY(260, 97, content.filter(content => content.x <= 407 && content.y < 100));
        if(referee1) {
          let referee = new Person();
          referee.lastnameFirstnameReduced = referee1;
          match.referees.push(referee);
        }

        let referee2 = utils.extractDataFromXY(438, 97, content.filter(content => content.x >= 407 && content.y < 100));
        if(referee2) {
          let referee = new Person();
          referee.lastnameFirstnameReduced = referee2;
          match.referees.push(referee);
        }

        let teamHome = new Team(true);
        let teamAway = new Team(false);

        let contentNumero = content.filter(content => content.x > 107 && content.x < 196 && ! content.str.includes('...'));
        teamHome.number = contentNumero.filter(content => content.y > 134 && content.y < 137)
          .sort((contentA, contentB) => contentA.x - contentB.x)
          .map(content => content.str).join("");
        teamAway.number = contentNumero.filter(content => content.y > 422 && content.y < 425)
          .sort((contentA, contentB) => contentA.x - contentB.x)
          .map(content => content.str).join("");

        teamHome.shirtColor = utils.extractDataFromXY(259, 135, content);
        teamAway.shirtColor = utils.extractDataFromXY(259, 422, content);

        teamHome.scores.scoreTotal = utils.extractDataFromXY(372, 715, content);
        teamAway.scores.scoreTotal = utils.extractDataFromXY(512, 715, content);

        teamHome.name = utils.extractDataFromXY(79, 121, content);
        teamAway.name = utils.extractDataFromXY(79, 409, content);

        teamHome.players.push(...extractPlayers(content.filter(content => content.x > 60 && content.x < 345 &&
          content.y >= 235 && content.y <= 361)));
        teamAway.players.push(...extractPlayers(content.filter(content => content.x > 60 && content.x < 345 &&
          content.y >= 522 && content.y <= 650)));

        teamHome.headCoach = extractCoach(content.filter(content => content.x < 160 && content.x > 20
          && content.y <= 375 && content.y >= 372 && ! content.str.includes("Entr")),
          content.filter(content => content.x < 345 && content.x > 160
         && content.y <= 375 && content.y >= 372 && ! content.str.includes("Entr")), 372, 374);

        teamAway.headCoach = extractCoach(content.filter(content => content.x < 160 && content.x > 20
          && content.y <= 663 && content.y >= 660 && ! content.str.includes("Entr")),
          content.filter(content => content.x < 345 && content.x > 160
          && content.y <= 663 && content.y >= 660 && ! content.str.includes("Entr")), 660, 662);

        teamHome.assistantCoach = extractCoach(content.filter(content => Math.floor(content.y) === 388 &&
          content.x < 160 && content.x > 20 && ! content.str.includes("Entr")),
          content.filter(content => Math.floor(content.y) === 388 && content.x < 345 && content.x > 160
            && ! content.str.includes("Entr")), 388, 388, true);
        teamAway.assistantCoach = extractCoach(content.filter(content => Math.floor(content.y) === 676 &&
          content.x < 160 && content.x > 20 && ! content.str.includes("Entr")),
          content.filter(content => Math.floor(content.y) === 676 && content.x < 345 && content.x > 160
            && ! content.str.includes("Entr")), 676, 676, true);

        teamHome.scores.scoreFirstQuarter = utils.extractDataFromXY(110, 709, content);
        teamAway.scores.scoreFirstQuarter = utils.extractDataFromXY(150, 709, content);
        teamHome.scores.scoreSecondQuarter = utils.extractDataFromXY(210, 709, content);
        teamAway.scores.scoreSecondQuarter = utils.extractDataFromXY(250, 709, content);

        teamHome.scores.scoreThirdQuarter = utils.extractDataFromXY(110, 724.48, content);
        teamAway.scores.scoreThirdQuarter = utils.extractDataFromXY(150, 724.48, content);
        teamHome.scores.scoreFourthQuarter = utils.extractDataFromXY(210, 724.48, content);
        teamAway.scores.scoreFourthQuarter = utils.extractDataFromXY(250, 724.48, content);

        let contentOvertime = content.filter(content => content.y <= 740 && content.y >= 738);
        teamHome.scores.scoreOvertime = utils.extractDataFromXY(120, 739,
          contentOvertime.filter(content => content.x > 100 && content.x < 170));
        teamAway.scores.scoreOvertime = utils.extractDataFromXY(250, 724,
          contentOvertime.filter(content => content.x > 190 && content.x < 250));

        let contentCurrentScore = content.filter(content => content.x >= 360 && content.x <= 560 &&
          content.y >= 150 && content.y <= 675);

        teamHome.history = extractHistoryScore(contentCurrentScore);
        teamAway.history = extractHistoryScore(contentCurrentScore, false);

        match.teams.push(teamHome);
        match.teams.push(teamAway);
      }

      resolve(match);
    }).catch((err) => reject(err)));
};

module.exports = SheetExtractor;