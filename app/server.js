var express = require('express');
var path = require('path');

var app = express();
var router = express.Router();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

router.get('/', function (req, res, next) {
  // res.sendFile('./views/index.html');

  // res.sendFile(path.join(__dirname, '../public', 'index1.html'));
  res.sendFile('index.html', { root: path.join(__dirname, './views') });
});

router.get('/zoom-levels', function (req, res, next) {
  res.sendStatus(200);
});

// Example call:
// /tile?row=2&col=3&zoom=3
router.get('/tile', function (req, res, next) {
  var col = req.query.col;
  var row = req.query.row;
  var zoom = req.query.zoom;
  var options = {
    root: __dirname + '/assets/',
    headers: {
      'Content-Type': 'image/jpg',
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  function _genFileNameSuffix (col, row, zoom) {
    return '_row' + row + '_col' + col + '_zoom' + zoom;
  }
  var fileName = 'pic_of_me' + _genFileNameSuffix(col, row, zoom) + '.jpg';
  // var fileName = 'pic_of_me' + _genFileNameSuffix(col, row, zoom) + '.jpg';
  res.sendFile(fileName, options, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).send();
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.use('/', router);
app.use(express.static('app'));


module.exports = app;
