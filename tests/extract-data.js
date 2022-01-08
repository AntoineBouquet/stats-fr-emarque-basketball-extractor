const ExtractorHandlerV1 = require("../app/services/v1/extractor-handler.service");
const ExtractorHandlerV2 = require("../app/services/v2/extractor-handler.service");

const extractorHandlerV1 = new ExtractorHandlerV1();
const extractorHandlerV2 = new ExtractorHandlerV2();

const test = async () => {
  const pdf = "tests/matchs/2/match-sheet.pdf";
  let data = await extractorHandlerV2.extractHandler(pdf, "1350x100+130+1600", 1,
    {removeLines: true, disableClearFiles: true});
  console.log(data);
}

test();
