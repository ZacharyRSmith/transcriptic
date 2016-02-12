

var fs = require('fs');

var gm = require('gm');
// var Promise = require('bluebird');
// Promise.promisifyAll(require('gm'));


var filePath = process.argv[2];

function removeLastExtension (filePath) {
  return filePath.split('.').slice(0, -1).join('.');
}

function topLeftQuarter (filePath) {
  gm(filePath)
      .filesize(function (err, fileSize) {
        console.log("BEFORE", fileSize);

        this.size(function (err, size) {
          this.resize(size.width * 2)
              .stream(function (err, stdout, stderr) {
                var writeStream = fs.createWriteStream(removeLastExtension(filePath) + '_copy.jpg');
                writeStream.on('close', function () {
                  console.log("INSIDE 2", writeStream);
                });
                stdout.pipe(writeStream)
              });
        });
      });
}

// function findMaxZoomLevel (imgSize) {
//   // Took 80s for Heroku to serve a 26.6MB pic
//   // 26.6MB / (80 * 4) = 83KBps
//   // Goal: <100KB per tile
//   var GOAL_SIZE = 100000;

//   var maxZoomLevel = 0;
//   var smallestUncompressedTileSize = imgSize;
//   var numTilesAtMaxZoomLevel = 1;
//   while (smallestUncompressedTileSize > GOAL_SIZE) {
//     numTilesAtMaxZoomLevel *= 4;
//     smallestUncompressedTileSize /= 4;
//     maxZoomLevel += 1;
//   }
//   console.log('maxZoomLevel:', maxZoomLevel);
// }

// findMaxZoomLevel(picSize);
topLeftQuarter(filePath);
