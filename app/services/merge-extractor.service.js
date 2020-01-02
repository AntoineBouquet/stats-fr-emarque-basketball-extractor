const ExtractorData = require('../models/extractor-data.model');
const Match = require('../models/basketball/match.model');

function MergeExtractorService() {}

let data = new ExtractorData();

const checkFieldEquals = function(value1, value2, fieldName) {
  if(value1 !== value2) {
    data.result.messages.push("Values for field " + fieldName + " are not equals : " + value1 + ", " + value2);
    return false;
  } else {
    return true;
  }
};

const checkFieldsNotNull = function(value, fieldName) {
  if(value === null) {
    data.result.messages.push("Value for field " + fieldName + " is null");
    return false;
  } else {
    return true;
  }
};

const extractFirstnameLastname = function(person) {
  if(person != null && person.lastnameFirstnameReduced != null) {
    person.lastname = person.lastnameFirstnameReduced.substring(0, person.lastnameFirstnameReduced.length - 3);
    if (person.lastnameFirstname !== null && person.lastnameFirstname !== '' &&
      person.lastname !== null && person.lastname !== '') {
      person.firstname = person.lastnameFirstname.substring(person.lastname.length + 1);
    }
  }
};

/***
 *
 * @param {Match} matchFromMatchSheet - match from MatchSheetExtractor.extract
 * @param {Match} matchFromRecap - match from RecapExtractor.extract
 * @param {Event[]} history - history from HistoryExtractor.extract
 * @param {Team[]} teamShoots - team shoots from ShootPositionsExtractor.extract
 * @return {ExtractorData} merge of all data
 */
MergeExtractorService.prototype.merge = function(matchFromMatchSheet, matchFromRecap, history, teamShoots) {
  let match = matchFromMatchSheet;
  match.history = history;

  let resultCheck = checkFieldEquals(matchFromMatchSheet.number, matchFromRecap.number, "match.number") &&
    checkFieldEquals(matchFromMatchSheet.city, matchFromRecap.city, "match.city") &&
    checkFieldEquals(matchFromMatchSheet.date, matchFromRecap.date, "match.date") &&
    checkFieldEquals(matchFromMatchSheet.hourBegin, matchFromRecap.hourBegin, "match.hourBegin") &&
    checkFieldsNotNull(match.hourEnd);

  const util = require('util');
  //console.log(util.inspect(match, false, null, true));

  if(! resultCheck) {
    data.result.code = 1;
  } else {
    matchFromRecap.teams.forEach(team => {
      let currentTeam = match.teams.find(fTeam => fTeam.name === team.name);

      currentTeam.statsTotal = team.statsTotal;
      currentTeam.statsStartingLineup = team.statsStartingLineup;
      currentTeam.statsBench = team.statsBench;
      currentTeam.statsFirstHalf = team.statsFirstHalf;
      currentTeam.statsSecondHalf = team.statsSecondHalf;
      currentTeam.scores.scoreFirstHalf = team.statsFirstHalf.points;
      currentTeam.scores.scoreSecondHalf = team.statsSecondHalf.points;
      currentTeam.scores.scoreOvertime = team.statsOvertime.points;
      currentTeam.statsOvertime = team.statsOvertime;

      team.players.forEach(player => {
        let currentPlayer = currentTeam.players.find(fPlayer => fPlayer.shirtNumber === player.shirtNumber);
        currentPlayer.lastnameFirstname = player.lastnameFirstname;

        extractFirstnameLastname(currentPlayer);

        currentPlayer.playedTime = player.playedTime;
        currentPlayer.stats = player.stats;
      });

      extractFirstnameLastname(team.headCoach);
      extractFirstnameLastname(team.assistantCoach);

    });

    if(teamShoots != null) {
      teamShoots.forEach(team => {
        match.teams.find(teamMatch => teamMatch.home === team.home).players.forEach(player => {
          player.shootPositions = team.players.find(playerFind =>
            playerFind.shirtNumber === player.shirtNumber).shootPositions;
        });
      });
    }

    data.match = match;
  }

  return data;
};

module.exports = MergeExtractorService;