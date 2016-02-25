var fs = require('fs');
// var gm = require('gm');
var Promise = require('bluebird');
var gm = Promise.promisifyAll(require('gm'));

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

Tiler.prototype.genTile = Promise.method(function (zoomLevel, i, j, next) {
  var readStream = fs.createReadStream(this.filePath);
  var sideLength = Math.pow(2, zoomLevel);
  // var writeStream = fs.createWriteStream(util.genFileName(this.filePath, i, j, zoomLevel));

  var width = this.size.width / sideLength;
  var height = this.size.height / sideLength;
  var x = j * width;
  var y = i * height;

  var _this = this;
  var gmObj = gm(readStream);
  gmObj.writeAsync = Promise.method(function (filePath, cb, next) {
    return gmObj.write(filePath, cb);
  });
  return gmObj.writeAsync(util.genFileName(_this.filePath, i, j, zoomLevel), function (err) {
    if (err) console.error(err);
  }).then(function (res) {
    console.log('done processing', util.genFileName(_this.filePath, i, j, zoomLevel));
    return 'hello';
  });

  // return gm(readStream)
  //     // .crop(width, height, x, y)
  //     // .quality(_this.compressionLevels[zoomLevel])
  //     .write(util.genFileName(_this.filePath, i, j, zoomLevel), function (err) {
  //       if (err) console.error(err);
  //       console.log('done processing ', util.genFileName(_this.filePath, i, j, zoomLevel));
  //       return 'hello';
  //     });
      // .stream(function (err, stdout, stderr) {
      //   writeStream.on('close', function () {
      //     console.log('done processing ', util.genFileName(_this.filePath, i, j, zoomLevel));
      //     return;
      //   });
      //   stdout.pipe(writeStream);
      // });
});
Tiler.prototype.genTileSetForZoomLevel = Promise.method(function (zoomLevel, next) {
  var _this = this;
  console.log('genTileSetForZoomLevel', zoomLevel);
  var sideLength = Math.pow(2, zoomLevel);

  var genTilesForRow = Promise.method(function (zoomLevel, rowIdx, next) {
    var sub = Promise.method(function (zoomLevel, rowIdx, colIdx, next) {
      if (colIdx >= sideLength) return 'row done';

      console.log('processing tile at i:', rowIdx, 'j:', colIdx);
      return _this.genTile(zoomLevel, rowIdx, colIdx)
          .then(function (res) {
            console.log('res', res);
            return sub.call(_this, zoomLevel, rowIdx, colIdx + 1);
          });
    });

    return sub.call(_this, zoomLevel, rowIdx, 0);
  });

  var genRows = Promise.method(function (zoomLevel, next) {
    var sub = Promise.method(function (zoomLevel, rowIdx, next) {
      if (rowIdx >= sideLength) return 'rows done';

      console.log('processing row:', rowIdx);
      // console.log('this', this);
      return genTilesForRow.call(_this, zoomLevel, rowIdx)
          .then(function (genTilesForRowRes) {
            console.log('genTilesForRowRes', genTilesForRowRes);
            return sub.call(_this, zoomLevel, rowIdx + 1);
          });
    });

    return sub.call(_this, zoomLevel, 0);
  });

  return genRows.call(_this, zoomLevel)
      .bind(_this)
      .then(function () {
        return zoomLevel + 1;
      });
});
Tiler.prototype.genTileSets = Promise.method(function (next) {
  var sub = Promise.method(function (zoomLevel, next) {
    if (zoomLevel > 2) {
    // if (zoomLevel > this.maxZoomLevel) {
      return 'done';
    } else {
      console.log('processing zoomLevel:', zoomLevel);
      return this.genTileSetForZoomLevel(zoomLevel)
          .bind(this)
          .then(function (nextZoomLevel) {
            console.log('nextZoomLevel', nextZoomLevel);
            return sub.call(this, nextZoomLevel);
          });
    }
  });

  return sub.call(this, 0).then(function () { return; });
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
