import {default as tpl} from './../tpl/tableRow.tpl';

export class TableRow {
  constructor() {
    console.log('TableRow constructor');
  }

  render() {
    var el = document.createElement('tbody');
    el.innerHTML = tpl();

    return el.firstChild;
  }
};
