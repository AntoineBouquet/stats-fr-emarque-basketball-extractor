const Extractor = require("./app/services/extractor.service");
const FileChecker = require("./app/services/file-checker.service");

ExtractorData = require("./app/models/extractor-data.model");

const extractor = new Extractor();
const fileChecker = new FileChecker();

/***
 * Extract all stats from files
 * @param {string} matchSheet - match sheet
 * @param {string} recapSheet - summary sheet
 * @param {string} [shootsSheet=null] - (optional) shoot sheet
 * @param {string} [historySheet=null] - (optional) history sheet
 * @returns {Promise<ExtractorData>} match data from files
 */
exports.extractAll = function (matchSheet, recapSheet, shootsSheet = "", historySheet = "") {
  return new Promise(async (resolve, reject) => {
    let promises = [
      fileChecker.checkFile(matchSheet).catch((err) => reject(err)),
      fileChecker.checkFile(recapSheet).catch((err) => reject(err)),
    ];

    if (historySheet !== "") {
      promises.push(fileChecker.checkFile(historySheet).catch((err) => reject(err)));
    }

    if (shootsSheet !== "") {
      promises.push(fileChecker.checkFile(shootsSheet).catch((err) => reject(err)));
    }

    const filesChecking = await Promise.all(promises);

    if (filesChecking.map((check) => (check.err ? check.err : "")).join("") !== "") {
      reject("Error checking file: " + filesChecking.map((check) => check.err ? check.err : "").join("\n\t"));
    } else if (
      !filesChecking
        .map((check) => check.version)
        .every((version) => version != null && version == filesChecking[0].version)
    ) {
      reject("Files are not from same versions");
    } else {
      extractor
        .extractAll(matchSheet, recapSheet, shootsSheet, historySheet)
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    }
  });
};

/***
 * Extract match sheet stats from file
 * @param {string} matchSheetFile - the file
 * @returns {Promise<Match>} Match extracting from match sheet file
 */
exports.extractMatchSheet = function (matchSheetFile) {
  return extractor.extractMatchSheet(matchSheetFile);
};

/***
 * Extract summary match stats from file
 * @param {string} recapFile - the file
 * @returns {Promise<Match>} Match extracting from recap file
 */
exports.extractRecap = function (recapFile) {
  return extractor.extractRecap(recapFile);
};

/***
 * Extract match history from file
 * @param {string} historyFile - the file
 * @returns {Promise<Event[]>} Match history extracting from history file
 */
exports.extractHistory = function (historyFile) {
  return extractor.extractHistory(historyFile);
};

/***
 * Extract match shoot positions from file
 * @param {string} shootPositionsFile - the file
 * @param {boolean} slowMode - enable the slow mode (default: false)
 * @returns {Promise<[]>} Shoot position extracting from shoot position file
 */
exports.extractShootPositions = function (shootPositionsFile, slowMode = false) {
  return extractor.extractShootPositions(shootPositionsFile, null, slowMode);
};

/***
 * Check file is one of 4 files
 * @param {string} file path to check
 * @returns {Promise<string>} MATCH_SHEET, RECAP, HISTORY, SHOOT_POSITIONS or null
 */
exports.checkFile = async function (file) {
  return extractor.checkFile(file);
};
