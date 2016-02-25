// 'use strict';
// var t = function(cb){
//     console.log('inside t()');
//     return (cb ? cb(null, 'j') : 'j');
// };

// module.exports = {
//     t: t
// };



var fs = require('fs');
var gm = require('gm');


module.exports = {
  test: function (filePath, cb) {
    gm(filePath)
        .resize(24, 24)
        .write(filePath + '_copy.jpg', function (err) {
          if (err) return console.error(err);

          return cb(null, 'done');
        });
  }
};

