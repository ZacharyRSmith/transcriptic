// TODO Refactor Tile to own class ?
var fs = require('fs');
var gm = require('gm');

var Promise = require('bluebird');
Promise.promisifyAll(gm.prototype);

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
};
Tiler.prototype.genTile = Promise.method(function (zoomLevel, i, j, next) {
  // TODO ? Refactor to reduce number of readStreams created ?
  var readStream = fs.createReadStream(this.filePath);
  // DUP SIDELENGTH refactor to new Tiler.zoomLevel ?
  var sideLength = Math.pow(2, zoomLevel);

  var tileWidth = this.size.width / sideLength;
  var tileHeight = this.size.height / sideLength;
  var tileX = j * tileWidth;
  var tileY = i * tileHeight;

  return gm(readStream)
      .crop(tileWidth, tileHeight, tileX, tileY)
      // TODO #quality destroys the image color.  Find some other way to 
      // reduce file size ?
      .quality(this.compressionLevels[zoomLevel])
      .writeAsync(util.genFileName(this.filePath, i, j, zoomLevel));
});
Tiler.prototype.genTileSetForZoomLevel = Promise.method(function (zoomLevel, next) {
  var _this = this;
  console.log('genTileSetForZoomLevel', zoomLevel);
  // DUP SIDELENGTH refactor to new Tiler.zoomLevel ?
  var sideLength = Math.pow(2, zoomLevel);

  var sub = Promise.method(function (zoomLevel, rowIdx, next) {
    if (rowIdx >= sideLength) return zoomLevel + 1;

    console.log('processing row:', rowIdx);
    return this.genTilesForRow.call(_this, zoomLevel, rowIdx)
        .then(function (genTilesForRowRes) {
          console.log('genTilesForRowRes', genTilesForRowRes);
          // DUP ITER PROMISE
          return sub.call(_this, zoomLevel, rowIdx + 1);
        });
  });

  return sub.call(_this, zoomLevel, 0).bind(_this); // TODO ? refactor #bind ?
});
Tiler.prototype.genTilesForRow = Promise.method(function (zoomLevel, rowIdx, next) {
  // DUP SIDELENGTH refactor to new Tiler.zoomLevel ?
  var sideLength = Math.pow(2, zoomLevel);
  var _this = this;

  var sub = Promise.method(function (zoomLevel, rowIdx, colIdx, next) {
    if (colIdx >= sideLength) return 'row done';

    console.log('processing tile at i:', rowIdx, 'j:', colIdx);
    return _this.genTile(zoomLevel, rowIdx, colIdx)
        .then(function (err) {
          if (err) console.error(err);
          // DUP ITER PROMISE
          return sub.call(_this, zoomLevel, rowIdx, colIdx + 1);
        });
  });

  // DUP ITER PROMISE
  return sub.call(_this, zoomLevel, rowIdx, 0);
});
Tiler.prototype.genTileSets = Promise.method(function (next) {
  
  var sub = Promise.method(function (zoomLevel, next) {
    if (zoomLevel > 2) {
    // if (zoomLevel > this.maxZoomLevel) { // TODO
      return '#genTileSets done';
    } else {
      console.log('processing zoomLevel:', zoomLevel);
      return this.genTileSetForZoomLevel(zoomLevel)
          .then(function (nextZoomLevel) {
            // DUP ITER PROMISE
            return sub.call(this, nextZoomLevel);
          });
    }
  });

  return sub.call(this, 0);
});
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
              // DUP ITER PROMISE
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
