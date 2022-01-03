const Utils = require('../../utils/utils');
const ExtractorHandler = require('./extractor-handler.service');
const TempFolder = require('../temp-folder.service');
const PDFImage = require("pdf-image").PDFImage;
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const potrace = require('potrace');
const AsyncLock = require('async-lock');

const Player = require('../../models/basketball/player.model');
const Team = require('../../models/basketball/team.model');
const ShootPosition = require('../../models/basketball/shoot-position.model');
const ShootPositions = require('../../models/basketball/shoot-positions.model');
const lock = new AsyncLock();

const ShootZones = require('../../models/basketball/shoot-zones.enum');

const utils = new Utils();

function ShootPositionsExtractor() {
}

const extractShootPos = function (file, numPage, shootPositions, part) {
  let tempFolderService = new TempFolder();
  
  return new Promise((resolve, reject) => {
    let randomName = numPage + '-' + shootPositions.period + '-' + part + '-' + uuidv4();
    let diffImagePath = tempFolderService.tmpFolder + "/" + randomName + '-diff.png';

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
      outputDirectory: tempFolderService.tmpFolder,
      pdfFileBaseName: randomName,
      convertOptions: {
        "-crop": cropParts[(shootPositions.period + ((part - 1) * 5)) - 1]
      }
    });

    pdfImage.convertPage(numPage - 1).then(function (imagePath) {
      const img1 = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../resources/fields-empty/field-empty.png')));
      const img2 = PNG.sync.read(fs.readFileSync(imagePath));
      const {width, height} = img1;
      const diff = new PNG({width, height});
      try {
        pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.96, alpha: 0});
      } catch (err) {
        reject("An error occurred when make pixelmatch diff : " + err);
      }

      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

      potrace.trace(diffImagePath, function (err, svg) {
        if (err) {
          reject("An error occurred when make potrace trace : " + err);
        } else {
          let svgCrosses = svg.substring(svg.indexOf("path d=") + 8, svg.indexOf("stroke") - 2)
            .split("M").map(cross => cross.trim());
          svgCrosses.splice(0, 1);

          svgCrosses.forEach(svgCross => {
            let position = new ShootPosition();
            position.x = svgCross.substring(0, svgCross.indexOf(' '));
            position.y = svgCross.substring(svgCross.indexOf(' ') + 1, svgCross.indexOf('C') - 1);
            position.refWidth = width;
            position.refHeight = height;
            position.weight = svgCross.length;

            position.zone = calculateZone(position);

            shootPositions.positions.push(position);
          });

          if (shootPositions.positions != null) {
            if (parseInt(shootPositions.shootCount) < shootPositions.positions.length) {
              // il y a trop de points récupérés, on enlève les points les plus proches jusqu'à atteindre
              // le nombre attendu
              while (parseInt(shootPositions.shootCount) < shootPositions.positions.length) {
                let min = -1;
                let indexToDelete = 0;
                shootPositions.positions.forEach((shootPosition1, index) => {
                  shootPositions.positions.forEach((shootPosition2, index2) => {
                    if (index !== index2) {
                      let diff = Math.abs(shootPosition1.x - shootPosition2.x) +
                        Math.abs(shootPosition1.y - shootPosition2.y);
                      if (min === -1 || diff < min) {
                        min = diff;
                        indexToDelete = index;
                      }
                    }
                  })
                })

                shootPositions.positions.splice(indexToDelete, 1)
              }
            }
          }
          resolve();
        }
      });
    }).catch((err) => reject("An error occured when make convert page to png : " + err));
  });
};

const calculateZone = (position) => {
  if (position.x && position.refWidth && position.y && position.refHeight) {
    let ratioX = position.x / position.refWidth;
    // refWidth to let y pos same reference to y
    let ratioY = position.y / position.refWidth;

    let hoopPos = {x: 0.5, y: 0.11};
    let hoopZoneRadius = 0.084;
    let freeThrowLinePos = {x: 0.5, y: 0.394};
    let freeThrowCircleRadius = 0.121;
    let threePointsRadius = 0.452;

    if(ratioY > 0.684) {
      // long shoot distance
      return ShootZones.THREE_PTS_LONG;
    }

    if (ratioY < 0.195) {
      // 0 degres shoots
      if (ratioX < 0.063) {
        return ShootZones.THREE_PTS_0_DG_LEFT;
      } else if (ratioX >= 0.063 && ratioX < 0.336) {
        return ShootZones.TWO_PTS_EXT_0_DG_LEFT;
      } else if (ratioX > 0.671 && ratioX <= 0.95) {
        return ShootZones.TWO_PTS_EXT_0_DG_RIGHT;
      } else if (ratioX > 0.95) {
        return ShootZones.THREE_PTS_0_DG_RIGHT;
      } else if (Math.sqrt(Math.pow(Math.abs(ratioX - hoopPos.x), 2) +
        Math.pow(Math.abs(ratioY - hoopPos.y), 2)) <= hoopZoneRadius) {
        return ShootZones.TWO_PTS_INT_SHORT;
      } else {
        return ShootZones.TWO_PTS_INT_LONG;
      }
    } else if (Math.sqrt(Math.pow(Math.abs(ratioX - hoopPos.x), 2) +
      Math.pow(Math.abs(ratioY - hoopPos.y), 2)) <= threePointsRadius) {
      // 2 points zones
      if (ratioX < 0.336) {
        return ShootZones.TWO_PTS_EXT_45_DG_LEFT;
      } else if (ratioX > 0.671) {
        return ShootZones.TWO_PTS_EXT_45_DG_RIGHT;
      } else if (ratioY < 0.394 ||
        (Math.sqrt(Math.pow(Math.abs(ratioX - freeThrowLinePos.x), 2) +
          Math.pow(Math.abs(ratioY - freeThrowLinePos.y), 2)) <= freeThrowCircleRadius)) {
        return ShootZones.TWO_PTS_INT_LONG;
      } else {
        return ShootZones.TWO_PTS_EXT_90_DG;
      }
    } else {
      // 3 points zones
      if (ratioX < 0.336) {
        return ShootZones.THREE_PTS_45_DG_LEFT;
      } else if (ratioX > 0.671) {
        return ShootZones.THREE_PTS_45_DG_RIGHT;
      } else {
        return ShootZones.THREE_PTS_90_DG;
      }
    }
  } else {
    return null;
  }
}

const addMissedPositions = (shootPositions, stats) => {
  shootPositions.forEach(shootPosition => {
    if (parseInt(shootPosition.shootCount) > shootPosition.positions.length) {
      let addWeightier = (shootPositionsPart, gap) => {
        let newShootsPositions = [];

        if (shootPositionsPart && shootPositionsPart.length > 0 && gap > 0) {
          for (let i = 0; i < gap; i++) {
            let maxWeightShoot = shootPositionsPart.reduce(function (prev, current) {
              return (prev.weight > current.weight) ? prev : current
            });

            maxWeightShoot.weight = maxWeightShoot.weight / 2;
            newShootsPositions.push(maxWeightShoot);
          }
        }

        return newShootsPositions;
      };

      const allPositions = shootPositions.map(sp => sp.positions)
        .reduce((a, b) => a.concat(b));

      let shootPositionsTwoPointsInt = allPositions
        .filter(position => position.zone === ShootZones.TWO_PTS_INT_LONG ||
          position.zone === ShootZones.TWO_PTS_INT_SHORT);
      let gap2Int = stats.twoPointsIntMade - shootPositionsTwoPointsInt.length;
      shootPosition.positions.push(...addWeightier(shootPositionsTwoPointsInt, gap2Int));

      let shootPositionsTwoPointsExt = allPositions
        .filter(position => position.zone === ShootZones.TWO_PTS_EXT_90_DG ||
          position.zone === ShootZones.TWO_PTS_EXT_45_DG_RIGHT ||
          position.zone === ShootZones.TWO_PTS_EXT_0_DG_RIGHT ||
          position.zone === ShootZones.TWO_PTS_EXT_45_DG_LEFT ||
          position.zone === ShootZones.TWO_PTS_EXT_0_DG_LEFT);
      let gap2Ext = stats.twoPointsExtMade - shootPositionsTwoPointsExt.length;
      shootPosition.positions.push(...addWeightier(shootPositionsTwoPointsExt, gap2Ext));

      let shootPositionsThreePoints = allPositions
        .filter(position => position.zone === ShootZones.THREE_PTS_90_DG ||
          position.zone === ShootZones.THREE_PTS_45_DG_RIGHT ||
          position.zone === ShootZones.THREE_PTS_0_DG_RIGHT ||
          position.zone === ShootZones.THREE_PTS_45_DG_LEFT ||
          position.zone === ShootZones.THREE_PTS_0_DG_LEFT);
      // substract shoot out of semi-court
      let gap3 = stats.threePointsMade -
        shootPositions.map(shootPosition => shootPosition.hmtShootCount).reduce((a, b) => parseInt(a) + parseInt(b))
        - shootPositionsThreePoints.length;
      shootPosition.positions.push(...addWeightier(shootPositionsThreePoints, gap3));
    }
  });
}

ShootPositionsExtractor.prototype.extract = function (file, recap, slowMode) {
  let tempFolderService = new TempFolder();

  return new Promise((resolve, reject) => {
    let homeTeamPart = true;
    let first = true;
    let homeTeam = new Team(true);
    let awayTeam = new Team(false);

    let promises = [];

    const handler = new ExtractorHandler();


    let rejectHandler = function (err) {
      console.error(err);
      tempFolderService.cleanTmpFolder();
      reject("An error occured extracting shoot positions : " + err);
    };

    let resolveHandler = function (data) {
      tempFolderService.cleanTmpFolder();
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

            if (!_break && pageError === null || !pageError.includes("erreurs sont apparues")) {
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

                  if (slowMode) {
                    promisesProcess.push(lock.acquire('shoot-position', function (done) {
                      extractShootPos(file, pageNum, shootPositions, pagePart)
                        .then(() => {
                          player.shootPositions.push(shootPositions);
                          done();
                        });
                    }, {}));
                  } else {
                    promisesProcess.push(extractShootPos(file, pageNum, shootPositions, pagePart)
                      .then(() => player.shootPositions.push(shootPositions)));
                  }
                });

                return Promise.all(promisesProcess).then(() => {
                  let playerStats = (homeTeamPart ? recap.teams[0] : recap.teams[1])
                    .players.find(p => p.lastnameFirstname
                      .includes(player.lastnameFirstnameReduced
                        .substr(0, player.lastnameFirstnameReduced.length - 1)))
                    .stats;

                  addMissedPositions(player.shootPositions, playerStats);

                  if (homeTeamPart) {
                    homeTeam.players.push(player);
                  } else {
                    awayTeam.players.push(player);
                  }
                });
              };

              [1, 2].forEach(part => {
                let titlePart = utils.extractDataFromXY(12, part === 1 ? 217 : 529, pageContent);

                if (titlePart !== "" && !titlePart.includes('e-Marque') &&
                  !(titlePart.substr(0, 7) === 'EQUIPE ' && titlePart.charAt(9) !== '.')) {
                  // it's a player, get his/her shoots
                  promises.push(process(340, 446, 552, part === 1 ? 334 : 646,
                    part === 1 ? 456 : 768, titlePart, part, homeTeamPart));
                } else if (titlePart.substr(0, 7) === 'EQUIPE ' && titlePart.charAt(9) !== '.') {
                  if (!first) homeTeamPart = false;
                  if (first) first = false;
                }
              });
            } else if (!_break) {
              resolve(false);
              _break = true;
            }
          });

        Promise.all(promises).then(() => resolve(true));
      });

    }).then((result) => !result ? resolveHandler(null) : resolveHandler([homeTeam, awayTeam])).catch((err) => rejectHandler(err));
  });
};

ShootPositionsExtractor.prototype.isShootPositions = function(file) {
  const handler = new ExtractorHandler();

  return handler.extractHandler(file).then((data) =>  {
    if(data.pages.length < 2) return false;

    return data.pages.map((page) => page.content.map(content => content.str))
      .every(contentPage => contentPage.indexOf("POSITIONS DE TIRS RÉUSSIS") > -1);
  });
};

module.exports = ShootPositionsExtractor;