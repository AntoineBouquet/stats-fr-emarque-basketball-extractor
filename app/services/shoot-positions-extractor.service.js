const Utils = require('../utils/utils');
const ExtractorHandler = require('./extractor-handler.service');
const PDFImage = require("pdf-image").PDFImage;
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const potrace = require('potrace');
const AsyncLock = require('async-lock');

const Player = require('../models/basketball/player.model');
const Team = require('../models/basketball/team.model');
const ShootPosition = require('../models/basketball/shoot-position.model');
const ShootPositions = require('../models/basketball/shoot-positions.model');
const lock = new AsyncLock();

const utils = new Utils();

function ShootPositionsExtractor() {}

const extractShootPos = function(file, numPage, shootPositions, part, tmpFolder) {
  return new Promise((resolve, reject) => {
    let randomName = numPage + '-' + shootPositions.period + '-' + part + '-' + uuidv4();
    let diffImagePath = tmpFolder + "/" + randomName + '-diff.png';

    let cropParts = [
      "103x87+267+242" /* Period 1 top */,
      "103x87+267+363" /* Period 2 top */,
      "103x87+373+242" /* Period 3 top */,
      "103x87+373+363" /* Period 4 top */,
      "103x87+479+242" /* Overtime top */,
      "103x87+267+554" /* Period 1 bottom */,
      "103x87+267+675" /* Period 2 bottom */,
      "103x87+373+554" /* Period 3 bottom */,
      "103x87+373+675" /* Period 4 bottom */,
      "103x87+479+554" /* Overtime bottom */
    ];

    const pdfImage = new PDFImage(file, {
      outputDirectory: tmpFolder,
      pdfFileBaseName: randomName,
      convertOptions: {
        "-crop" : cropParts[(shootPositions.period + ((part - 1) * 5)) - 1]
      }
    });

    pdfImage.convertPage(numPage - 1).then(function (imagePath) {
      const img1 = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../resources/field-empty.png')));
      const img2 = PNG.sync.read(fs.readFileSync(imagePath));
      const {width, height} = img1;
      const diff = new PNG({width, height});
      try {
        pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.96, alpha: 0});
      } catch(err) {
        reject("An error occurred when make pixelmatch diff : " + err);
      }

      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

      potrace.trace(diffImagePath, function(err, svg) {
        if (err) {
          reject("An error occurred when make potrace trace : " + err);
        } else {
          let svgCrosses = svg.substring(svg.indexOf("path d=") + 8, svg.indexOf("stroke") - 2)
            .split("M").map(cross => cross.trim());
          svgCrosses.splice(0,1);

          svgCrosses.forEach(svgCross => {
            let position = new ShootPosition();
            position.x = svgCross.substring(0, svgCross.indexOf(' ') - 1);
            position.y = svgCross.substring(svgCross.indexOf(' ') + 1, svgCross.indexOf('C') - 2);
            position.refWidth = width;
            position.refHeight = height;
            position.weight = svgCross.length;

            shootPositions.positions.push(position);
          });

          if(shootPositions.positions != null && parseInt(shootPositions.shootCount) > shootPositions.positions.length) {
            let gap = parseInt(shootPositions.shootCount) - shootPositions.positions.length;

            for (let i = 0 ; i < gap ; i++) {
              let maxWeightShoot = shootPositions.positions.reduce(function(prev, current) {
                return (prev.weight > current.weight) ? prev : current
              });

              maxWeightShoot.weight = maxWeightShoot.weight / 2;
              shootPositions.positions.push(maxWeightShoot);
            }
          }
          resolve();
        }
      });
    }).catch((err) => reject("An error occured when make convert page to png : " + err));
  });
};

ShootPositionsExtractor.prototype.extract = function(file, slowMode) {
  return new Promise((resolve, reject) => {
    let homeTeamPart = true;
    let first = true;
    let homeTeam = new Team(true);
    let awayTeam = new Team(false);

    let promises = [];

    const handler = new ExtractorHandler();

    let tmpFolder = './tmp-extractor';
    let tmpExist = fs.existsSync(tmpFolder);

    if (! tmpExist){
      fs.mkdirSync(tmpFolder);
    }

    let deleteTmpFiles = () => {
      fs.readdir(tmpFolder, (err, files) => {
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(tmpFolder, file));
          } catch {}
        }

        try {
          if(! tmpExist) {
            fs.rmdirSync(tmpFolder);
          }
        } catch(err) {
          console.error(err);
        }
      });
    };

    let rejectHandler = function(err) {
      console.error(err);
      deleteTmpFiles();
      reject("An error occured extracting shoot positions : " + err);
    };

    let resolveHandler = function(data) {
      deleteTmpFiles();
      resolve(data);
    };

    handler.extractHandler(file).then((data) => {
      return new Promise(resolve => {
        let _break = false;
        data.pages.sort((page1, page2) => page1.pageInfo.num - page2.pageInfo.num)
          .forEach(page => {
            let pageNum = page.pageInfo.num;
            let pageContent = page.content;
            let pageError = utils.extractDataFromXY(37, 829, pageContent);

            if(!_break && pageError === null || ! pageError.includes("erreurs sont apparues")) {
              let process = (x1, x2, x3, y1, y2, str, pagePart, homeTeamPart) => {
                let promisesProcess = [];
                let lastnameFirstnameReduced = str.substring(0, str.indexOf('. -') + 1);
                let player = new Player();
                player.lastnameFirstnameReduced = lastnameFirstnameReduced;


                let shootsCount = [];
                shootsCount.push(utils.extractDataFromXY(x1, y1, pageContent));
                shootsCount.push(utils.extractDataFromXY(x1, y2, pageContent));
                shootsCount.push(utils.extractDataFromXY(x2, y1, pageContent));
                shootsCount.push(utils.extractDataFromXY(x2, y2, pageContent));
                shootsCount.push(utils.extractDataFromXY(x3, y1, pageContent));

                shootsCount.forEach((shootsCountPeriod, index) => {
                  let shootPositions = new ShootPositions();
                  shootPositions.period = index + 1;

                  shootPositions.shootCount = shootsCountPeriod.substring(0, shootsCountPeriod.indexOf('+'));
                  shootPositions.hmtShootCount = shootsCountPeriod.substring(shootsCountPeriod.indexOf('+') + 1,
                    shootsCountPeriod.indexOf('HMT'));

                  if(slowMode) {
                    promisesProcess.push(lock.acquire('shoot-position', function(done) {
                      extractShootPos(file, pageNum, shootPositions, pagePart, tmpFolder)
                        .then(() => {
                          player.shootPositions.push(shootPositions);
                          done();
                        });
                    }, {}));
                  } else {
                    promisesProcess.push(extractShootPos(file, pageNum, shootPositions, pagePart, tmpFolder)
                      .then(() => player.shootPositions.push(shootPositions)));
                  }
                });

                return Promise.all(promisesProcess).then(() => {
                  if (homeTeamPart) {
                    homeTeam.players.push(player);
                  } else {
                    awayTeam.players.push(player);
                  }
                });
              };

              [1, 2].forEach(part => {
                let titlePart = utils.extractDataFromXY(12, part === 1 ? 217 : 529, pageContent);

                if(titlePart !== "" && ! titlePart.includes('e-Marque') &&
                  ! (titlePart.substr(0, 7) === 'EQUIPE ' && titlePart.charAt(9) !== '.')) {
                  // it's a player, get his/her shoots
                  promises.push(process(340, 446, 552, part === 1 ? 334 : 646,
                    part === 1 ? 456 : 768, titlePart, part, homeTeamPart));
                } else if(titlePart.substr(0, 7) === 'EQUIPE ' && titlePart.charAt(9) !== '.') {
                  if(! first) homeTeamPart = false;
                  if(first) first = false;
                }
              });
            } else if(!_break) {
              resolve(false);
              _break = true;
            }
          });

        Promise.all(promises).then(() => resolve(true));
      });

    }).then((result) => ! result ? resolveHandler(null) : resolveHandler([homeTeam, awayTeam])).catch((err) => rejectHandler(err));
  });
};

module.exports = ShootPositionsExtractor;