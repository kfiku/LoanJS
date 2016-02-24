'use strict';

let env = process.argv[2] || 'dev';

let fs = require('fs');
let _ = require('lodash');

let getTrans = require('./trans');

let transes = getTrans();

let indexTpm = _.template(fs.readFileSync(__dirname + '/../templates/index.tpl', 'utf8'));

for (let i = 0; i < transes.length; i++) {
  let lang = transes[i].lang;
  let trans = transes[i].trans;

  let tplData = {
    env,
    trans: trans
  };

  if (lang === 'en') {
    fs.writeFileSync('./index.html', indexTpm(tplData));
  } else {
    fs.writeFileSync(`./index_${lang}.html`, indexTpm(tplData));
  }
}

