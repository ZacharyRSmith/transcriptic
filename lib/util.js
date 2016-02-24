module.exports = {
  genFileName: function (filePath, row, col, zoom) {
    var ary = filePath.split('.');
    ary[ary.length - 2] += '_row' + row + '_col' + col + '_zoom' + zoom;
    return ary.join('.');
  }
};
