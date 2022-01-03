class ShootPosition {
  constructor() {
    this.x = null;
    this.y = null;
    this.refWidth = null;
    this.refHeight = null;
    this.weight = null;
    this.zone = null;
  }

  isValid() {
    if (this.x == null || typeof this.x != "number") {
      return "ShootPosition is not valid (x)";
    } else if (this.y == null || typeof this.y != "number") {
      return "ShootPosition is not valid (y)";
    } else if (this.refWidth == null || typeof this.refWidth != "number") {
      return "ShootPosition is not valid (refWidth)";
    } else if (this.refHeight == null || typeof this.refHeight != "number") {
      return "ShootPosition is not valid (refHeight)";
    } else if (this.weight == null || typeof this.weight != "number") {
      return "ShootPosition is not valid (weight)";
    } else if (this.zone == null || typeof this.zone != "number") {
      return "ShootPosition is not valid (zone)";
    }

    return true;
  } 
}

module.exports = ShootPosition;