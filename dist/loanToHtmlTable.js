"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.loanToHtmlTable = factory());
})(void 0, function () {
  'use strict';

  /**
   * @type {import("../types").LoanToHtmlTableFunction}
   */
  function loanToHtmlTable(loan) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    params.formatMoney = params.formatMoney || function (num) {
      return num.toFixed(2);
    };
    var fm = params.formatMoney;

    /** @param {string} key */
    var trans = function trans(key) {
      var _params$translations;
      return (params === null || params === void 0 || (_params$translations = params.translations) === null || _params$translations === void 0 ? void 0 : _params$translations[key]) || key;
    };
    var html = ['<table>' + '<thead>' + '<tr>' + '<th></th>' + '<th>' + trans('Capital') + '</th>' + '<th>' + trans('Interest') + '</th>' + '<th>' + trans('Instalment') + '</th>' + '<th>' + trans('Remain') + '</th>' + '<th>' + trans('Interest sum') + '</th>' + '</tr>' + '</thead>' + '<tbody>', '',
    // body content [1]
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
  if (typeof window !== 'undefined') {
    /** @type {any} */
    var localWindow = window;
    if (!localWindow.LoanJS) {
      localWindow.LoanJS = {};
    }
    localWindow.LoanJS.loanToHtmlTable = loanToHtmlTable;
  }
  return loanToHtmlTable;
});
