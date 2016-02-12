var express = require('express');

var app = express();


var router = express.Router();

router.get('/zoom-levels', function (req, res, next) {
  res.sendStatus(200);
});

app.use('/', router);


module.exports = app;
