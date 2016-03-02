import { CompareRow } from './Row';
import { CompareChart } from './Chart';

export class CompareList {
  el;
  toid;
  chart: CompareChart;
  rows: CompareRow[] = [];
  addNewBtn;

  constructor() {
    this.el = document.querySelector('#mainTbody');
    this.addNewBtn = document.querySelector('#addCompareRow');
    this.addNewBtn.addEventListener('click', () => this.addNewRow());

    this.chart = new CompareChart();
    this.render();
  }

  getData() {
    let list = localStorage.getItem('compate');
    if (!list) {
      list = `[
        { "amount": 5000, "quantity": 10, "interest": 5 },
        { "amount": 5000, "quantity": 8, "interest": 5 }
      ]`;
    }
    try {
      list = JSON.parse(list);
    } catch (e) {
      list = [];
    }

    return list;
  }

  render() {
    this.getData().forEach((el) => this.addNewRow(el, true));

    this.chart.render(this.rows);
  }

  addNewRow (el: any = { amount: 5000, quantity: 10, interest: 5 }, init = false) {
    el.id = this.rows.length;
    let cr = new CompareRow(el);

    this.rows.push(cr);
    this.el.appendChild(cr.el);

    cr.on('change', () => this.onRowChange());
    cr.on('remove', () => this.onRowRemove(cr));

    if (!init) {
      this.save();
    }
  }

  save () {
    let list = [];
    this.rows.forEach((row: CompareRow) => {
      list.push({
        id: row.data.id,
        amount: row.data.amount,
        quantity: row.data.quantity,
        interest: row.data.interest
      });
    });

    localStorage.setItem('compate', JSON.stringify(list));

    clearTimeout(this.toid);
    this.toid = setTimeout(() => this.chart.render(this.rows), 250);
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
