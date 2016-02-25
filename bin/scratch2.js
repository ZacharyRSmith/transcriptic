// 'use strict';

// // require('should');
// var Promise = require('bluebird');
// var t = require('./scratch');

// Promise.promisifyAll(t);

// /*
//     Call t() once to demonstrate.
//     Call tAsync() and see t() is called
//     Call tAsync.then(fn), and then isn't called


//  */


// // this works as expected, calling t()
// console.log('calling t()...' + t.t());

// // this also works, calling t()
// t.tAsync();

// // the then() statement isn't called
// t.tAsync().then(function(res){
//     // I expect this to be called
//     console.log('HHHUUUZZZAAAHHH' + res);
// });


// /*
//     Keep the script running 5 seconds
//  */

// (function (i) {
//     setTimeout(function () {
//         console.log('finished program');
//     }, i * 1000)
// })(5);




var Promise = require('bluebird');

var scratch = Promise.promisifyAll(require('./scratch'));


var filePath = process.argv[2];

scratch.testAsync(filePath)
    .then(function (res) {
      console.log(res);
    }, function (err) {
      console.error(err);
    });
