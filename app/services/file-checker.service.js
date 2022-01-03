const fs = require("fs");
const ExtractorHandler = require("./v1/extractor-handler.service");

function FileChecker() {}

/***
 * Checking file is correct
 * @param file : string - the file to check
 * @return string - empty if file is OK, an error message otherwise
 */
FileChecker.prototype.checkFile = async function (file) {
  if (file === null || file === "") {
    return { err: "File " + file + " is null or empty" };
  }

  try {
    if (!fs.existsSync(file)) {
      return { err: "File " + file + " does not exist" };
    }
  } catch {
    return { err: "File " + file + " does not exist" };
  }

  const handler = new ExtractorHandler();
  let data = await handler.extractHandler(file);

  if (data == null || data.meta == null || data.meta.info == null || data.pages == null) {
    return { err: "File " + file + " is not parsable" };
  }

  if (data.meta.info.Producer.indexOf("iTextSharp") === -1 && !data.meta.info.Producer.includes("Qt")) {
    return { err: "File " + file + " is not create with c# producer" };
  } else if (data.meta.info.Producer.indexOf("iTextSharp") !== -1) {
    return { version: 1 };
  } else if (data.meta.info.Producer.includes("Qt")) {
    return { version: 2 };
  }
};

module.exports = FileChecker;
