const recap = 'matchs/1/recapitulatif-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
// const recap = 'matchs/2/recapitulatif-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
//const recap = 'matchs/3/recapitulatif-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';

const matchSheet = 'matchs/1/feuille-de-marque-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const matchSheet = 'matchs/2/feuille-de-marque-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
//const matchSheet = 'matchs/3/feuille-de-marque-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';

const historySheet = 'matchs/1/historique-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const historySheet = 'matchs/2/historique-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
//const historySheet = 'matchs/3/historique-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';


const shootPositionsSheet = 'matchs/1/pos-tirs-reussis-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const shootPositionsSheet = 'matchs/2/pos-tirs-reussis-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
//const shootPositionsSheet = 'matchs/3/pos-tirs-reussis-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';

const util = require('util');
const Extractor = require('stats-fr-emarque-basketball-extractor');

let slowMode = process.argv[2] === '--slow-mode';

Extractor.extractAll(matchSheet, recap, historySheet, shootPositionsSheet, slowMode).then((data) => {
  console.log(util.inspect(data.match, {maxArrayLength: null, colors: true}));
}).catch((err) => console.error(err));

