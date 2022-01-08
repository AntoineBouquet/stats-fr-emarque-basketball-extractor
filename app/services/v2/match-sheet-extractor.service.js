const Match = require("../../models/basketball/match.model.js");
const Person = require("../../models/basketball/person.model.js");
const Player = require("../../models/basketball/player.model.js");
const Team = require("../../models/basketball/team.model.js");
const Coach = require("../../models/basketball/coach.model.js");
const Utils = require("../../utils/utils");
const ExtractorHandler = require("./extractor-handler.service");

function SheetExtractor() {
}

const extractPlayers = function (contents) {
  let players = [];

  contents.forEach((content) => {
    if (content == null || content.length < 5) return;

    let player = new Player();
    const playerLicence1stPart = content.match(/^ *([A-Z]{2})/)[1];
    const playerLicence2ndPart = content.match(/^ *[A-Z]{2}([A-Z0-9]{6})/)[1].replace("O", "0");
    player.licence = playerLicence1stPart + playerLicence2ndPart;
    player.lastnameFirstnameReduced = content
      .match(/^ *[A-Z]{2}[A-Z0-9]{6} *([^-\s]+ *[A-Z][.,][.,]?) */)[1]
      .replace(",", "");

    if (player.lastnameFirstnameReduced.indexOf(" ") === -1) {
      const position = player.lastnameFirstnameReduced.length - 2;
      player.lastnameFirstnameReduced = [
        player.lastnameFirstnameReduced.slice(0, position),
        " ",
        player.lastnameFirstnameReduced.slice(position),
      ].join("");
    }

    player.captain = content.indexOf("(CAP)") !== -1;
    player.shirtNumber = content.trim().match(/^[A-Z]{2}[A-Z0-9]{6} *[^-\s]+ *[A-Z][.,][.,]? *(?:\(CAP\) )?([1-9][0-9]?).*$/)[1];
    player.extractFoulsFromStr(content.trim().match(/^[A-Z]{2}[A-Z0-9]{6} *[^-\s]+ *[A-Z][.,][.,]? *(?:\(CAP\) )?[1-9][0-9]?(.*)$/)[1]);

    players.push(player);
  });

  return players;
};

const extractCoach = function (content, assistant = false) {
  let coach = new Coach();

  if(assistant && ! content.includes('Entraineur adjoint')) return null;

  const licence1stPart = content.match(/^ *([A-Z]{2})/)[1];
  const licence2ndPart = content.match(/^ *[A-Z]{2}([A-Z0-9]{6})/)[1].replace("O", "0");
  coach.licence = licence1stPart + licence2ndPart;

  coach.lastnameFirstnameReduced = content
    .match(/^.*Entraineur( adjoint)? +: +([^-\s]+ *[A-Z][.,][.,]?).*$/)[2]
    .replace(",", "");

  coach.extractFoulsFromStr(content.match(/^.*Entraineur(?: adjoint)? +: +[^-\s]+ *[A-Z][.,][.,]? *(?:\(CAP\) )?(.*)$/)[1]);

  return coach;
};

const extractClubNumber = function (content) {
  content = content.replace(/ /g, "");
  let numberPart = content.substring(3).replace(/O/g, "0").replace(/S/g, "5");

  return content.substr(0, 3) + numberPart;
};

SheetExtractor.prototype.extract = async function (file) {
  let match = new Match();

  const handler = new ExtractorHandler();

  let dataInfoMatch = await handler.extractHandler(file, "1950x140+470+190", 1);
  let dataInfoMatch1stLine = dataInfoMatch[0];
  match.number = dataInfoMatch1stLine.match(/^Rencontre *N° *(.*) Date/)[1];
  match.date = dataInfoMatch1stLine.match(/^.*Date *(.*) Heure/)[1];
  match.hourBegin = dataInfoMatch1stLine.match(/^.*Heure *(.*) Lieu/)[1];
  match.hourEnd = (await handler.extractHandler(file, "120x40+1925+3190", 1))[0];
  match.city = dataInfoMatch1stLine.match(/^.*Lieu *(.*) *$/)[1];
  match.category = (await handler.extractHandler(file, "200x30+155+365", 1))[0];

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

  let homeTeam = new Team(true);
  let awayTeam = new Team(false);

  let offsetLineTeamHome = 0;
  let data = await handler.extractHandler(file, "180x45+90+425", 1);
  if (data[0] !== "Équipe A" && data[0] !== "Équipe À") offsetLineTeamHome += 40;

  homeTeam.name = (
    await handler.extractHandler(file, "1200x" + (45 + offsetLineTeamHome).toString() + "+250+425", 1)
  ).join(" ");

  let homeTeamNumberData = await handler.extractHandler(
    file,
    "485x55+435+" + (470 + offsetLineTeamHome).toString(),
    1,
    {
      removeLines: true,
      densityRatio: 2,
    }
  );
  homeTeam.number = extractClubNumber(homeTeamNumberData[0]);

  homeTeam.shirtColor = (
    await handler.extractHandler(file, "250x50+1200+" + (472 + offsetLineTeamHome).toString(), 1)
  )[0];

  homeTeam.players = extractPlayers(
    await handler.extractHandler(file, "1300x700+200+" + (860 + offsetLineTeamHome).toString(), 1, {removeLines: true})
  );

  let contentCoaches = await handler.extractHandler(file, "1350x100+130+" + (1560 + offsetLineTeamHome).toString(), 1, {removeLines: true});
  homeTeam.headCoach = extractCoach(contentCoaches[0]);
  if (contentCoaches.length > 1) homeTeam.assistantCoach = extractCoach(contentCoaches[1], true);

  let offsetLineTeamAway = 0;
  data = await handler.extractHandler(file, "180x45+90+1730", 1);
  if (data[0] !== "Équipe B") offsetLineTeamAway += 40;

  awayTeam.name = (
    await handler.extractHandler(
      file,
      "1200x" + (45 + offsetLineTeamAway).toString() + "+250+" + (1690 + offsetLineTeamHome).toString(),
      1
    )
  ).join(" ");
  let awayTeamNumberData = await handler.extractHandler(
    file,
    "485x55+435+" + (1745 + offsetLineTeamHome + offsetLineTeamAway).toString() + "",
    1,
    {
      removeLines: true,
      densityRatio: 2,
    }
  );
  awayTeam.number = extractClubNumber(awayTeamNumberData[0]);
  awayTeam.shirtColor = (
    await handler.extractHandler(file, "250x50+1200+" + (1745 + offsetLineTeamHome + offsetLineTeamAway).toString(), 1)
  )[0];

  awayTeam.players = extractPlayers(
    await handler.extractHandler(
      file,
      "1300x700+200+" + (2135 + offsetLineTeamHome + offsetLineTeamAway).toString(),
      1,
      {removeLines: true}
    )
  );

  contentCoaches = await handler.extractHandler(
    file,
    "1350x100+130+" + (2835 + offsetLineTeamHome + offsetLineTeamAway).toString(),
    1, {removeLines: true}
  );
  awayTeam.headCoach = extractCoach(contentCoaches[0]);
  if (contentCoaches.length > 1) awayTeam.assistantCoach = extractCoach(contentCoaches[1], true);

  homeTeam.scores.scoreTotal = parseInt((await handler.extractHandler(file, "100x40+1590+3050", 1))[0]);
  homeTeam.scores.scoreFirstQuarter = parseInt((await handler.extractHandler(file, "100x40+245+3050", 1))[0]);
  homeTeam.scores.scoreSecondQuarter = parseInt((await handler.extractHandler(file, "100x40+805+3050", 1))[0]);
  homeTeam.scores.scoreThirdQuarter = parseInt((await handler.extractHandler(file, "100x40+243+3108", 1))[0]);
  homeTeam.scores.scoreFourthQuarter = parseInt((await handler.extractHandler(file, "100x40+800+3108", 1))[0]);
  let overtime = await handler.extractHandler(file, "325x40+415+3180", 1);
  homeTeam.scores.scoreOvertime = overtime != null && overtime[0] != null ? parseInt(overtime[0]) : null;

  awayTeam.scores.scoreTotal = parseInt((await handler.extractHandler(file, "100x40+2150+3050", 1))[0]);
  awayTeam.scores.scoreFirstQuarter = parseInt((await handler.extractHandler(file, "100x40+485+3050", 1))[0]);
  awayTeam.scores.scoreSecondQuarter = parseInt((await handler.extractHandler(file, "100x40+1045+3050", 1))[0]);
  awayTeam.scores.scoreThirdQuarter = parseInt((await handler.extractHandler(file, "100x40+483+3108", 1))[0]);
  awayTeam.scores.scoreFourthQuarter = parseInt((await handler.extractHandler(file, "100x40+1040+3108", 1))[0]);
  overtime = await handler.extractHandler(file, "325x40+845+3180", 1);
  awayTeam.scores.scoreOvertime = overtime != null && overtime[0] != null ? parseInt(overtime[0]) : null;

  match.teams.push(...[homeTeam, awayTeam]);

  return match;
};

SheetExtractor.prototype.isMatchSheet = async function (file) {
  const handler = new ExtractorHandler();

  let data1 = await handler.extractHandler(file, "600x80+1650+420", 1);
  if (data1 == null || data1.length == 0 || data1[0] != 'MARQUE COURANTE') {
    return false;
  }

  let data2 = await handler.extractHandler(file, "630x80+50+30", 2);
  if (data2 == null || data2.length == 0 || data2[0] != 'RÉSERVES/OBSERVATIONS') {
    return false;
  }

  return true;
};

module.exports = SheetExtractor;
