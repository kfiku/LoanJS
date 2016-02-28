import { CompareRow } from './Row';

export class CompareList {
  el;

  constructor() {
    this.el = document.getElementById('mainTbody');
    this.render();
  }

  getData() {
    let list = localStorage.getItem('compate');
    if (!list) {
      list = '[{ "id": 0, "amount": 100000, "quantity": 360, "interest": 3.5 }]';
    }
    try {
      list = JSON.parse(list);
    } catch (e) {
      list = [];
    }

    console.log(list);

    return list;
  }

  render() {
    this.getData().forEach((el) => {
      let cr = new CompareRow(el);
      this.el.appendChild(cr.el);
    })

  }
};
