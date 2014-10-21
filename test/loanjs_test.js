/*global describe,it*/
'use strict';
var assert  = require('assert'),
    Loan    = require('../lib/loanjs.js');

describe('loanjs node module.', function() {
  it('must be awesome', function() {
    var loan = new Loan(100000, 20, 3.5, true);

    assert(loan.installments.length === 20, true);
    assert(loan.interestSum > 0, true);
    assert(loan.capitalSum >= 100000, true);
    assert(loan.sum === loan.interestSum + loan.capitalSum, true);
  });
});
