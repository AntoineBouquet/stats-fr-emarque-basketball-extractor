const tmpFolder = "tmp-extractor";
const fs = require("fs");
const path = require("path");
const uuidv4 = require("uuid/v4");

module.exports = class TempFolder {
  constructor() {
    let subFolder = uuidv4();
    this.folder = tmpFolder + '/' + subFolder;
  
    if (!fs.existsSync(tmpFolder)) {
      fs.mkdirSync(tmpFolder);
    }
  
    if(!fs.existsSync(this.folder)) {
      fs.mkdirSync(this.folder);
    }
  }
  
  /**
   * Clean tmp folder
   * @return {Promise<void>}
   */
  cleanTmpFolder = () => {
    let tmpExist = fs.existsSync(this.folder);
    
    if (!tmpExist) {
      return;
    }
  
    return new Promise((resolve, reject) =>
      fs.readdir(this.folder, (err, files) => {
        if(err) reject(err);
        
        files.forEach((file) => {
          try {
            fs.unlinkSync(path.join(this.folder, file));
          } catch (e) {
            console.error(e);
            reject(e);
          }
        });
  
        try {
          fs.rmdirSync(this.folder);
          resolve();
        } catch (err) {
          console.error(err);
          reject(err);
        }
      })
    );
  };
}
