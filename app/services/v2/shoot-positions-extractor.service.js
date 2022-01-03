const ExtractorHandler = require("./extractor-handler.service");
const TempFolder = require("../temp-folder.service");
const PDFImage = require("pdf-image").PDFImage;
const uuidv4 = require("uuid/v4");
const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const potrace = require("potrace");

const Player = require("../../models/basketball/player.model");
const Team = require("../../models/basketball/team.model");
const ShootPosition = require("../../models/basketball/shoot-position.model");
const ShootPositions = require("../../models/basketball/shoot-positions.model");

const ShootZones = require("../../models/basketball/shoot-zones.enum");

function ShootPositionsExtractor() {}

const extractShootPosPlayer = async function (file, numPage, part, stats) {
  const handler = new ExtractorHandler();
  let tempFolderService = new TempFolder();

  let title = (await handler.extractHandler(file, "1600x50+25+" + (part === 1 ? "705" : "1985"), numPage))[0];

  if (title == null || title.match(/^ÉQUIPE *[A-Z](?!\.)/) != null || title.match(/^.*e-Marque.*$/) != null) return false;

  let player = new Player();
  player.lastnameFirstnameReduced = title.match(/^([A-Z]+ [A-Z]\.) */)[1];

  let promises = [];

  for (period of [1, 2, 3, 4, 5]) {
    let shootPositions = new ShootPositions();
    shootPositions.period = period;

    let randomName = numPage + "-" + part + "-" + shootPositions.period + "-" + uuidv4();
    let diffImagePath = tempFolderService.folder + "/" + randomName + "-diff.png";

    let cropFieldsParts = [
      ["103x87+264+190"] /* Period 1 top */,
      ["103x87+264+297"] /* Period 2 top */,
      ["103x87+373+190"] /* Period 3 top */,
      ["103x87+373+297"] /* Period 4 top */,
      ["103x87+483+190"] /* Overtime top */,
      ["103x87+264+497"] /* Period 1 bottom */,
      ["103x87+264+604"] /* Period 2 bottom */,
      ["103x87+373+497"] /* Period 3 bottom */,
      ["103x87+373+604"] /* Period 4 bottom */,
      ["103x87+483+497"] /* Overtime bottom */,
    ];

    let cropCountParts = [
      ["80x40+1445+1145"] /* Period 1 top count */,
      ["80x40+1445+1590"] /* Period 2 top count */,
      ["80x40+1900+1145"] /* Period 3 top count */,
      ["80x40+1900+1590"] /* Period 4 top count */,
      ["80x40+2355+1145"] /* Overtime top count */,
      ["80x40+1445+2425"] /* Period 1 bottom count */,
      ["80x40+1445+2870"] /* Period 2 bottom count */,
      ["80x40+1900+2425"] /* Period 3 bottom count */,
      ["80x40+1900+2870"] /* Period 4 bottom count */,
      ["80x40+2355+2425"] /* Overtime bottom count */,
    ];

    let indexCropPart = shootPositions.period + (part - 1) * 5 - 1;

    shootPositions.shootCount = parseInt((await handler.extractHandler(file, cropCountParts[indexCropPart], numPage))[0]);

    if(shootPositions.shootCount == null || shootPositions.shootCount == 0) {
      shootPositions.shootCount = 0;
      player.shootPositions.push(shootPositions);
      promises.push(Promise.resolve());
    } else {
      const pdfImage = new PDFImage(file, {
        outputDirectory: tempFolderService.folder,
        pdfFileBaseName: randomName,
        convertOptions: {
          "-crop": cropFieldsParts[indexCropPart],
        },
      });
  
      let imagePath = await pdfImage.convertPage(numPage - 1);
  
      const img1 = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, 
        "../../resources/fields-empty/" + (period <= 2 ? "field-empty-2.png" : "field-empty-3.png"))));
      const img2 = PNG.sync.read(fs.readFileSync(imagePath));
      const { width, height } = img1;
      const diff = new PNG({ width, height });
      try {
        pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.96, alpha: 0 });
      } catch (err) {
        throw "An error occurred when make pixelmatch diff : " + err;
      }
  
      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
  
      promises.push(
        new Promise((resolve, reject) => {
          potrace.trace(diffImagePath, function (err, svg) {
            if (err) {
              reject("An error occurred when make potrace trace : " + err);
            } else {
              let svgCrosses = svg
                .substring(svg.indexOf("path d=") + 8, svg.indexOf("stroke") - 2)
                .split("M")
                .map((cross) => cross.trim());
              svgCrosses.splice(0, 1);
  
              svgCrosses.forEach((svgCross) => {
                let position = new ShootPosition();
                position.x = svgCross.substring(0, svgCross.indexOf(" "));
                position.y = svgCross.substring(svgCross.indexOf(" ") + 1, svgCross.indexOf("C") - 1);
                position.refWidth = width;
                position.refHeight = height;
                position.weight = svgCross.length;
  
                position.zone = calculateZone(position);
  
                shootPositions.positions.push(position);
              });
  
              if (shootPositions.positions != null) {
                if (shootPositions.shootCount < shootPositions.positions.length) {
                  // il y a trop de points récupérés, on enlève les points les plus proches jusqu'à atteindre
                  // le nombre attendu
                  while (shootPositions.shootCount < shootPositions.positions.length) {
                    let min = -1;
                    let indexToDelete = 0;
                    shootPositions.positions.forEach((shootPosition1, index) => {
                      shootPositions.positions.forEach((shootPosition2, index2) => {
                        if (index !== index2) {
                          let diff =
                            Math.abs(shootPosition1.x - shootPosition2.x) + Math.abs(shootPosition1.y - shootPosition2.y);
                          if (min === -1 || diff < min) {
                            min = diff;
                            indexToDelete = index;
                          }
                        }
                      });
                    });
  
                    shootPositions.positions.splice(indexToDelete, 1);
                  }
                }
              }
  
              addMissedPositions(shootPositions, stats);

              player.shootPositions.push(shootPositions);
              resolve();
            }
          });
        })
      );
    }
  }

  return Promise.all(promises)
    .then(() => {
      tempFolderService.cleanTmpFolder();
      return player;
    })
    .catch((err) => {
      tempFolderService.cleanTmpFolder();
      throw err;
    });
};

const calculateZone = (position) => {
  if (position.x && position.refWidth && position.y && position.refHeight) {
    let ratioX = position.x / position.refWidth;
    // refWidth to let y pos same reference to y
    let ratioY = position.y / position.refWidth;

    let hoopPos = { x: 0.5, y: 0.11 };
    let hoopZoneRadius = 0.084;
    let freeThrowLinePos = { x: 0.5, y: 0.394 };
    let freeThrowCircleRadius = 0.121;
    let threePointsRadius = 0.452;

    if (ratioY > 0.684) {
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
      } else if (
        Math.sqrt(Math.pow(Math.abs(ratioX - hoopPos.x), 2) + Math.pow(Math.abs(ratioY - hoopPos.y), 2)) <=
        hoopZoneRadius
      ) {
        return ShootZones.TWO_PTS_INT_SHORT;
      } else {
        return ShootZones.TWO_PTS_INT_LONG;
      }
    } else if (
      Math.sqrt(Math.pow(Math.abs(ratioX - hoopPos.x), 2) + Math.pow(Math.abs(ratioY - hoopPos.y), 2)) <=
      threePointsRadius
    ) {
      // 2 points zones
      if (ratioX < 0.336) {
        return ShootZones.TWO_PTS_EXT_45_DG_LEFT;
      } else if (ratioX > 0.671) {
        return ShootZones.TWO_PTS_EXT_45_DG_RIGHT;
      } else if (
        ratioY < 0.394 ||
        Math.sqrt(
          Math.pow(Math.abs(ratioX - freeThrowLinePos.x), 2) + Math.pow(Math.abs(ratioY - freeThrowLinePos.y), 2)
        ) <= freeThrowCircleRadius
      ) {
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
};

const addMissedPositions = (shootPositions, stats) => {
  if(stats != null) {
    shootPositions.forEach((shootPosition) => {
      if (parseInt(shootPosition.shootCount) > shootPosition.positions.length) {
        let addWeightier = (shootPositionsPart, gap) => {
          let newShootsPositions = [];
  
          if (shootPositionsPart && shootPositionsPart.length > 0 && gap > 0) {
            for (let i = 0; i < gap; i++) {
              let maxWeightShoot = shootPositionsPart.reduce(function (prev, current) {
                return prev.weight > current.weight ? prev : current;
              });
  
              maxWeightShoot.weight = maxWeightShoot.weight / 2;
              newShootsPositions.push(maxWeightShoot);
            }
          }
  
          return newShootsPositions;
        };
  
        const allPositions = shootPositions.map((sp) => sp.positions).reduce((a, b) => a.concat(b));
  
        let shootPositionsTwoPointsInt = allPositions.filter(
          (position) => position.zone === ShootZones.TWO_PTS_INT_LONG || position.zone === ShootZones.TWO_PTS_INT_SHORT
        );
        let gap2Int = stats.twoPointsIntMade - shootPositionsTwoPointsInt.length;
        shootPosition.positions.push(...addWeightier(shootPositionsTwoPointsInt, gap2Int));
  
        let shootPositionsTwoPointsExt = allPositions.filter(
          (position) =>
            position.zone === ShootZones.TWO_PTS_EXT_90_DG ||
            position.zone === ShootZones.TWO_PTS_EXT_45_DG_RIGHT ||
            position.zone === ShootZones.TWO_PTS_EXT_0_DG_RIGHT ||
            position.zone === ShootZones.TWO_PTS_EXT_45_DG_LEFT ||
            position.zone === ShootZones.TWO_PTS_EXT_0_DG_LEFT
        );
        let gap2Ext = stats.twoPointsExtMade - shootPositionsTwoPointsExt.length;
        shootPosition.positions.push(...addWeightier(shootPositionsTwoPointsExt, gap2Ext));
  
        let shootPositionsThreePoints = allPositions.filter(
          (position) =>
            position.zone === ShootZones.THREE_PTS_90_DG ||
            position.zone === ShootZones.THREE_PTS_45_DG_RIGHT ||
            position.zone === ShootZones.THREE_PTS_0_DG_RIGHT ||
            position.zone === ShootZones.THREE_PTS_45_DG_LEFT ||
            position.zone === ShootZones.THREE_PTS_0_DG_LEFT
        );
        // substract shoot out of semi-court
        let gap3 =
          stats.threePointsMade -
          shootPositions.map((shootPosition) => shootPosition.hmtShootCount).reduce((a, b) => parseInt(a) + parseInt(b)) -
          shootPositionsThreePoints.length;
        shootPosition.positions.push(...addWeightier(shootPositionsThreePoints, gap3));
      }
    });
  }
};

ShootPositionsExtractor.prototype.extract = async function (file, stats = null) {
  let teams = [new Team(true), new Team(false)];
  let teamIndex = -1;

  const handler = new ExtractorHandler();
  const pageCount = await handler.getPageCount(file);

  let promises = [];

  let pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);

  for (let pageNumber of pageNumbers) {
    let result = await extractShootPosPlayer(file, pageNumber, 1, stats);
    
    if (!result) teamIndex++;
    else teams[teamIndex].players.push(result);

    result = await extractShootPosPlayer(file, pageNumber, 2, stats);
    if (!result) teamIndex++;
    else teams[teamIndex].players.push(result);

    promises.push(Promise.resolve());
  }

  return Promise.all(promises).then(() => teams);
};

ShootPositionsExtractor.prototype.isShootPositions = async function (file) {
  const handler = new ExtractorHandler();

  let value1 = (await handler.extractHandler(file, "600x50+1700+50", 1))[0];

  if (value1 == null || value1.toUpperCase().trim() !== "POSITIONS DE TIRS RÉUSSIS") return false;

  let value2 = (await handler.extractHandler(file, "750x50+900+3275", 1))[0];

  if (value2 == null || value2.trim() !== "e-Marque - Fédération Française de Basket-Ball") return false;

  return true;
};

module.exports = ShootPositionsExtractor;
