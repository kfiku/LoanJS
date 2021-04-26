"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function () {
  'use strict';
  /*
   * LoanJS
   * Calculating loan in equal or diminishing installments
   * https://github.com/kfiku/LoanJS
   *
   * Copyright (c) 2014 Grzegorz Klimek
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
   * Copyright (c) 2014 Grzegorz Klimek
   * Licensed under the MIT license.
   */

  /**
   * Method to getting next instalment
   * @param {number} amount
   * @param {number} installmentsNumber
   * @param {number} interestRate
   * @param {boolean} diminishing
   * @param {number} capitalSum
   * @param {number} interestSum
   *
   * @returns {{ capital: number, interest: number, installment: number, remain: number, interestSum: number }}
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
   * Create Loan Object with all installments and sum of interest
   *
   * @param {number} amount                   full amount of Loan
   * @param {number} installmentsNumber       how many installments will be
   * @param {number} interestRate             interest rate in percent (3.5) equal/annuity (false)
   * @param {boolean} diminishing             if installments will be diminishing (true) or not
   *
   * @return {object}
   */


  function Loan(amount, installmentsNumber, interestRate) {
    var diminishing = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    /** Checking params */
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


  if (typeof module === 'undefined') {
    // browser
    if ((typeof LOANJS_NAMESPACE === "undefined" ? "undefined" : _typeof(LOANJS_NAMESPACE)) === 'object') {
      LOANJS_NAMESPACE.Loan = Loan; // eslint-disable-line no-undef
    } else {
      if (!window.LoanJS) {
        window.LoanJS = {};
      }

      window.LoanJS.Loan = Loan;
    }
  } else {
    // node or browserfy
    module.exports = Loan;
  }
})();
