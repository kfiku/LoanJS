/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
/**
 * Create Loan Object with all instalments and sum of interest
 * @param {Loan}    loan     loan object
 * @param {object}  params   params
 *
 * @return {string}       html string with table
 */
var loanToHtmlTable = function (loan, params) {
  'use strict';
  params = params || {};
  params.formatMoney = params.formatMoney || function (num) {
    return num.toFixed(2);
  };
  var
    fm = params.formatMoney,
    trans = function (key) {
      if(params.translations && params.translations[key]) {
        return params.translations[key];
      } else {
        return key;
      }
    },
    html = [
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th></th>' +
            '<th>' + trans('Capital') + '</th>' +
            '<th>' + trans('Intrest') + '</th>' +
            '<th>' + trans('Instalment') + '</th>' +
            '<th>' + trans('Remain') + '</th>' +
            '<th>' + trans('Interest sum') + '</th>' +
          '</tr>' +
        '</thead>'+
        '<tbody>',
          '',  // body content [1]
        '</tbody>' +
      '</table>'
    ];

  console.log(loan);

  for (var i = 0; i < loan.installments.length; i++) {
    var inst = loan.installments[i],
        instHtml =
          '<tr>' +
            '<td>' + (i+1) + '</td>' +
            '<td>' + fm(inst.capital) + '</td>' +
            '<td>' + fm(inst.intrest) + '</td>' +
            '<td>' + fm(inst.installment) + '</td>' +
            '<td>' + fm(inst.remain) + '</td>' +
            '<td>' + fm(inst.interestSum) + '</td>' +
          '</tr>';
    html[1] += instHtml;
  }

  html[1] +=
    '<tr>' +
      '<td>' + trans('sum') + '</td>' +
      '<td>' + fm(loan.capitalSum) + '</td>' +
      '<td>' + fm(loan.interestSum) + '</td>' +
      '<td>' + fm(loan.sum) + '</td>' +
      '<td>-</td>' +
      '<td>-</td>' +
    '</tr>';

  return html.join('');
};

if(typeof module !== 'undefined') {
    module.exports = loanToHtmlTable;
}
if(typeof module === 'undefined') {
  // browser
  if(typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.loanToHtmlTable = loanToHtmlTable;
  } else {
    if(!window.LoanJS) {
      window.LoanJS = {};
    }
    window.LoanJS.loanToHtmlTable = loanToHtmlTable;
  }
} else {
  // node or browserfy
  module.exports = loanToHtmlTable;
}

}());
