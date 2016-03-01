/// <reference path="../../../typings/tsd.d.ts" />
import { CompareRow } from './Row';

let c3 =  require('c3');

export class CompareChart {
  chart;

  constructor() {

  }

  render(rows: CompareRow[]) {
    let cols = [];

    rows.forEach((row) => {
      let col1 = ['loan ' + row.data.id + ' capital'];
      let col2 = ['loan ' + row.data.id + ' interest'];

      row.data.equalLoan.installments.forEach((inst, id) => {
        // console.log(col[id-1], inst.capital)
        col1.push((inst.capital[id-1] || 0) + inst.capital);
        col2.push((inst.interest[id-1] || 0) + inst.interest);
      });

      cols.push(col1);
      cols.push(col2);
    });

    if(!this.chart) {
      this.chart = c3.generate({
          bindto: '#chart',
          data: {
            columns: cols
          },
          tooltip: {show: false},
          point: {show: false},
          type: 'spline',
      });
    }

    else {
      this.chart.load({
        columns: cols
      })
    }
  }

  unload (id) {
    this.chart.unload({
      ids: ['loan ' + id + ' capital', 'loan ' + id + ' interest']
    })
  }
};
