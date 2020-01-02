// const recap = 'tests/matchs/1/recapitulatif-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
// const recap = 'tests/matchs/2/recapitulatif-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
 const recap = 'tests/matchs/3/recapitulatif-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';

//const matchSheet = 'tests/matchs/1/feuille-de-marque-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const matchSheet = 'tests/matchs/2/feuille-de-marque-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
const matchSheet = 'tests/matchs/3/feuille-de-marque-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';

//const historySheet = 'tests/matchs/1/historique-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const historySheet = 'tests/matchs/2/historique-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
const historySheet = 'tests/matchs/3/historique-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';


//const shootPositionsSheet = 'tests/matchs/1/pos-tirs-reussis-2019-12-15-reg-rmve-3-as-marcoussis-cs-de-noisy-le.pdf';
//const shootPositionsSheet = 'tests/matchs/2/pos-tirs-reussis-2019-12-08-reg-rmve-3-cs-de-noisy-leus-melun.pdf';
const shootPositionsSheet = 'tests/matchs/3/pos-tirs-reussis-2018-02-04-reg-smpr-en-emeraudeba-rennes-tour-d-a.pdf';

const util = require('util');
const Extractor = require('stats-fr-emarque-basketball-extractor');

Extractor.extractAll(matchSheet, recap, historySheet, shootPositionsSheet).then((data) => {
  console.log(util.inspect(data.match.map(team => team.players.map(player => {
   return {name: player.lastnameFirstnameReduced,
     shootPositions: player.shootPositions.sort((s1, s2) => s1.period - s2.period)};
  })), false, null, true));
});

