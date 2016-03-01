import { CompareRow } from './Row';
import { CompareChart } from './Chart';

export class CompareList {
  el;
  chart: CompareChart;
  rows: CompareRow[] = [];
  addNewBtn;

  constructor() {
    this.el = document.querySelector('#mainTbody');
    this.addNewBtn = document.querySelector('#addCompareRow');
    this.addNewBtn.addEventListener('click', () => this.addNewRow())

    this.chart = new CompareChart();
    this.render();
  }

  getData() {
    let list = localStorage.getItem('compate');
    if (!list) {
      list = '[{}]';
    }
    try {
      list = JSON.parse(list);
    } catch (e) {
      list = [];
    }

    return list;
  }

  render() {
    this.getData().forEach((el) => this.addNewRow(el));

    this.chart.render(this.rows);
  }

  addNewRow (el: any = { amount: 100000, quantity: 360, interest: 3.5 }) {
    el.id = this.rows.length;
    let cr = new CompareRow(el);

    this.rows.push(cr);
    this.el.appendChild(cr.el);

    cr.on('change', () => this.onRowChange());
    cr.on('remove', () => this.onRowRemove(cr));

    this.save();
  }

  save () {
    let list = [];
    this.rows.forEach((row: CompareRow) => {
      list.push({
        id: row.data.id,
        amount: row.data.amount,
        quantity: row.data.quantity,
        interest: row.data.interest
      })
    });

    localStorage.setItem('compate', JSON.stringify(list));


    this.chart.render(this.rows);
  }

  onRowChange () {
    this.save();
  }

  onRowRemove (cr: CompareRow) {
    this.rows.splice(cr.data.id, 1);
    this.save();

    this.chart.unload(cr.data.id);
  }
};
