var Tiler = require('../lib/tiler');


var filePath = process.argv[2];
var tiler = new Tiler(filePath);

tiler.setOriginalImageSize()
    .bind(tiler)
    // TODO ? move these setters to Tiler constructor function ? 
    .then(tiler.setMaxZoomLevel)
    .then(tiler.setCompressionLevels)
    .then(tiler.genTileSets)
    .then(function (res) {
      console.log('genTileSets res:', res);
    });
