/* eslint-env jest */
import Loan from './loan'
import rnd from './rnd'

test('loan js defined', () => {
  expect(Loan).toBeDefined()
})

test('loan js should count loan with equal instalment (annuity)', () => {
  const loan = Loan(20000, 30 * 12, 5, false)

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(30 * 12)
  expect(loan.installments[0].installment).toBe(107.36)
  expect(loan.installments[30 * 12 - 1].installment).toBe(107.36)
  expect(loan.amount).toBe(20000)
  expect(loan.capitalSum).toBe(20000)
  expect(loan.interestSum).toBe(18653.27)
  expect(loan.sum).toBe(38653.27)

  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)
})

test('loan js should count loan with equal instalment (annuity) as default', () => {
  /** @type any */
  const LoanToTest = Loan
  const loan = LoanToTest(20000, 30 * 12, 5, 'wrong-type-as-annuity')

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(30 * 12)
  expect(loan.installments[0].installment).toBe(107.36)
  expect(loan.installments[30 * 12 - 1].installment).toBe(107.36)
  expect(loan.amount).toBe(20000)
  expect(loan.capitalSum).toBe(20000)
  expect(loan.interestSum).toBe(18653.27)
  expect(loan.sum).toBe(38653.27)

  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)
})

test('loan js should count loan with dismissing instalment', () => {
  const loan = Loan(20000, 30 * 12, 5, true)

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(30 * 12)

  expect(loan.installments[0].installment).toBe(138.89)
  expect(loan.installments[30 * 12 - 1].installment).toBe(55.78)
  expect(loan.amount).toBe(20000)
  expect(loan.capitalSum).toBe(20000)
  expect(loan.interestSum).toBe(15040.44)
  expect(loan.sum).toBe(35040.44)

  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)
})

test('loan js should count loan with any loanType function', () => {
  /**
   * @type {import("../types").GetNextInstalmentPartFunction}
   */
  function getNext10Instalment (amount, installmentsNumber, capitalSum, interestRateMonth) {
    const capital = rnd(amount / installmentsNumber)
    const interest = 10
    const installment = capital + interest

    return { capital, interest, installment }
  }
  const loan = Loan(20000, 30 * 12, 5, getNext10Instalment)

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(30 * 12)

  expect(loan.installments[0].installment).toBe(65.56)
  expect(loan.installments[30 * 12 - 1].installment).toBe(65.56)
  expect(loan.amount).toBe(20000)
  expect(loan.capitalSum).toBe(20000)
  expect(loan.interestSum).toBe(3600)
  expect(loan.sum).toBe(23600)

  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)
})

test('loan js should count loan with annuity due function', () => {
  const loan = Loan(30000, 30 * 12, 5, 'annuityDue')

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(360)

  expect(loan.installments[0].installment).toBe(160.38)
  expect(loan.installments[23].installment).toBe(160.38)
  expect(loan.amount).toBe(30000)
  expect(loan.capitalSum).toBe(30000)
  expect(loan.interestSum).toBe(28291.49)
  expect(loan.sum).toBe(58291.49)

  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)
})

test('loan js should throw on wrong params', () => {
  /** @type any */
  const LoanToTest = Loan
  expect(() => LoanToTest(20000, 'asd')).toThrowError('wrong parameters: 20000 asd undefined')
})
