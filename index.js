RecapExtractor = require('./app/services/recap-extractor.service');
MatchSheetExtractor = require('./app/services/match-sheet-extractor.service');
HistoryExtractor = require('./app/services/history-extractor.service');
ShootPositionExtractor = require('./app/services/shoot-positions-extractor.service');

FileChecker = require('./app/services/file-checker.service');

ExtractorData = require('./app/models/extractor-data.model')

const recapExtractor = new RecapExtractor();
const matchSheetExtractor = new MatchSheetExtractor();
const historyExtractor = new HistoryExtractor();
const shootPositionsExtractor = new ShootPositionExtractor();
const fileChecker = new FileChecker();

/***
 * Extract all stats from files
 * @param {string} matchSheet - match sheet
 * @param {string} recapSheet - summary sheet
 * @param {string} historySheet - history sheet
 * @param {string} [shootsSheet=null] - (optional) shoot sheet
 * @returns {Promise<ExtractorData>} match data from files
 */
exports.extractAll = function(matchSheet, recapSheet, historySheet, shootsSheet = null) {
  return new Promise((resolve, reject) => {
    let data = new ExtractorData();

    let filesChecking = [fileChecker.checkFile(matchSheet),
      fileChecker.checkFile(recapSheet),
      fileChecker.checkFile(historySheet)];

    if(filesChecking.join('') !== '') {
      reject("Error checking file: " + filesChecking.filter(check => check !== "").join('\n\t'));
    } else {
      let promises = [];

      let matchFromRecap = null;
      let matchFromMatchSheet = null;
      let history = null;
      let teamShoots = [];

      promises.push(recapExtractor.extract(recapSheet).then((match) => matchFromRecap = match));
      promises.push(matchSheetExtractor.extract(matchSheet).then((match) => matchFromMatchSheet = match));
      promises.push(historyExtractor.extract(historySheet).then((mHistory) => history = mHistory));

      if(fileChecker.checkFile(shootsSheet) === '') {
        promises.push(shootPositionsExtractor.extract(shootsSheet).then((mShoots) => teamShoots = mShoots));
      }

      Promise.all(promises).then(() => {
        // TODO MERGE
        data.match = teamShoots;
        data.result.code = 0;

        resolve(data);
      }).catch((err) => reject("An error occurred during extraction : \n\t" + err));
    }
  })
};

/***
 * Extract match sheet stats from file
 * @param {string} matchSheetFile - the file
 * @returns {Promise<Match>} Match extracting from match sheet file
 */
exports.extractMatchSheet = function(matchSheetFile) {
  return new Promise((resolve, reject) => {
    let checkFile = fileChecker.checkFile(matchSheetFile);

    if(checkFile !== '')
      reject("Error checking file: \n\t" + checkFile);

    matchSheetExtractor.extract(matchSheetFile).then(match => resolve(match))
      .catch(err => reject("An error occurred during extraction : \n\t" + err));
  });
};

/***
 * Extract summary match stats from file
 * @param {string} recapFile - the file
 * @returns {Promise<Match>} Match extracting from recap file
 */
exports.extractRecap = function(recapFile) {
  return new Promise((resolve, reject) => {
    let checkFile = fileChecker.checkFile(recapFile);

    if(checkFile !== '')
      reject("Error checking file: \n\t" + checkFile);

    recapExtractor.extract(recapFile).then(match => resolve(match))
      .catch(err => reject("An error occurred during extraction : \n\t" + err));
  });
};

/***
 * Extract match history from file
 * @param {string} historyFile - the file
 * @returns {Promise<Event[]>} Match history extracting from history file
 */
exports.extractHistory = function(historyFile) {
  return new Promise((resolve, reject) => {
    let checkFile = fileChecker.checkFile(historyFile);

    if(checkFile !== '')
      reject("Error checking file: \n\t" + checkFile);

    historyExtractor.extract(historyFile).then(history => resolve(history))
      .catch(err => reject("An error occurred during extraction : \n\t" + err));
  });
};

/***
 * Extract match shoot positions from file
 * @param {string} shootPositionsFile - the file
 * @returns {Promise<[]>} Shoot position extracting from shoot position file
 */
exports.extractMatchSheet = function(shootPositionsFile) {
  return new Promise((resolve, reject) => {
    let checkFile = fileChecker.checkFile(shootPositionsFile);

    if(checkFile !== '')
      reject("Error checking file: \n\t" + checkFile);

    shootPositionsExtractor.extract(shootPositionsFile).then(match => resolve(match))
      .catch(err => reject("An error occurred during extraction : \n\t" + err));
  });
};