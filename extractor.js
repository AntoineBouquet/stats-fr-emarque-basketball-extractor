RecapExtractor = require('./app/services/recap-extractor.service');
MatchSheetExtractor = require('./app/services/match-sheet-extractor.service');
HistoryExtractor = require('./app/services/history-extractor.service');

const recapExtractor = new RecapExtractor();
const matchSheetExtractor = new MatchSheetExtractor();
const historyExtractor = new HistoryExtractor();

const util = require('util');


let recap = 'matchs/2/recapitulatif-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
//let recap = 'matchs/1/recapitulatif-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf'

//let matchSheet = 'matchs/1/feuille-de-marque-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
let matchSheet = 'matchs/2/feuille-de-marque-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';

let historySheet = 'matchs/1/historique-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//let historySheet = 'matchs/2/historique-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';

recapExtractor.extract(recap)
  .then((match) => {
    //console.log(util.inspect(match, false, null, true))
  }).catch(err => console.error(err));

matchSheetExtractor.extract(matchSheet)
  .then((match) => {
    //console.log(util.inspect(match, false, null, true))
  }).catch(err => console.error(err));

historyExtractor.extract(historySheet)
  .then((history) => {
    console.log(util.inspect(history.filter(event => event.order > 315), false, null, true))
  }).catch(err => console.error(err));


