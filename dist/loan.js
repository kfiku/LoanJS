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
   * @type {import("../types").GetNextInstalmentPartFunction}
   */
  function getNextDiminishingInstalment(amount, installmentsNumber, capitalSum, interestRateMonth) {
    var capital = rnd(amount / installmentsNumber);
    var interest = rnd((amount - capitalSum) * interestRateMonth);
    var installment = capital + interest;
    return {
      capital: capital,
      interest: interest,
      installment: installment
    };
  }

  /**
   * @type {import("../types").GetNextInstalmentPartFunction}
   */
  function getNextAnnuityInstalment(amount, installmentsNumber, capitalSum, interestRateMonth) {
    var z = 1 / (1 + interestRateMonth);
    var div = (1 - Math.pow(z, installmentsNumber)) * z;
    var installment = rnd(amount * (1 - z) / div);
    var interest = rnd((amount - capitalSum) * interestRateMonth);
    var capital = installment - interest;
    return {
      capital: capital,
      interest: interest,
      installment: installment
    };
  }

  /**
   * @type {import("../types").GetNextInstalmentPartFunction}
   */
  function getNextAnnuityDueInstalment(amount, installmentsNumber, capitalSum, interestRateMonth) {
    var z = 1 / (1 + interestRateMonth);
    var div = 1 - Math.pow(z, installmentsNumber);
    var installment = rnd(amount * (1 - z) / div);
    var interest = rnd((amount - capitalSum) * interestRateMonth);
    var capital = installment - interest;
    return {
      capital: capital,
      interest: interest,
      installment: installment
    };
  }
  var nextInstalmentFnMap = {
    annuity: getNextAnnuityInstalment,
    diminishing: getNextDiminishingInstalment,
    annuityDue: getNextAnnuityDueInstalment
  };

  /**
   * @type {import("../types").GetNextInstalmentFunction}
   */
  function getNextInstalment(amount, installmentsNumber, interestRate, loanType, capitalSum, interestSum) {
    var interestRateMonth = interestRate / 1200;
    var nextInstalmentFn = typeof loanType === 'function' ? loanType : nextInstalmentFnMap[loanType] || getNextAnnuityInstalment;
    var _nextInstalmentFn = nextInstalmentFn(amount, installmentsNumber, capitalSum, interestRateMonth),
      capital = _nextInstalmentFn.capital,
      interest = _nextInstalmentFn.interest,
      installment = _nextInstalmentFn.installment;
    return {
      capital: capital,
      interest: interest,
      installment: installment,
      remain: amount - capitalSum - capital,
      interestSum: interestSum + interest
    };
  }

  /**
   * @type {import('../types').LoanFunction}
   */
  function Loan(amount, installmentsNumber, interestRate) {
    var loanTypeWithBool = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'annuity';
    if (!amount || amount <= 0 || !installmentsNumber || installmentsNumber <= 0 || !interestRate || interestRate <= 0) {
      throw new Error("wrong parameters: ".concat(amount, " ").concat(installmentsNumber, " ").concat(interestRate));
    }
    var installments = [];
    var loanType = typeof loanTypeWithBool === 'boolean' ? loanTypeFromBool(loanTypeWithBool) : loanTypeWithBool;
    var interestSum = 0;
    var capitalSum = 0;
    var sum = 0;
    for (var i = 0; i < installmentsNumber; i++) {
      var inst = getNextInstalment(amount, installmentsNumber, interestRate, loanType, capitalSum, interestSum);
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

  /**
   * @param {boolean} boolType
   * @returns {import("../types").LoanType}
   */
  function loanTypeFromBool(boolType) {
    return boolType ? 'diminishing' : 'annuity';
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
