// /*global describe,it*/
// 'use strict';
// var assert   = require('assert'),
//     BestLoan = require('../LoanJS').BestLoan;

// describe('loanjs node module.', function() {
//   it('must count best loan', function() {
//     // amount, maxInstallment, maxInstallmentsNumber, interestRate, savingsInterestRate, params
//     var variants = new BestLoan(420000, 3000, 12*30, 4.5, 3.5, {tax:19}),
//         v,
//         b = variants.best;

//     assert.ok(b, 'shoult be best variant');
//     assert.ok(b.pointOfContact, 'shoult be best variant pointOfContact');
//     assert.ok(b.pointOfContact.instNr <= b.instNr, 'best variant pointOfContact instNr shoult be >= variants instNr');

//     for (var i = 0; i < variants.variants.length; i++) {
//       v = variants.variants[i];
//       assert.ok(b.pointOfContact.costs <= v.pointOfContact.costs, 'best variant cost shoult be lowest');
//     }

//   });

//   it('must count best loan lower then 12m', function() {
//     // amount, maxInstallment, maxInstallmentsNumber, interestRate, savingsInterestRate, params
//     var variants = new BestLoan(20000, 3000, 12, 5, 3),
//         v,
//         b = variants.best;

//     assert.ok(b, 'shoult be best variant');
//     assert.ok(b.pointOfContact, 'shoult be best variant pointOfContact');
//     assert.ok(b.pointOfContact.instNr <= b.instNr, 'best variant pointOfContact instNr shoult be >= variants instNr');

//     for (var i = 0; i < variants.variants.length; i++) {
//       v = variants.variants[i];
//       assert.ok(b.pointOfContact.costs <= v.pointOfContact.costs, 'best variant cost shoult be lowest');
//     }

//   });
// });
