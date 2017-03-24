/* eslint-env jest */
const Loan = require('./loan.js')
const rnd = require('./rnd.js')

test('loan js defined', () => {
  expect(Loan).toBeDefined()
})

test('loan js should count loan with equal instalment', () => {
  const loan = Loan(20000, 30 * 12, 5, false)

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(30 * 12)
  expect(loan.amount).toBe(20000)
  expect(loan.capitalSum).toBe(20000)
  expect(loan.interestSum).toBe(18653.27)
  expect(loan.sum).toBe(38653.27)

  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)
})
