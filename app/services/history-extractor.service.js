ExtractorHanler = require('./extractor-handler.service');
const EventType = require('../models/basketball/event-types.enum');
const Event = require('../models/basketball/event.model');

function HistoryExtractor() {}

const processEvent = (event) => {
  if(event.message.includes("annulé")) {
    event.canceled = true;

    while(event.message.indexOf("Evénement annulé : /") !== -1) {
      try {
        event.message = event.message.substring(20).trim();
      } catch {
        event.message = "";
      }
    }
  }

  if(event.message.includes("Début du match")) {
    event.eventType = EventType.START_MATCH;
  } else if(event.message.includes("Tir à 2 points réussi") || event.message.includes("Tir à 3 points réussi") ||
    event.message.includes("Lancer franc réussi") || event.message.includes("Lancer franc manqué")) {
    if(event.message.includes("Tir à 2 points réussi")) {
      event.eventType = EventType.TWO_POINTS;
    } else if(event.message.includes("Tir à 3 points réussi")) {
      event.eventType = EventType.THREE_POINTS;
    } else if(event.message.includes("Lancer franc réussi")) {
      event.eventType = EventType.FREE_THROW_SUCCESS;
    } else if(event.message.includes("Lancer franc manqué")) {
      event.eventType = EventType.FREE_THROW_FAIL;
    }
    event.from = event.message.substring(1, event.message.indexOf(','));
    let value = event.message.split(' ').splice(-1)[0];
    event.value = value.substring(1, value.length - 1);
  } else if(event.message.includes("est entré sur le terrain") || event.message.includes("est entrée sur le terrain") ||
    event.message.includes("est sorti du terrain") || event.message.includes("est sortie du terrain")) {
    if(event.message.includes("sur le terrain")) {
      event.eventType = EventType.PLAYER_ENTERING_COURT;
    } else if(event.message.includes("du terrain")) {
      event.eventType = EventType.PLAYER_EXITING_COURT;
    }

    event.from = event.message.substring(1, event.message.indexOf(','));
  } else if(event.message.includes("Sens initial de la flèche")) {
    event.eventType = EventType.POSSESSION_ARROW_INITIAL;
    event.value = event.message.substr(event.message.length - 1, 1);
  } else if(event.message.includes("Flèche retournée")) {
    event.eventType = EventType.POSSESSION_ARROW_SET;
    event.value = event.message.substr(25, 1);
  } else if(event.message.includes("Faute :")) {
    event.eventType = EventType.PERSONAL_FOUL;
    event.from = event.message.substring(event.message.indexOf('à') + 3, event.message.indexOf(','));
    event.value = event.message.substring(event.message.indexOf('Faute : ') + 8, event.message.indexOf('à') - 1);
  } else if(event.message.includes("Temps-Mort")) {
    event.eventType = EventType.TIMEOUT;
    event.value = event.message.substring(event.message.indexOf('(') + 1, event.message.indexOf('minute') - 4);
  } else if(event.message.includes("Fin de période")) {
    event.eventType = EventType.END_PERIOD;
  } else if(event.message.includes("Fin du match")) {
    event.eventType = EventType.END_MATCH;
  } else {
    event.eventType = EventType.UNSUPPORTED_TYPE;
  }

  return event;
};

HistoryExtractor.prototype.extract = function(file) {
  let history = [];

  const handler = new ExtractorHanler();
  return new Promise((resolve, reject) =>
    handler.extractHandler(file).then((data) => {
      if(data != null && data.pages != null) {
        data.pages.forEach(page => {
          if(page.content != null) {
            let beginRowX = 55;
            let beginRowY = 185;
            let currentRowY = beginRowY;
            let currentEvent = null;

            let endRowY = page.pageInfo.num === 1 ? 788 : 800;

            page.content.filter(content => content.y >= beginRowY && content.y <= endRowY && content.x > 0)
              .forEach((content, index) => {
                if(content.x < beginRowX + 5 && currentRowY !== content.y) {
                  currentRowY = content.y;

                  if(index !== 0) {
                    history.push(processEvent(currentEvent));
                  }

                  currentEvent = new Event();
                  currentEvent.order = content.str;
                } else if(content.x < 120) {
                  currentEvent.period = content.str;
                } else if(content.x < 160) {
                  currentEvent.time = content.str;
                } else if(content.x < 174) {
                  currentEvent.team = content.str;
                } else {
                  if(currentEvent.message != null && currentEvent.message !== '') {
                    currentEvent.message += ' / ' + content.str;
                  } else {
                    currentEvent.message = content.str;
                  }
                }
              });

            if(currentEvent != null) {
              history.push(processEvent(currentEvent));
            }
          }
        });
      }

      resolve(history);
    }).catch((err) => reject(err)));
};

module.exports = HistoryExtractor;