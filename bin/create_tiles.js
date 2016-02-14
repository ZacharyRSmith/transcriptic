var fs = require('fs');

var gm = require('gm');
// var Promise = require('bluebird');
// Promise.promisifyAll(require('gm'));


function appendCopy (filePath) {
  var ary = filePath.split('.');
  ary[ary.length - 2] += '_copy';
  return ary.join('.');
}

// TODO Find mathematical way to guesstimate max zoom level
function findMaxZoomLevel (filePath) {
  // Took 80s for Heroku to serve a 26.6MB pic
  // 26.6MB / (80 * 4) = 83KBps
  // Goal: <100KB per tile
  var GOAL_SIZE = 100000;

  // TODO refactor to recurse on cropped image, not original image, to increase speed
  function tryMaxZoomLevel (filePath, zoomLevel) {
    var readStream = fs.createReadStream(filePath);
    var sizeReductionFactor = Math.pow(2, zoomLevel);
    var writeStream = fs.createWriteStream(appendCopy(filePath));

    gm(readStream)
        .size({ bufferStream: true }, function (err, size) {
          if (err) { return console.error(err); }

          this.crop(size.width / sizeReductionFactor,
                    size.height / sizeReductionFactor,
                    0,
                    0)
              .stream(function (err, stdout, stderr) {
                writeStream.on('close', function () {
                  if (writeStream.bytesWritten > GOAL_SIZE) {
                    return tryMaxZoomLevel(filePath, zoomLevel + 1);
                  } else {
                    // genTileSets(filePath, maxZoomLevel);
                    return console.log(zoomLevel);
                  }
                });
                stdout.pipe(writeStream);
              });
        });
  }
  tryMaxZoomLevel(filePath, 0);
}


var filePath = process.argv[2];

findMaxZoomLevel(filePath);
