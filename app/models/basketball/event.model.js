class Event {
  constructor() {
    this.eventType = null;
    this.from = null;
    this.order = null;
    this.message = null;
    this.time = null;
    this.period = null;
    this.team = null;
    this.canceled = false;
    this.value = null;
  }

  isValid() {
    if(this.eventType == null || typeof this.eventType != "number") {
      return "Event is not valid (eventType)";
    } else if (this.from != null && typeof this.from != "string") {
      return "Event is not valid (from)";
    } else if (this.order == null || typeof this.order != "number") {
      return "Event is not valid (order)";
    } else if (this.message != null && typeof this.message != "string") {
      return "Event is not valid (message)";
    } else if (this.time != null && typeof this.time != "string") {
      return "Event is not valid (time)";
    } else if (this.period != null && typeof this.period != "string") {
      return "Event is not valid (period)";
    } else if (this.canceled == null || typeof this.canceled != "boolean") {
      return "Event is not valid (canceled)";
    } else if (this.value != null && typeof this.value != "string") {
      return "Event is not valid (value)";
    }

    return true;
  }
}

module.exports = Event;
