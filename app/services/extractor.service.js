const RecapExtractorV1 = require("./v1/recap-extractor.service");
const MatchSheetExtractorV1 = require("./v1/match-sheet-extractor.service");
const HistoryExtractorV1 = require("./v1/history-extractor.service");
const ShootPositionExtractorV1 = require("./v1/shoot-positions-extractor.service");

const RecapExtractorV2 = require("./v2/recap-extractor.service");
const MatchSheetExtractorV2 = require("./v2/match-sheet-extractor.service");
const ShootPositionExtractorV2 = require("./v2/shoot-positions-extractor.service");

const recapExtractorV1 = new RecapExtractorV1();
const matchSheetExtractorV1 = new MatchSheetExtractorV1();
const historyExtractorV1 = new HistoryExtractorV1();
const shootPositionsExtractorV1 = new ShootPositionExtractorV1();

const recapExtractorV2 = new RecapExtractorV2();
const matchSheetExtractorV2 = new MatchSheetExtractorV2();
const shootPositionsExtractorV2 = new ShootPositionExtractorV2();

const MergeExtractor = require("./merge-extractor.service");
const mergeExtractor = new MergeExtractor();

const FileChecker = require("./file-checker.service");
const fileChecker = new FileChecker();

function Extractor() {}

/***
 * Extract all stats from files
 * @param {string} matchSheet - match sheet
 * @param {string} recapSheet - summary sheet
 * @param {string} shootsSheet - shoot sheet
 * @param {string} historySheet - history sheet
 * @returns {Promise<ExtractorData>} match data from files
 */
Extractor.prototype.extractAll = async function (matchSheet, recapSheet, shootsSheet, historySheet) {
  let matchFromRecap = null;
  let matchFromMatchSheet = null;
  let history = null;
  let teamShoots = [];

  matchFromRecap = await this.extractRecap(recapSheet);
  matchFromMatchSheet = await this.extractMatchSheet(matchSheet);

  if (historySheet !== "") {
    history = await this.extractHistory(historySheet);
  }

  if (shootsSheet !== "") {
    teamShoots = await this.extractShootPositions(shootsSheet, matchFromRecap);
  }

  return mergeExtractor.merge(matchFromMatchSheet, matchFromRecap, history, teamShoots);
};

/***
 * Extract match sheet stats from file
 * @param {string} matchSheetFile - the file
 * @returns {Promise<Match>} Match extracting from match sheet file
 */
Extractor.prototype.extractMatchSheet = function (matchSheetFile) {
  return new Promise(async (resolve, reject) => {
    let checkFile = await fileChecker.checkFile(matchSheetFile).catch((err) => reject(err));

    if (checkFile.err != null) reject("Error checking match sheet file: \n\t" + checkFile.err);

    let extractor;

    if (checkFile.version == 1) {
      extractor = matchSheetExtractorV1;
    } else if (checkFile.version == 2) {
      extractor = matchSheetExtractorV2;
    } else {
      reject("Error version match sheet extractor " + version + " not found");
    }

    let checkFileType = await extractor.isMatchSheet(matchSheetFile).catch((err) => reject(err));

    if (checkFileType) {
      extractor
        .extract(matchSheetFile)
        .then((match) => resolve(match))
        .catch((err) => reject("An error occurred during match sheet extraction: " + err));
    } else {
      reject("Error : Match sheet is not a match sheet");
    }
  });
};

/***
 * Extract summary match stats from file
 * @param {string} recapFile - the file
 * @returns {Promise<Match>} Match extracting from recap file
 */
Extractor.prototype.extractRecap = function (recapFile) {
  return new Promise(async (resolve, reject) => {
    let checkFile = await fileChecker.checkFile(recapFile).catch((err) => reject(err));

    if (checkFile.err != null) reject("Error checking recap file: \n\t" + checkFile.err);

    let extractor;

    if (checkFile.version == 1) {
      extractor = recapExtractorV1;
    } else if (checkFile.version == 2) {
      extractor = recapExtractorV2;
    } else {
      reject("Error version recap extractor " + version + " not found");
    }

    let checkFileType = await extractor.isRecap(recapFile).catch((err) => reject(err));

    if (checkFileType) {
      extractor
        .extract(recapFile)
        .then((match) => resolve(match))
        .catch((err) => reject("An error occurred during recap extraction: " + err));
    } else {
      reject("Error : Recap sheet is not a recap sheet");
    }
  });
};

/***
 * Extract match history from file
 * @param {string} historyFile - the file
 * @returns {Promise<Event[]>} Match history extracting from history file
 */
Extractor.prototype.extractHistory = function (historyFile) {
  return new Promise(async (resolve, reject) => {
    let checkFile = await fileChecker.checkFile(historyFile).catch((err) => reject(err));

    if (checkFile.err != null) reject("Error checking history file: \n\t" + checkFile.err);

    let extractor;

    if (checkFile.version == 1) {
      extractor = historyExtractorV1;
    } else {
      reject("Error version history extractor " + version + " not found");
    }

    let checkFileType = await extractor.isHistory(historyFile).catch((err) => reject(err));

    if (checkFileType) {
      extractor
        .extract(historyFile)
        .then((history) => resolve(history))
        .catch((err) => reject("An error occurred during history extraction: " + err));
    } else {
      reject("Error : History sheet is not a history sheet");
    }
  });
};

/***
 * Extract match shoot positions from file
 * @param {string} shootPositionsFile - the file
 * @param {Match} matchFromRecap - match from recap to refine shoot positions
 * @param {boolean} slowMode - enable the slow mode (default: false)
 * @returns {Promise<[]>} Shoot position extracting from shoot position file
 */
Extractor.prototype.extractShootPositions = function (shootPositionsFile, matchFromRecap = null, slowMode = false) {
  return new Promise(async (resolve, reject) => {
    let checkFile = await fileChecker.checkFile(shootPositionsFile).catch((err) => reject(err));

    if (checkFile.err != null) reject("Error checking shoot positions file: \n\t" + checkFile.err);

    let extractor;

    if (checkFile.version == 1) {
      extractor = shootPositionsExtractorV1;
    } else if (checkFile.version == 2) {
      extractor = shootPositionsExtractorV2;
    } else {
      reject("Error version shoot positions extractor " + version + " not found");
    }

    let checkFileType = await extractor
      .isShootPositions(shootPositionsFile, matchFromRecap, slowMode)
      .catch((err) => reject(err));

    if (checkFileType) {
      extractor
        .extract(shootPositionsFile)
        .then((match) => resolve(match))
        .catch((err) => reject("An error occurred during shoot pos extraction: " + err));
    } else {
      reject("Error : Shoot positions sheet is not a shoot positions sheet");
    }
  });
};

/***
 * Check file is one of 4 files
 * @param {string} file path to check
 * @returns {Promise<string>} MATCH_SHEET, RECAP, HISTORY, SHOOT_POSITIONS or null
 */
Extractor.prototype.checkFile = async function (file) {
  let checkFile = await fileChecker.checkFile(file).catch((err) => "erreur check file: " + err);

  if (checkFile.err != null) {
    return Promise.reject("File is not acceptable: " + checkFile.err);
  }

  let recapExtractor, matchSheetExtractor, shootPositionsExtractor;

  if (checkFile.version == 1) {
    recapExtractor = recapExtractorV1;
    matchSheetExtractor = matchSheetExtractorV1;
    shootPositionsExtractor = shootPositionsExtractorV1;
  } else if (checkFile.version == 2) {
    recapExtractor = recapExtractorV2;
    matchSheetExtractor = matchSheetExtractorV2;
    shootPositionsExtractor = shootPositionsExtractorV2;
  } else {
    return Promise.resolve(null);
  }

  if (await recapExtractor.isRecap(file)) {
    return Promise.resolve("RECAP");
  } else if (await matchSheetExtractor.isMatchSheet(file)) {
    return Promise.resolve("MATCH_SHEET");
  } else if (await shootPositionsExtractor.isShootPositions(file)) {
    return Promise.resolve("SHOOT_POSITIONS");
  } else if (checkFile.version == 1 && (await historyExtractorV1.isHistory(file))) {
    return Promise.resolve("HISTORY");
  } else {
    return Promise.resolve(null);
  }
};

module.exports = Extractor;
