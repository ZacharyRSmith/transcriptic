var fs = require('fs');
var gm = require('gm');
// var Promise = require('bluebird');
// var fs = Promise.promisifyAll(require('fs'));
// var gm = Promise.promisifyAll(require('gm'));

var Tiler = require('../lib/tiler');


var filePath = process.argv[2];
var tiler = new Tiler(filePath);

tiler.setOriginalImageSize(function () {
  tiler.setMaxZoomLevel(function () {
    tiler.setCompressionLevels(function () {
      tiler.genTileSets(function (res) {
        console.log(res);
      }, function (err) {
        console.error(err);
      });
    });
  });
});
