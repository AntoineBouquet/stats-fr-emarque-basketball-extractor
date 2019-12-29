const fs = require('fs');

function FileChecker() {}

/***
 * Checking file is correct
 * @param file : string - the file to check
 * @return string - empty if file is OK, an error message otherwise
 */
FileChecker.prototype.checkFile = function(file) {
  if(file === null || file === "") {
    return "File " + file + " is null or empty";
  }

  try {
    fs.existsSync(file);
  } catch {
    return "File " + file + " does not exist";
  }

  return "";
};

module.exports = FileChecker;