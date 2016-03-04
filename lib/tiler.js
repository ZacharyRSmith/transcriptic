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
  this.SIDE_LENGTH = function (zoomLevel) { return Math.pow(2, zoomLevel); };
  // TODO ? capitalize to reflect that this is an instance constant ?
  this.filePath = filePath;

  // TODO rename to zoomLevelToCompressionMap
  this.compressionLevels = { }; // keys of zoomLevels and vals of compressionLevels
  // TODO rename to imgSize
  this.size = { height: null, width: null }; // vals in pixels of original image
  this.maxZoomLevel = 0; // int
};
Tiler.prototype.genTile = Promise.method(function (zoomLevel, i, j, next) {
  // TODO don't need to create readStream on orig img
  // instead, reduce quality of orig img, save it, then crop on that img
  // would ^ be more efficient ? maybe
  // can gm make multiple writes from one read ? seems no
  var readStream = fs.createReadStream(this.filePath);

  var tileWidth = this.size.width / this.SIDE_LENGTH(zoomLevel);
  var tileHeight = this.size.height / this.SIDE_LENGTH(zoomLevel);
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

  var sub = Promise.method(function (zoomLevel, rowIdx, next) {
    if (!this._isInBounds(rowIdx, zoomLevel)) return console.log('zoomLevel done');

    console.log('processing row:', rowIdx);
    return this.genTilesForRow.call(_this, zoomLevel, rowIdx)
        .then(function () {
          return sub.call(_this, zoomLevel, rowIdx + 1);
        });
  });

  return sub.call(_this, zoomLevel, 0).bind(_this);
});
Tiler.prototype.genTilesForRow = Promise.method(function (zoomLevel, rowIdx, next) {
  var _this = this;

  var sub = Promise.method(function (zoomLevel, rowIdx, colIdx, next) {
    if (!this._isInBounds(colIdx, zoomLevel)) return console.log('row done');

    console.log('processing tile at i:', rowIdx, 'j:', colIdx);
    return _this.genTile(zoomLevel, rowIdx, colIdx)
        .then(function () {
          return sub.call(_this, zoomLevel, rowIdx, colIdx + 1);
        });
  });

  return sub.call(_this, zoomLevel, rowIdx, 0);
});
Tiler.prototype.genTileSets = Promise.method(function (next) {
  var sub = Promise.method(function (zoomLevel, next) {
    if (zoomLevel > 1) {
    // if (zoomLevel > this.maxZoomLevel) { // TODO
      return '#genTileSets done';
    }

    console.log('processing zoomLevel:', zoomLevel);
    return this.genTileSetForZoomLevel(zoomLevel)
        .then(function () {
          return sub.call(this, zoomLevel + 1);
        });
  });

  return sub.call(this, 0);
});
Tiler.prototype._isInBounds = function (idx, zoomLevel) {
  return idx < this.SIDE_LENGTH(zoomLevel);
};
Tiler.prototype.setCompressionLevels = Promise.method(function (next) {
  // NOTE this method does not currently require promisification
  // TODO make this not so naive...set compressionLevels dynamically,
  // according to preliminary img processing results
  for (var zoomLevel = this.maxZoomLevel; zoomLevel >= 0; zoomLevel--) {
    var denominator = this.maxZoomLevel - (zoomLevel - 1);
    this.compressionLevels[zoomLevel] = 1 / denominator;
  }
});
Tiler.prototype.setMaxZoomLevel = Promise.method(function (next) {
  var tryZoomLevel = Promise.method(function (zoomLevel, next) {
    var readStream = fs.createReadStream(this.filePath);
    var writeStream = fs.createWriteStream(this.filePath + '_copy.jpg');

    var width = this.size.width / Math.pow(2, zoomLevel);
    var height = this.size.height / Math.pow(2, zoomLevel);

    var _this = this;
    return gm(readStream)
        // TODO crop on previous crop (recurse), instead of original img
        .crop(width, height, 0, 0)
        .stream(function (err, stdout, stderr) {
          writeStream.on('close', function () {
            if (writeStream.bytesWritten > _this.GOAL_MAX_TILE_SIZE) {
              return tryZoomLevel.call(_this, zoomLevel + 1);
            } else {
              _this.maxZoomLevel = zoomLevel;
              return;
            }
          });
          stdout.pipe(writeStream);
        })
  });
  return tryZoomLevel.call(this, 0);
});
Tiler.prototype.setOriginalImageSize = Promise.method(function (next) {
  // TODO ? simplify this ?
  var readStream = fs.createReadStream(this.filePath);
  var _this = this;

  return gm(readStream)
      .size({ bufferStream: true }, function (err, size) {
        if (err) return console.error(err);

        _this.size = size;
        return;
      });
});


module.exports = Tiler;
