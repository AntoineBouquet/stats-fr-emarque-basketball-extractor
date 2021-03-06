EventTypes = {
  "UNSUPPORTED_TYPE": 0,
  "ONE_POINT": 1,
  "TWO_POINTS": 2,
  "THREE_POINTS": 3,
  "START_MATCH": 4,
  "PLAYER_ENTERING_COURT": 5,
  "PLAYER_EXITING_COURT": 6,
  "POSSESSION_ARROW_INITIAL": 7,
  "POSSESSION_ARROW_SET": 8,
  "PERSONAL_FOUL": 9,
  "FREE_THROW_FAIL": 10,
  "FREE_THROW_SUCCESS": 11,
  "TIMEOUT": 12,
  "END_PERIOD": 13,
  "END_MATCH": 14
};

Object.freeze(EventTypes);

module.exports = EventTypes;