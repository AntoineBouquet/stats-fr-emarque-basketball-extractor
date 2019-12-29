const recap = 'tests/matchs/1/recapitulatif-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
// const recap = 'tests/matchs/2/recapitulatif-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';

const matchSheet = 'tests/matchs/1/feuille-de-marque-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const matchSheet = 'tests/matchs/2/feuille-de-marque-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';

const historySheet = 'tests/matchs/1/historique-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const historySheet = 'tests/matchs/2/historique-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';


const shootPositionsSheet = 'tests/matchs/1/pos-tirs-reussis-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const shootPositionsSheet = 'tests/matchs/2/pos-tirs-reussis-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';

const util = require('util');
const Extractor = require('stats-fr-emarque-basketball-extractor');

Extractor.extractAll(matchSheet, recap, historySheet, shootPositionsSheet).then((result) => {
  console.log(util.inspect(result, false, null, true));
});

