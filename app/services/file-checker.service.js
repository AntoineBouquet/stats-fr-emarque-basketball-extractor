const fs = require('fs');
const ExtractorHandler = require('./extractor-handler.service');

function FileChecker() {}

/***
 * Checking file is correct
 * @param file : string - the file to check
 * @return string - empty if file is OK, an error message otherwise
 */
FileChecker.prototype.checkFile = async function(file) {
  if(file === null || file === "") {
    return "File " + file + " is null or empty";
  }

  try {
    fs.existsSync(file);
  } catch {
    return "File " + file + " does not exist";
  }

  const handler = new ExtractorHandler();
  let data = await handler.extractHandler(file);

  if(data == null || data.meta == null || data.meta.info == null || data.pages == null)
    return "File " + file + " is not parsable";

  if(data.meta.info.Producer.indexOf("iTextSharp") === -1) {
    return "File " + file + " is not create with c# producer";
  }

  return "";
};

module.exports = FileChecker;