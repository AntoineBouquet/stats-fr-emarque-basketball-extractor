const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

function ExtractorHandler() {}

ExtractorHandler.prototype.extractHandler = function(file) {
  return new Promise((resolve, reject) =>
    pdfExtract.extract(process.cwd() + '/' + file, {}, (err, data) => {
      if (err) reject(err);
      else if (data != null && data.pages != null) {
        data.pages.forEach(page => {
          if(page.content != null) {
            page.content = page.content.sort((contentA, contentB) => {
              if(contentA.y - contentB.y === 0) {
                return contentA.x - contentB.x;
              } else {
                return contentA.y - contentB.y;
              }
            });
          }
        });

        resolve(data);
      }
    }));
};

module.exports = ExtractorHandler;