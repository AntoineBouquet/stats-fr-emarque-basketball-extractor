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
}

module.exports = Event;
