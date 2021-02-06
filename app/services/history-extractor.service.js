const ExtractorHandler = require('./extractor-handler.service');
const EventType = require('../models/basketball/event-types.enum');
const Event = require('../models/basketball/event.model');

function HistoryExtractor() {}

const processEvent = (event) => {
  if(event.message.includes("Evénement annulé")) {
    event.canceled = true;

    while(event.message.indexOf("Evénement annulé : /") !== -1) {
      try {
        event.message = event.message.substring(20).trim();
      } catch {
        event.message = "";
      }
    }
  }

  let message = event.message;
  if(event.canceled && message.indexOf("Remplacé par") > -1) {
    message = message.substring(message.indexOf("Remplacé par :") + 17, message.length).trim();
  } else if (event.canceled) {
    event.eventType = EventType.UNSUPPORTED_TYPE;
    return event;
  }

  if(message.includes("Début du match")) {
    event.eventType = EventType.START_MATCH;
  } else if(message.includes("Tir à 2 points réussi") || message.includes("Tir à 3 points réussi") ||
    message.includes("Lancer franc réussi") || message.includes("Lancer franc manqué")) {
    if(message.includes("Tir à 2 points réussi")) {
      event.eventType = EventType.TWO_POINTS;
    } else if(message.includes("Tir à 3 points réussi")) {
      event.eventType = EventType.THREE_POINTS;
    } else if(message.includes("Lancer franc réussi")) {
      event.eventType = EventType.FREE_THROW_SUCCESS;
    } else if(message.includes("Lancer franc manqué")) {
      event.eventType = EventType.FREE_THROW_FAIL;
    }
    event.from = message.substring(1, message.indexOf(','));
    let value = message.split(' ').splice(-1)[0];
    event.value = value.substring(1, value.length - 1);
  } else if(message.includes("est entré sur le terrain") || message.includes("est entrée sur le terrain") ||
    message.includes("est sorti du terrain") || message.includes("est sortie du terrain")) {
    if(message.includes("sur le terrain")) {
      event.eventType = EventType.PLAYER_ENTERING_COURT;
    } else if(message.includes("du terrain")) {
      event.eventType = EventType.PLAYER_EXITING_COURT;
    }

    event.from = message.substring(1, message.indexOf(','));
  } else if(message.includes("Sens initial de la flèche")) {
    event.eventType = EventType.POSSESSION_ARROW_INITIAL;
    event.value = message.substr(message.length - 1, 1);
  } else if(message.includes("Flèche retournée")) {
    event.eventType = EventType.POSSESSION_ARROW_SET;
    event.value = message.substr(25, 1);
  } else if(message.includes("Faute :")) {
    event.eventType = EventType.PERSONAL_FOUL;
    event.from = message.substring(message.indexOf('à') + 3, message.indexOf(','));
    event.value = message.substring(message.indexOf('Faute : ') + 8, message.indexOf('à') - 1);
  } else if(message.includes("Temps-Mort")) {
    event.eventType = EventType.TIMEOUT;
    event.value = message.substring(message.indexOf('(') + 1, message.indexOf('minute') - 4);
  } else if(message.includes("Fin de période")) {
    event.eventType = EventType.END_PERIOD;
  } else if(message.includes("Fin du match")) {
    event.eventType = EventType.END_MATCH;
  } else {
    event.eventType = EventType.UNSUPPORTED_TYPE;
  }

  return event;
};

HistoryExtractor.prototype.extract = function(file) {
  let history = [];

  const handler = new ExtractorHandler();
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

HistoryExtractor.prototype.isHistory = function(file) {
  const handler = new ExtractorHandler();

  return handler.extractHandler(file).then((data) =>  {
    if(data.pages.length < 2) return false;

    return data.pages.map((page) => page.content.map(content => content.str))
      .every(contentPage => contentPage.indexOf("HISTORIQUE") > -1);
  });
};

module.exports = HistoryExtractor;