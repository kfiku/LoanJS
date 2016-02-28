'use strict';

let env = process.argv[2] || 'dev';

let fs = require('fs');
let _ = require('lodash');

let getTrans = require('./trans');

let transes = getTrans();



var render = (file, tpl, data) => {
  for (let i = 0; i < transes.length; i++) {
    let lang    = transes[i].lang;
    let trans   = transes[i].trans;
    let tplData = { data, env, trans, assetsBase: '' };


    if (lang === 'en' && file === 'index') {
      // console.log(`render ${file}.html`);
      tplData.assetsBase = 'dist/'
      fs.writeFileSync(`./${file}.html`, tpl(tplData));
    } else {
      // console.log(`render ${file}_${lang}.html`);
      fs.writeFileSync(`./dist/${file}_${lang}.html`, tpl(tplData));
    }
  }
}

var dirs = fs.readdirSync('./src/html');

for (var i = 0; i < dirs.length; i++) {
  var fileBaseName = dirs[i].replace('.tpl', '')
  var file         = `./src/html/${dirs[i]}`
  let tpm          = _.template(fs.readFileSync(file, 'utf8'));

  render(fileBaseName, tpm);
}



