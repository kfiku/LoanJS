/// <reference path="../../../typings/tsd.d.ts" />
import { CompareRow } from './Row';
import * as money from '../helpers/money';

let c3 =  require('c3');

export class CompareChart {
  chart;

  constructor() {

  }

  render(rows: CompareRow[]) {
    let t = window['trans'];
    let cols = [
      [`${t.equal_installments} ${t.interest_sum}`],
      [`${t.equal_installments} ${t.installment_amount}`],

      [`${t.diminishing_installments} ${t.interest_sum}`],
      [`${t.diminishing_installments} ${t.first_installment_amount}`],
      [`${t.diminishing_installments} ${t.last_installment_amount}`]
    ];

    rows.forEach((row) => {
      cols[0].push(row.data.equalInterestSum);
      cols[1].push(row.data.equalInstallmentAmount);

      cols[2].push(row.data.diminishingInterestsSum);
      cols[3].push(row.data.diminishingFirstInstallmentAmount);
      cols[4].push(row.data.diminishingLastInstallmentAmount);
    });

    if(!this.chart) {
      this.chart = c3.generate({
          bindto: '#chart',
          data: {
            columns: cols,
            type: 'bar',
          },
          axis : {
            x : { tick: { format: function (x) { return x + 1; } } },
            y : { tick: { format: function (y) { return money(y); } } }
          },
          // tooltip: {show: false},
          // point: {show: false},
          bar: {
            width: {
              ratio: 0.5 // this makes bar width 50% of length between ticks
            }
          },
          grid: {
            x: { show: true },
            y: { show: true }
          }
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
