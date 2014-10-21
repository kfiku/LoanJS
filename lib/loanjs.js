/*
 *
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

'use strict';
/**
 * Create Loan Object with all instalments and sum of interest
 * @param {[number]} amount                   full amount of Loan
 * @param {[number]} installmentsNumber       how meny installments will be
 * @param {[number]} interestRate             interest rate in percent (3.5)
 * @param {[bool]}   diminishingInstallments  if installments will be
 *                                            diminishing (true) or
 *                                            equal/annuity (false)
 */
var Loan = function (amount, installmentsNumber, interestRate, diminishing) {

  if(!amount || amount <= 0 ||
     !installmentsNumber || installmentsNumber <= 0 ||
     !interestRate || interestRate <= 0 ) {
    throw 'wrong parameters (' +
          [amount, installmentsNumber, interestRate, diminishing].join(', ') +
          ')';
  }

  var installments = [],
      interestSum = 0,
      capitalSum  = 0,
      sum         = 0,

      inst,

      rnd = function (num) {
        return Math.round(num*100)/100;
      },

      getNextInstalment = function() {
        var capital,
            intrest,
            sum,
            irmPow,
            interestRateMonth = interestRate / 1200;

        if (diminishing) {
          capital = amount / installmentsNumber;
          intrest = (amount - capitalSum) * interestRateMonth;
          sum = capital + intrest;
        } else {
          irmPow = Math.pow(1 + interestRateMonth, installmentsNumber);
          sum = amount * ((interestRateMonth * irmPow) / (irmPow - 1));
          intrest = (amount - capitalSum) * interestRateMonth;
          capital = sum - intrest;

        }

        return {
          capital: rnd(capital),
          intrest: rnd(intrest),
          sum: rnd(sum)
        };
      };

  for (var i = 0; i < installmentsNumber; i++) {
    inst = getNextInstalment();

    installments.push(inst);

    sum         += inst.sum;
    capitalSum  += inst.capital;
    interestSum += inst.intrest;
  }

  return {
    installments  : installments,
    amount        : rnd(amount),
    interestSum   : rnd(interestSum),
    capitalSum    : rnd(capitalSum),
    sum           : sum
  };
};

module.exports = Loan;
