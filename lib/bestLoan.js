/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {

if(typeof require === 'function') {
  var Loan = require('../lib/loan.js');
  var Interest = require('interestjs');
}

/**
 * Create BestLoan Object
 * @param {number} amount
 * @param {number} maxInstallment
 * @param {number} maxInstallmentsNumber
 * @param {number} interestRate
 * @param {number} savingsInterestRate
 *
 * @return {object} {
    best: {
      diminishing: false,
      moneyToLoan: 2949.44,
      moneyToSavings: 50.56,
      instNr: 204,
      loan: LoanJsObject,
      interest: IntrestJsObject,
      pointOfContact: { instNr: 146, costs: 164678.67 }
    },
    variants : [
      // all variants array
      {
        diminishing: false,
        moneyToLoan: 2949.44,
        moneyToSavings: 50.56,
        instNr: 204,
        loan: LoanJsObject,
        interest: IntrestJsObject,
        pointOfContact: { instNr: 146, costs: 164678.67 }
      },
      ...
    ]
  }
 */
var BestLoan = function (amount, maxInstallment, maxInstallmentsNumber, interestRate, savingsInterestRate, params) {
  'use strict';
  if(!amount                || amount                <= 0 ||
     !maxInstallment        || maxInstallment        <= 0 ||
     !maxInstallmentsNumber || maxInstallmentsNumber <= 0 ||
     !interestRate          || interestRate          <= 0 ||
     !savingsInterestRate   || savingsInterestRate   <= 0 ) {
    throw 'wrong parameters (' +
          [amount, maxInstallment, maxInstallmentsNumber, interestRate, savingsInterestRate].join(', ') +
          ')';
  }
  // defaults
  params = typeof params === 'object' ? params : {};
  /**
   * accuracy in months - how meny iterations will be counted in a year */
  params.accuracy = params.accuracy || 12;

  var variants = [],
      instNr = maxInstallmentsNumber,
      i = 0,
      v, best,

      // round helper function
      rnd = function (num) {
        return Math.round(num*100)/100;
      },

      countVariant = function (instNr, diminishing) {
        var loan = new Loan(amount, instNr, interestRate, diminishing),
            moneyToLoan = loan.installments[0].installment,
            moneyToSavings = rnd(maxInstallment - moneyToLoan),
            pointOfContact, interest, intI, loanI,
            i = 0;

        if(diminishing) {
          params.dynamicAmount = function(i) {
            if(loan.installments[i]) {
              return rnd(maxInstallment - loan.installments[i].installment);
            }
          };
        }

        if(moneyToSavings > 0) {
          interest = new Interest(moneyToSavings, instNr, savingsInterestRate, params);

          for (i; i < instNr; i++) {
            intI = interest.payments[i];
            loanI = loan.installments[i];

            if(intI.sum >= loanI.remain) {
              // in this month intrest sum is more or equal to loan remain
              // loan can be finished by putting money from saving to loan
              pointOfContact = {
                instNr: i,
                costs: rnd(loanI.interestSum)
              };
              break;
            }
          }
        }

        return {
          diminishing: !!diminishing,
          moneyToLoan: moneyToLoan,       // how mutch money go to loan installment
          moneyToSavings: moneyToSavings, // how mutch money go to savings
          instNr: instNr,
          loan: loan,
          interest: interest,
          pointOfContact: pointOfContact
        };

      };

  v = countVariant(instNr);
  while (v.pointOfContact) {
    variants.push(v);
    if(instNr > 12) {
      instNr -= params.accuracy;
      v = countVariant(instNr);
    } else {
      v = {};
    }
  }
  instNr += params.accuracy - 1;
  var acc = 1;
  v = countVariant(instNr);
  while (v.pointOfContact) {
    variants.push(v);
    instNr -= acc;
    v = countVariant(instNr);
  }

  instNr = maxInstallmentsNumber;
  v = countVariant(instNr, true);
  while (v.pointOfContact) {
    variants.push(v);
    if(instNr > 12) {
      instNr -= params.accuracy;
      v = countVariant(instNr, true);
    } else {
      v = {};
    }
  }
  instNr += params.accuracy - 1;
  v = countVariant(instNr);
  while (v.pointOfContact) {
    variants.push(v);
    instNr -= acc;
    v = countVariant(instNr, true);
  }

  for (i; i < variants.length; i++) {
    v = variants[i];
    if(!best || best.pointOfContact.costs > v.pointOfContact.costs) {
      best = v;
    }
  }

  return {
    best: best,
    variants: variants
  };

};

if(typeof module === 'undefined') {
  // browser
  if(typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.BestLoan = BestLoan;
  } else {
    if(!window.LoanJS) {
      window.LoanJS = {};
    }
    window.LoanJS.BestLoan = BestLoan;
  }
} else {
  // node or browserfy
  module.exports = BestLoan;
}

}());
