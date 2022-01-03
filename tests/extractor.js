const assert = require("assert");
const Extractor = require("../index.js");

const testV1 = async () => {
  const recapSheet = "tests/matchs/1/recap.pdf";
  const matchSheet = "tests/matchs/1/match-sheet.pdf";
  const historySheet = "tests/matchs/1/history.pdf";
  const shootPosSheet = "tests/matchs/1/shoot-positions.pdf";

  const data = await Extractor.extractAll(matchSheet, recapSheet, shootPosSheet, historySheet);

  assert(data != null, "Data test V1 returns null");
  const dataValid = data.isValid();
  assert(dataValid === true, "Data test V1 is not valid: " + dataValid)
};

const testV2 = async () => {
  const recapSheet = "tests/matchs/2/recap.pdf";
  const matchSheet = "tests/matchs/2/match-sheet.pdf";
  const shootPosSheet = "tests/matchs/2/shoot-positions.pdf";

  const data = await Extractor.extractAll(matchSheet, recapSheet, shootPosSheet);
  assert(data != null, "Data test V2 returns null");
  const dataValid = data.isValid();
  assert(dataValid === true, "Data test V2 is not valid: " + dataValid)
};

const tests = async () => {
  await testV1();
  await testV2();
}

tests();
