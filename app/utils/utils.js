function Utils() {}

Utils.prototype.extractDataFromXY = function(x, y, elems) {
  let result = null;
  if(x && y && elems) {
    let elem = elems.find(elem => Math.floor(elem.x) === Math.floor(x) &&
      Math.floor(elem.y) === Math.floor(y));

    if(elem == null){
      let minY = Math.min(...elems.map(elem => elem.y).filter(mY => mY >= y));
      let minX = Math.min(...elems.filter(elem => elem.y === minY).map(elem => elem.x).filter(mX => mX >= x));
      elem = elems.find(elem => elem.x === minX && elem.y === minY)
    }

    if(elem && elem.str) {
      result = elem.str;
    }
  }

  return result;
};

Utils.prototype.groupBy = key => array =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = isNaN(obj[key]) ? obj[key] : Math.floor(obj[key]);
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

module.exports = Utils;
