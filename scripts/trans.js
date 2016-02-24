'use strict';

let fs = require('fs');

module.exports = function () {
  let trans = [];
  let transDir = './trans';

  let transFiles = fs.readdirSync(transDir);
  for (let i = 0; i < transFiles.length; i++) {
    try {
      let t = JSON.parse(fs.readFileSync(transDir + '/' + transFiles[i]));
      trans.push ({
        lang: transFiles[i].split('.')[0],
        trans: t
      });
    } catch (e) {
      console.log(e);
    }
  }

  return trans;
};
