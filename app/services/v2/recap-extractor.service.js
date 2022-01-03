const Match = require("../../models/basketball/match.model.js");
const Team = require("../../models/basketball/team.model.js");
const Player = require("../../models/basketball/player.model.js");
const Stats = require("../../models/basketball/stats.model.js");
const Person = require("../../models/basketball/person.model.js");
const ExtractorHandler = require("./extractor-handler.service");

function RecapExtractor() {}

/**
 *
 * @param {string[]} contents
 * @returns {Player[]}
 */
const extractPlayers = function (contents) {
  let players = [];

  contents.forEach((content) => {
    let player = new Player();
    player.shirtNumber = parseInt(content.match(/^([1-9][0-9]?)/)[1]);
    player.lastnameFirstname = content.match(/^[1-9][0-9]?\)? *([^-\s]+, [^-\s]+)/)[1].replace(",", "");
    let starter = content.match(/^[1-9][0-9]?\)? *[^-\s]+, [^-\s]+ *([X])/);
    player.starter = starter != null && starter[1] == "X";
    let playedTime = content.match(/^[1-9][0-9]?\)? *[^-\s]+, [^-\s]+ *X? *([0-9]?[0-9]\:?[0-9][0-9])/)[1];
    player.playedTime = playedTime.includes(":")
      ? playedTime
      : playedTime.slice(0, playedTime.length - 2) + ":" + playedTime.slice(playedTime.length - 2);

    player.stats = extractStats(
      content.slice(content.match(/(^[1-9][0-9]?\)? *[^-\s]+, [^-\s]+ *X? *[0-9]?[0-9]\:?[0-9][0-9]).+$/)[1].length)
    );
    players.push(player);
  });

  return players;
};

/**
 *
 * @param {string[]} contents
 * @returns {Stats}
 */
const extractStats = function (contents) {
  let stats = new Stats();
  let contentSplit = contents.trim().replace(/  +/g, " ").split(" ");
  stats.points = parseInt(contentSplit[0]);
  stats.fieldGoalsMade = parseInt(contentSplit[1]);
  stats.threePointsMade = parseInt(contentSplit[2]);
  stats.twoPointsIntMade = parseInt(contentSplit[3]);
  stats.twoPointsExtMade = parseInt(contentSplit[4]);
  stats.freeThrowMade = parseInt(contentSplit[5]);
  stats.totalFouls = parseInt(contentSplit[6]);
  return stats;
};

/**
 *
 * @param {Team} team
 * @param {string[]} contents
 * @returns {Team}
 */
const extractTeamStats = function (team, contents) {
  team.statsTotal = extractStats(
    contents[0].slice(contents[0].match(/(^Total *Équipe *[1-9][0-9]?[0-9]?\:[0-9][0-9] *).+$/)[1].length)
  );
  team.scores.scoreTotal = team.statsTotal.points;
  team.statsBench = extractStats(contents[1].slice(contents[1].match(/(^Total *Banc *).+$/)[1].length));
  team.statsStartingLineup = extractStats(
    contents[2].slice(contents[2].match(/(^Total *5 *de *Départ *).+$/)[1].length)
  );
  team.statsFirstHalf = extractStats(contents[3].slice(contents[3].match(/(^Total *1ère *Mi-temps *).+$/)[1].length));
  team.statsSecondHalf = extractStats(contents[4].slice(contents[4].match(/(^Total *2ème *Mi-temps *).+$/)[1].length));
  team.scores.scoreFirstHalf = team.statsFirstHalf.points;
  team.scores.scoreSecondHalf = team.statsSecondHalf.points;
  team.scores.scoreOvertime = team.statsOvertime.points;
  team.statsOvertime = extractStats(contents[5].slice(contents[5].match(/(^Total *Prolongation *).+$/)[1].length));
  team.headCoach.lastname = contents[6].match(/^Entraineur *([^-\s]+) *[0-9]* *$/)[1].trim();
  team.headCoach.fouls.totalFouls = parseInt(contents[6].match(/^Entraineur *[^-\s]+ *([0-9]*) *$/)[1].trim());
  return team;
};

const extractTeamNames = function (contents, home = true) {
  let offset = 0;

  let homeTeamName = contents[0].match(/^([EÉ]quipe [AÀ]|[EÉ]quipe|[EÉ]quip|[EÉ]qui|[EÉ]qu|[EÉ]q|[EÉ]) *(.*)$/)[2];
  if (contents.length > 2) {
    let add = contents[1].match(/^([EÉ]quipe [AÀ]|quipe [AÀ]|uipe [AÀ]|ipe [AÀ]|pe [AÀ]|e [AÀ]|[AÀ]) *(.*)$/);
    if (add != null && add[2] != null) {
      homeTeamName += " " + add[2];
      offset = 1;
    }
  }

  let awayTeamName = contents[1 + offset].match(/^([EÉ]quipe B|[EÉ]quipe|[EÉ]quip|[EÉ]qui|[EÉ]qu|[EÉ]q|[EÉ]) *(.*)$/)[2];

  if (contents.length > (2 + offset)) {
    let add = contents[2 + offset].match(/^([EÉ]quipe B|quipe B|uipe B|ipe B|pe B|e B|B) *(.*)$/);
    if (add != null && add[2] != null) awayTeamName += " " + add[2];
  }

  homeTeamName = homeTeamName.replace(/\:$/, " - 1").replace(/\.$/, "").replace(/\ : /, " - ");
  awayTeamName = awayTeamName.replace(/\:$/, " - 1").replace(/\.$/, "").replace(/\ : /, " - ");

  return [homeTeamName, awayTeamName];
};

RecapExtractor.prototype.extract = async function (file) {
  let match = new Match();

  const handler = new ExtractorHandler();
  let dataTeamA = await handler.extractHandler(file, "2500x1100+30+680", 1, {
    removeLines: true,
  });
  let dataTeamB = await handler.extractHandler(file, "2500x1100+30+2050", 1, {
    removeLines: true,
  });
  let dataInfoMatch = await handler.extractHandler(file, "1950x140+450+220", 1);

  let dataInfoMatch1stLine = dataInfoMatch[0];
  match.number = dataInfoMatch1stLine.match(/^Rencontre *N° *(.*) Date/)[1];
  match.date = dataInfoMatch1stLine.match(/^.*Date *(.*) Heure/)[1];
  match.hourBegin = dataInfoMatch1stLine.match(/^.*Heure *(.*) Lieu/)[1];
  match.city = dataInfoMatch1stLine.match(/^.*Lieu *(.*) *$/)[1];

  let dataInfoMatch2ndLine = dataInfoMatch[1];
  let referee = new Person();
  referee.lastnameFirstnameReduced = dataInfoMatch2ndLine.match(/^.*1. *arbitre *(.*) +2./)[1].trim();
  match.referees.push(referee);

  let secondReferee = dataInfoMatch2ndLine.match(/^.*2. *arbitre *(.*) +3./);
  if (secondReferee != null) {
    referee = new Person();
    referee.lastnameFirstnameReduced = secondReferee[1].trim();
    match.referees.push(referee);
  }

  let thirdReferee = dataInfoMatch2ndLine.match(/^.*3. *arbitre *(.*) +$/);
  if (thirdReferee != null) {
    referee = new Person();
    referee.lastnameFirstnameReduced = thirdReferee[1].trim();
    match.referees.push(referee);
  }

  let teamHome = new Team(true);
  let indexStatsTeam = dataTeamA.findIndex((data) => data.includes("Total Équipe"));
  teamHome = extractTeamStats(teamHome, dataTeamA.slice(indexStatsTeam));
  teamHome.players = extractPlayers(dataTeamA.slice(0, indexStatsTeam));

  let teamAway = new Team(false);
  indexStatsTeam = dataTeamB.findIndex((data) => data.includes("Total Équipe"));
  teamAway = extractTeamStats(teamAway, dataTeamB.slice(indexStatsTeam));
  teamAway.players = extractPlayers(dataTeamB.slice(0, indexStatsTeam));

  let datasAndRatios = await handler.extractHandler(file, "1600x290+800+640", 2);
  teamHome.maxPointsLead = parseInt(datasAndRatios[0].match(/^([0-9]+) *[0-9]+ *$/)[1]);
  teamHome.maxPointsSeries = parseInt(datasAndRatios[1].match(/^([0-9]+) *[0-9]+ *$/)[1]);
  teamHome.avantageTime = datasAndRatios[4].match(/^([0-9]+\:[0-9]+) *[0-9]+\:[0-9]+ *$/)[1];
  teamAway.maxPointsLead = parseInt(datasAndRatios[0].match(/^[0-9]+ *([0-9]+) *$/)[1]);
  teamAway.maxPointsSeries = parseInt(datasAndRatios[1].match(/^[0-9]+ *([0-9]+) *$/)[1]);
  teamAway.avantageTime = datasAndRatios[4].match(/^[0-9]+\:[0-9]+ *([0-9]+\:[0-9]+) *$/)[1];

  let dataNames = await handler.extractHandler(file, "1000x220+1400+0", 1);

  let names = extractTeamNames(dataNames);
  teamHome.name = names[0];
  teamAway.name = names[1];

  match.teams.push(teamHome);
  match.teams.push(teamAway);

  return match;
};

RecapExtractor.prototype.isRecap = async function (file) {
  const handler = new ExtractorHandler();

  let value1 = (await handler.extractHandler(file, "200x50+20+465", 1))[0];

  if (value1 == null || value1.toUpperCase() !== "LOCAUX") return false;

  let value2 = (await handler.extractHandler(file, "400x50+20+450", 2))[0];

  if (value2 == null || value2.toUpperCase() !== "DONNÉES ET RATIOS") return false;

  return true;
};

module.exports = RecapExtractor;
