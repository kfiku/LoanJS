'use strict'

var Loan = require('loanjs').Loan

var loan1 = new Loan(1000, 12, 5, true)
console.log(loan1)
// loan on 1 000($) in 12 diminishing installments (ex. months) with 5% interest rate

var loan2 = new Loan(500000, 360, 3.5)
console.log(loan2)
// loan on 500 000($) in 360 equal installments (30 years) with 3.5% interest rate
