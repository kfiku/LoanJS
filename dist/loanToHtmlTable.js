"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function () {
  'use strict';
  /**
   * Create Loan Object with all installments and sum of interest
   * @param {Loan}    loan     loan object
   * @param {object}  params   params
   *
   * @return {string}       html string with table
   */

  function loanToHtmlTable(loan, params) {
    params = params || {};

    params.formatMoney = params.formatMoney || function (num) {
      return num.toFixed(2);
    };

    var fm = params.formatMoney;

    var trans = function trans(key) {
      if (params.translations && params.translations[key]) {
        return params.translations[key];
      } else {
        return key;
      }
    };

    var html = ['<table>' + '<thead>' + '<tr>' + '<th></th>' + '<th>' + trans('Capital') + '</th>' + '<th>' + trans('Interest') + '</th>' + '<th>' + trans('Instalment') + '</th>' + '<th>' + trans('Remain') + '</th>' + '<th>' + trans('Interest sum') + '</th>' + '</tr>' + '</thead>' + '<tbody>', '', // body content [1]
    '</tbody>' + '</table>'];

    for (var i = 0; i < loan.installments.length; i++) {
      var inst = loan.installments[i];
      var instHtml = '<tr>' + '<td>' + (i + 1) + '</td>' + '<td>' + fm(inst.capital) + '</td>' + '<td>' + fm(inst.interest) + '</td>' + '<td>' + fm(inst.installment) + '</td>' + '<td>' + fm(inst.remain) + '</td>' + '<td>' + fm(inst.interestSum) + '</td>' + '</tr>';
      html[1] += instHtml;
    }

    html[1] += '<tr>' + '<td>' + trans('sum') + '</td>' + '<td>' + fm(loan.capitalSum) + '</td>' + '<td>' + fm(loan.interestSum) + '</td>' + '<td>' + fm(loan.sum) + '</td>' + '<td>-</td>' + '<td>-</td>' + '</tr>';
    return html.join('');
  }
  /* istanbul ignore next */


  if (typeof module === 'undefined') {
    // browser
    if ((typeof LOANJS_NAMESPACE === "undefined" ? "undefined" : _typeof(LOANJS_NAMESPACE)) === 'object') {
      LOANJS_NAMESPACE.loanToHtmlTable = loanToHtmlTable; // eslint-disable-line no-undef
    } else {
      if (!window.LoanJS) {
        window.LoanJS = {};
      }

      window.LoanJS.loanToHtmlTable = loanToHtmlTable;
    }
  } else {
    // node or browserfy
    module.exports = loanToHtmlTable;
  }
})();
