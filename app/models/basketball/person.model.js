"use strict";

class Person {
  constructor() {
    this.firstname = null;
    this.lastname = null;
    this.lastnameFirstname = null;
    this.lastnameFirstnameReduced = null;
  }

  isValid() {
    if (this.firstname != null && typeof this.firstname != "string") {
      return "Person is not valid (firstname)";
    } else if (this.lastname != null && typeof this.lastname != "string") {
      return "Person is not valid (lastname)";
    } else if (this.lastnameFirstname != null && typeof this.lastnameFirstname != "string") {
      return "Person is not valid (lastnameFirstname)";
    } else if (this.lastnameFirstnameReduced != null && typeof this.lastnameFirstnameReduced != "string") {
      return "Person is not valid (lastnameFirstnameReduced)";
    } else if (
      (this.firstname == null || this.lastname == null) &&
      this.lastnameFirstname == null &&
      this.lastnameFirstnameReduced == null
    ) {
      return "Person is not valid (not named)";
    }

    return true;
  }
}

module.exports = Person;
