class ShootPositions {
  constructor() {
    this.positions = [];
    this.period = null;
    this.shootCount = null;
    this.hmtShootCount = null; // shoot hors des limites du demi terrain
  }
}

module.exports = ShootPositions;