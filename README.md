# :basketball: French Stats Basketball Extractor 
[![NPM version](https://img.shields.io/npm/v/stats-fr-emarque-basketball-extractor.svg?style=flat)](https://www.npmjs.com/package/stats-fr-emarque-basketball-extractor) [![NPM total downloads](https://img.shields.io/npm/dt/stats-fr-emarque-basketball-extractor.svg?style=flat)](https://npmjs.org/package/stats-fr-emarque-basketball-extractor)

A tool to  extract french basketball amateur matches stats from E-Marque (French Basketball Federation software)

## Getting Started

### Installation

```
npm install stats-fr-emarque-basketball-extractor
```

This package use [pdf-image](https://www.npmjs.com/package/pdf-image) package, which need `convert`, `gs` and `pdfinfo` (part of poppler) commands.

#### Ubuntu
```
sudo apt-get install imagemagick ghostscript poppler-utils
``` 
#### OSX (Yosemite)
```
brew install imagemagick ghostscript poppler 
``` 

### How to use

```
Extractor = require('stats-fr-emarque-basketball-extractor');
```

#### Get all stats from match PDF files

```
Extractor.extractAll(matchFile, recapFile, historyFile, shootPositionsFile).then((result) => {
  // TODO something with result object
});
```

French E-Marque software provide four PDF files which could be used :
- `matchFile` is the match sheet file path (:fr: Feuille de marque)
- `recapFile` is the summary sheet file path (:fr: Récapitulatif)
- `historyFile` is the history sheet file path (:fr: Historique)
- `shootPositionsFile` extract approximate shoot positions sheet file path (:fr: Positions de tir)

#### Get stats from match sheet

```
Extractor.extractMatchSheet(matchFile).then((match) => {
  // TODO something with match object
});
```

#### Get stats from summary sheet

```
Extractor.extractRecap(recapFile).then((match) => {
  // TODO something with match object
});
```

#### Get stats from history sheet

```
Extractor.extractHistory(historyFile).then((history) => {
  // TODO something with history events array
});
```

#### Get stats from shoot positions sheet

```
Extractor.extractMatchSheet(shootPositionsFile).then((positions) => {
  // TODO something with positions array
});
```

A temp directory (called `tmp-extractor`) is created and deleted during this method to process images of shoot positions.

## Tests

``` 
git clone https://github.com/AntoineBouquet/stats-fr-emarque-basketball-extractor.git
cd stats-fr-emarque-basketball-extractor/tests
```

Set `tests/extractor.js` file to use one matches's sheets and launch

```
npm run test
```

Matches are in directory `tests/matchs/X`



## TODO for v1.0.0

- [X] Extract data from shoot positions sheet and implements `ShootPositionsExtractor` service
- [X] `extractAll`: Merge data from all extractions 
- [ ] add a part in `fileChecker.checkFile` method to check the truthfulness of the file
- [ ] add checks in `mergeExtractor.merge` method to prevent for data inconsistency between files

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details
