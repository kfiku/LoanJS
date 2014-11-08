/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */


/**
 * Create Loan Object with all instalments and sum of interest
 * @param {number} amount                   full amount of Loan
 * @param {number} installmentsNumber       how meny installments will be
 * @param {number} interestRate             interest rate in percent (3.5)
 * @param {[bool]} diminishingInstallments  if installments will be
 *                                          diminishing (true) or
 *                                          equal/annuity (false)
 *
 * @return {object} {
 *                    amount: 1000,
 *                    capitalSum: 999.96,
 *                    interestSum: 27.09
 *                    sum: NaN
 *                    installments: [
 *                      {
 *                        capital: 83.33,
 *                        installment: 87.5
 *                        intrest: 4.17
 *                        remain: 0
 *                      },
 *                      {...},
 *                      ...
 *                    ]
 *                  }
 */
var Loan = function (amount, installmentsNumber, interestRate, diminishing) {
  'use strict';
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
            installment,
            irmPow,
            interestRateMonth = interestRate / 1200;

        if (diminishing) {
          capital = amount / installmentsNumber;
          intrest = (amount - capitalSum) * interestRateMonth;
          installment = capital + intrest;
        } else {
          irmPow = Math.pow(1 + interestRateMonth, installmentsNumber);
          installment = amount * ((interestRateMonth * irmPow) / (irmPow - 1));
          intrest = (amount - capitalSum) * interestRateMonth;
          capital = installment - intrest;
        }

        return {
          capital: rnd(capital),
          intrest: rnd(intrest),
          installment: rnd(installment),
          remain: capitalSum
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

if(typeof module !== 'undefined') {
    module.exports = Loan;
}
