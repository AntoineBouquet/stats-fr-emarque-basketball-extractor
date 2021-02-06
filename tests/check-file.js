const recap = 'matchs/1/recapitulatif-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
const matchSheet = 'matchs/1/feuille-de-marque-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
const historySheet = 'matchs/1/historique-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
const shootPositionsSheet = 'matchs/1/pos-tirs-reussis-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';

const util = require('util');
const Extractor = require('stats-fr-emarque-basketball-extractor');

Extractor.checkFile(recap).then((data) => {
  console.log("is recap ? " + (data === "RECAP"));
  console.log(util.inspect(data, {maxArrayLength: null, colors: true}));
}).catch((e) => console.error(e));

Extractor.checkFile(matchSheet).then((data) => {
  console.log("is match sheet ? " + (data === "MATCH_SHEET"));
  console.log(util.inspect(data, {maxArrayLength: null, colors: true}));
}).catch((e) => console.error(e));

Extractor.checkFile(historySheet).then((data) => {
  console.log("is history ? " + (data === "HISTORY"));
  console.log(util.inspect(data, {maxArrayLength: null, colors: true}));
}).catch((e) => console.error(e));

Extractor.checkFile(shootPositionsSheet).then((data) => {
  console.log("is shoot positions ? " + (data === "SHOOT_POSITIONS"));
  console.log(util.inspect(data, {maxArrayLength: null, colors: true}));
}).catch((e) => console.error(e));

