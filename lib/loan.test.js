/* eslint-env jest */
import Loan from './loan'
import rnd from './rnd'

test('loan js defined', () => {
  expect(Loan).toBeDefined()
})

test('loan js should count loan with equal instalment', () => {
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

test('loan js should throw on wrong params', () => {
  expect(() => Loan(20000, 'asd')).toThrowError('wrong parameters: 20000 asd undefined')
})
