class ShootPositions {
  constructor() {
    this.positions = [];
    this.period = null;
    this.shootCount = null;
    this.hmtShootCount = null; // shoot hors des limites du demi terrain
  }

  isValid() {
    if (this.period == null || typeof this.period != "number") {
      return "ShootPositions is not valid (period)";
    } else if (this.shootCount == null || typeof this.shootCount != "number") {
      return "ShootPositions is not valid (shootCount)";
    } if (this.hmtShootCount != null && typeof this.hmtShootCount != "number") {
      return "ShootPositions is not valid (hmtShootCount)";
    } if (this.positions == null || ! Array.isArray(this.positions)) {
      return "ShootPositions is not valid (positions)";
    }

    const positionsValidations = this.positions.map((position) => position.isValid());
    if (!positionsValidations.every((validation) => validation === true)) {
      return positionsValidations.filter((v) => typeof v != "boolean").join(", ");
    }

    return true;
  }
}

module.exports = ShootPositions;