/*global describe,it*/
'use strict';
var assert  = require('assert'),
    Loan    = require('../lib/loan.js');

describe('loanjs node module.', function() {
  it('must count loan correctly', function() {
    var loan = new Loan(100000, 20, 3.5, true),
        sum = 0,
        interestSum = 0;

    assert(loan.installments.length === 20, true);
    for (var i = 0; i < loan.installments.length; i++) {
      var inst = loan.installments[i];
      assert(inst.capital > 0, true);
      assert(inst.intrest > 0, true);
      assert(inst.installment === inst.capital + inst.intrest, true);

      sum += inst.installment;
      interestSum += inst.intrest;
    }

    assert(loan.interestSum > 0, true, 'wrong interestSum');
    assert.equal(loan.capitalSum, 100000, 'wrong capitalSum');
    assert.equal(loan.interestSum, interestSum,
                'intrestsSum ('+loan.interestSum+') not exual to sum of all intrests ('+interestSum+') in instalments array');
    assert.equal(loan.sum, loan.interestSum + loan.capitalSum, true,
                'sum ('+loan.sum+') not equal to interestSum + capitalSum ('+(loan.interestSum + loan.capitalSum)+')');
    assert.equal(loan.sum, sum, true,
                'sum ('+loan.sum+') not exual to sum of all instalment ('+sum+') in instalments array');
  });
});
