const PDFImage = require("pdf-image").PDFImage;
const nodeTsOcr = require("node-ts-ocr");
const TempFolder = require("../temp-folder.service");
const { exec } = require("child_process");
const fs = require("fs");
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

function ExtractorHandler() {}

/**
 * Extract data from PDF file path (OCR mode)
 * @param file file path
 * @param zone zone of page to extract. Format : <width>x<height>+<x1>+<y1>
 * @param numPage page number (first page is number 1)
 * @param options options
 * @return {Promise<string[]>} data of PDF
 */
ExtractorHandler.prototype.extractHandler = async function (
  file,
  zone,
  numPage,
  options = {
    removeLines: false,
    disableClearFiles: false,
    densityRatio: 1
  }
) {
  const tempFolderService = new TempFolder();

  let density = 300;

  if(options.densityRatio != null && options.densityRatio != 1) {
    density = density * options.densityRatio;
    let zone1 = zone.split("+");
    let zone2 = zone1[0].split("x");
    zone = (parseInt(zone2[0]) * options.densityRatio).toString() + 'x' + 
      (parseInt(zone2[1]) * options.densityRatio).toString() + '+' +
      (parseInt(zone1[1]) * options.densityRatio).toString() + '+' +
      (parseInt(zone1[2]) * options.densityRatio).toString()
  }

  const pdfImage = new PDFImage(file, {
    outputDirectory: tempFolderService.folder,
    pdfFileBaseName: 'crop',
    convertOptions: {
      "-crop": zone,
      "-quality": "100",
      "-colorspace": "RGB",
      "-interlace": "none",
      "-density": density.toString(),
    },
  });

  let imageCropped = await pdfImage.convertPage(numPage - 1);

  if (options.removeLines != null && options.removeLines) {
    await new Promise((resolve, reject) =>
      exec(
        `convert \\( ${imageCropped} -alpha off \\) \\( -clone 0 -morphology close rectangle:1x50 -negate +write ${tempFolderService.folder}/crop-tmp1.png \\) \\( -clone 0 -morphology close rectangle:50x1 -negate +write ${tempFolderService.folder}/crop-tmp2.png \\) \\( -clone 1 -clone 2 -evaluate-sequence add +write ${tempFolderService.folder}/crop-tmp3.png \\) -delete 1,2 -compose plus -composite ${tempFolderService.folder}/result.png`,
        (error, stdout) => {
          if (error) {
            reject("Error convert command :" + error);
          } else {
            resolve(stdout);
          }
        }
      )
    );

    imageCropped = `${tempFolderService.folder}/result.png`;
  }

  await nodeTsOcr.Ocr.invokeImageOcr(
    tempFolderService.folder,
    imageCropped,
    { tesseractArgs: { l: "fra", "-psm": 6 } }
  );

  let result = fs
    .readFileSync(`${tempFolderService.folder}/output.txt`)
    .toString();

  if (options.disableClearFiles == null || ! options.disableClearFiles) {
    await tempFolderService.cleanTmpFolder();
  }

  if(options.enableReplaceFailedChars) {
    result = replaceFailedChars(result);
  }

  return result.split('\n').filter(line => line.trim() != '');
};

/**
 * Extract page count of PDF
 * @param {string} file file path
 * @returns {number} page count
 */
ExtractorHandler.prototype.getPageCount = async function(file) {
  return new Promise((resolve, reject) =>
    pdfExtract.extract(process.cwd() + '/' + file, {}, (err, data) => {
      if (err) reject(err);
      else if (data != null && data.pages != null) {
        resolve(data.pages.length);
      }
    }));
}

/**
 * Correct failed value from ocr parse
 * @param {string} value
 * @returns value corrected
 */
const replaceFailedChars = (value) => {
  if (value == null) return null;

  return value
    .replace(/[\(\[]e[\)\]]/g, "0")
    .replace(/ [oO] /g, " 0 ")
    .replace(/ O0 /g, " 0 ")
    .replace(/O00/g, "000")
    .replace(/O0/g, "0");
};

module.exports = ExtractorHandler;
