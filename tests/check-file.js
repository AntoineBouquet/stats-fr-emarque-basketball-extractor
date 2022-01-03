const recapSheet1 = "tests/matchs/1/recap.pdf";
const matchSheet1 = "tests/matchs/1/match-sheet.pdf";
const historySheet1 = "tests/matchs/1/history.pdf";
const shootPosSheet1 = "tests/matchs/1/shoot-positions.pdf";

const recapSheet2 = "tests/matchs/2/recap.pdf";
const matchSheet2 = "tests/matchs/2/match-sheet.pdf";
const shootPosSheet2 = "tests/matchs/2/shoot-positions.pdf";

const assert = require("assert");
const Extractor = require("../index.js");

let tests = async () => {
  assert((await Extractor.checkFile(recapSheet1)) === "RECAP", "Not a recap file :" + recapSheet1);
  assert((await Extractor.checkFile(matchSheet1)) === "MATCH_SHEET", "Not a match sheet file :" + matchSheet1);
  assert((await Extractor.checkFile(historySheet1)) === "HISTORY", "Not a history file :" + historySheet1);
  assert((await Extractor.checkFile(shootPosSheet1)) === "SHOOT_POSITIONS", "Not a shoot pos file :" + shootPosSheet1);

  assert((await Extractor.checkFile(recapSheet2)) === "RECAP", "Not a recap file :" + recapSheet2);
  assert((await Extractor.checkFile(matchSheet2)) === "MATCH_SHEET", "Not a match sheet file :" + matchSheet2);
  assert((await Extractor.checkFile(shootPosSheet2)) === "SHOOT_POSITIONS", "Not a shoot pos file :" + shootPosSheet2);
};

tests();