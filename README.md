# :basketball: French Stats Basketball Extractor 
[![NPM version](https://img.shields.io/npm/v/stats-fr-emarque-basketball-extractor.svg?style=flat)](https://www.npmjs.com/package/stats-fr-emarque-basketball-extractor) [![NPM total downloads](https://img.shields.io/npm/dt/stats-fr-emarque-basketball-extractor.svg?style=flat)](https://npmjs.org/package/stats-fr-emarque-basketball-extractor)
[![travis-ci](https://travis-ci.org/AntoineBouquet/stats-fr-emarque-basketball-extractor.svg)](https://travis-ci.org/AntoineBouquet/stats-fr-emarque-basketball-extractor)

A tool to  extract french basketball amateur matches stats from E-Marque (French Basketball Federation software)

## Installation

```
npm install stats-fr-emarque-basketball-extractor
```

This package use [pdf-image](https://www.npmjs.com/package/pdf-image) and [node-ts-ocr](https://www.npmjs.com/package/node-ts-ocr) packages, which need `convert`, `gs`, `pdfinfo`, `pdftotext` and `tesseract` commands.

#### Ubuntu
```
sudo apt-get install imagemagick ghostscript poppler-utils tesseract-ocr tesseract-ocr-fra
``` 
#### OSX
```
brew install imagemagick ghostscript xpdf tesseract tesseract-lang
``` 

## How to use

```
Extractor = require('stats-fr-emarque-basketball-extractor');
```

### Get all stats from match PDF files

```
Extractor.extractAll(matchFile, recapFile, shootPositionsFile, historyFile).then((result) => {
  // TODO something with result object
});
```

French E-Marque software provide four PDF files which could be used :
- `matchFile` is the match sheet file path (:fr: Feuille de marque)
- `recapFile` is the summary sheet file path (:fr: Récapitulatif)
- `shootPositionsFile` (optional) extract approximate shoot positions sheet file path (:fr: Positions de tir)
- `historyFile` (optional) is the history sheet file path (:fr: Historique)

### Get stats from match sheet

```
Extractor.extractMatchSheet(matchFile).then((match) => {
  // TODO something with match object
});
```

### Get stats from summary sheet

```
Extractor.extractRecap(recapFile).then((match) => {
  // TODO something with match object
});
```

### Get stats from history sheet

```
Extractor.extractHistory(historyFile).then((history) => {
  // TODO something with history events array
});
```

### Get stats from shoot positions sheet

```
Extractor.extractMatchSheet(shootPositionsFile, slowMode).then((positions) => {
  // TODO something with positions array
});
```

### Get file type

```
Extractor.checkFile(file).then((result) => {
  // MATCH_SHEET, RECAP, HISTORY, SHOOT_POSITIONS or null depending the file type
});
```

A temp directory (called `tmp-extractor`) is created and deleted during this method to process images of shoot positions.

## Tests

``` 
git clone https://github.com/AntoineBouquet/stats-fr-emarque-basketball-extractor.git

npm run test
```

You can put your own match files in `tests/matchs/1` and/or and `tests/matchs/2` with determined names (e.g `match-sheet.pdf`, `recap.pdf`, `history.pdf`, `shoot-positions.pdf`)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details
