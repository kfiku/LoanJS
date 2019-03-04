const assert = require('assert').strict
const loan = require('./LoanJS')

const exampleLoan = new loan.Loan(20000, 30 * 12, 5, false)

assert.strictEqual(exampleLoan.installments.length, 30 * 12, 'Wrong installments number')
assert.strictEqual(exampleLoan.sum, 38653.27, 'Wrong sum of load')
