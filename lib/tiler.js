var fs = require('fs');
var gm = require('gm');

var util = require('./util');


var Tiler = function (filePath) {
  // // Took 80s for Heroku to serve a 26.6MB pic
  // // 26.6MB / (80 * 4) = 83KBps
  // // Goal: <100KB per tile
  this.GOAL_MAX_TILE_SIZE = 100000;
  this.filePath = filePath;

  this.compressionLevels = { }; // keys of zoomLevels and vals of compressionLevels
  this.size; // hash containing props .width and .height, in pixels of original image
  this.maxZoomLevel; // int
}

Tiler.prototype.genTile = function (zoomLevel, i, j, next) {
  var readStream = fs.createReadStream(this.filePath);
  var sideLength = Math.pow(2, zoomLevel);
  var writeStream = fs.createWriteStream(util.genFileName(this.filePath, i, j, zoomLevel));

  var width = this.size.width / sideLength;
  var height = this.size.height / sideLength;
  var x = j * width;
  var y = i * height;

  gm(readStream)
      .crop(width, height, x, y)
      .quality(this.compressionLevels[zoomLevel])
      .stream(function (err, stdout, stderr) {
        writeStream.on('close', function () {
          console.log('done processing ', util.genFileName(this.filePath, i, j, zoomLevel));
          next();
        });
        stdout.pipe(writeStream);
      });
};
Tiler.prototype.genTileSetForZoomLevel = function (zoomLevel) {
  var sideLength = Math.pow(2, zoomLevel);

  for (var i = 0; i < sideLength; i++) {
    for (var j = 0; j < sideLength; j++) {
      this.genTile(zoomLevel, i, j);
    }
  }
};
Tiler.prototype.genTileSets = function () {
    for (var zoomLevel = 0; zoomLevel <= this.maxZoomLevel; zoomLevel++) {
      this.genTileSetForZoomLevel(zoomLevel);
    }
};
Tiler.prototype.setCompressionLevels = function (next) {
// TODO Make this not so naive
  for (var zoomLevel = this.maxZoomLevel; zoomLevel >= 0; zoomLevel--) {
    var denominator = this.maxZoomLevel - (zoomLevel - 1);
    this.compressionLevels[zoomLevel] = 1 / denominator;
  }
  console.log("COMPRESSION", this.compressionLevels);
  next();
};
Tiler.prototype.setMaxZoomLevel = function (next) {
  // TODO refactor to recurse on cropped image, not original image, to increase speed
  function tryZoomLevel (zoomLevel) {
    var readStream = fs.createReadStream(this.filePath);
    var writeStream = fs.createWriteStream(this.filePath + '_copy.jpg');

    var width = this.size.width / Math.pow(2, zoomLevel);
    var height = this.size.height / Math.pow(2, zoomLevel);

    var _this = this;
    gm(readStream)
        .crop(width, height, 0, 0)
        .stream(function (err, stdout, stderr) {
          writeStream.on('close', function () {
            if (writeStream.bytesWritten > _this.GOAL_MAX_TILE_SIZE) {
              return tryZoomLevel.call(_this, zoomLevel + 1);
            } else {
              _this.maxZoomLevel = zoomLevel;
              return next();
            }
          });
          stdout.pipe(writeStream);
        })
  }
  tryZoomLevel.call(this, 0);
};
Tiler.prototype.setOriginalImageSize = function (next) {
  var readStream = fs.createReadStream(this.filePath);
  var _this = this;

  gm(readStream)
      .size({ bufferStream: true }, function (err, size) {
        if (err) { return console.error(err); }

        _this.size = size;
        next();
      });
};


module.exports = Tiler;
