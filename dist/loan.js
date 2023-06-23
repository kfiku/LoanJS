"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.loan = factory());
})(void 0, function () {
  'use strict';

  /*
   * LoanJS
   * Calculating loan in equal or diminishing installments
   * https://github.com/kfiku/LoanJS
   *
   * Copyright (c) 2023 Grzegorz Klimek
   * Licensed under the MIT license.
   */

  /**
   * Round helper function
   * @param {number} num number to round (example 123.4355 -> 123.44)
   *
   * @returns {number}
   */
  function rnd(num) {
    return Math.round(num * 100) / 100;
  }

  /*
   * LoanJS
   * Calculating loan in equal or diminishing installments
   * https://github.com/kfiku/LoanJS
   *
   * Copyright (c) 2023 Grzegorz Klimek
   * Licensed under the MIT license.
   */

  /**
   * @type {import("../types").GetNextInstalmentFunction}
   */
  var getNextInstalment = function getNextInstalment(amount, installmentsNumber, interestRate, diminishing, capitalSum, interestSum) {
    var capital;
    var interest;
    var installment;
    var irmPow;
    var interestRateMonth = interestRate / 1200;
    if (diminishing) {
      capital = rnd(amount / installmentsNumber);
      interest = rnd((amount - capitalSum) * interestRateMonth);
      installment = capital + interest;
    } else {
      irmPow = Math.pow(1 + interestRateMonth, installmentsNumber);
      installment = rnd(amount * (interestRateMonth * irmPow / (irmPow - 1)));
      interest = rnd((amount - capitalSum) * interestRateMonth);
      capital = installment - interest;
    }
    return {
      capital: capital,
      interest: interest,
      installment: installment,
      remain: amount - capitalSum - capital,
      interestSum: interestSum + interest
    };
  };

  /**
   * @type {import('../types').LoanFunction}
   */
  function Loan(amount, installmentsNumber, interestRate) {
    var diminishing = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (!amount || amount <= 0 || !installmentsNumber || installmentsNumber <= 0 || !interestRate || interestRate <= 0) {
      throw new Error("wrong parameters: ".concat(amount, " ").concat(installmentsNumber, " ").concat(interestRate));
    }
    var installments = [];
    var interestSum = 0;
    var capitalSum = 0;
    var sum = 0;
    for (var i = 0; i < installmentsNumber; i++) {
      var inst = getNextInstalment(amount, installmentsNumber, interestRate, diminishing, capitalSum, interestSum);
      sum += inst.installment;
      capitalSum += inst.capital;
      interestSum += inst.interest;
      /** adding lost sum on rounding */
      if (i === installmentsNumber - 1) {
        capitalSum += inst.remain;
        sum += inst.remain;
        inst.remain = 0;
      }
      installments.push(inst);
    }
    return {
      installments: installments,
      amount: rnd(amount),
      interestSum: rnd(interestSum),
      capitalSum: rnd(capitalSum),
      sum: rnd(sum)
    };
  }

  /* istanbul ignore next */
  if (typeof window !== 'undefined') {
    /** @type {any} */
    var localWindow = window;
    if (!localWindow.LoanJS) {
      localWindow.LoanJS = {};
    }
    localWindow.LoanJS.Loan = Loan;
  }
  return Loan;
});
