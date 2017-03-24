/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

const rnd = require('./rnd.js')

/**
 * Method to geting next instalment
 * @param {number} amount
 * @param {number} installmentsNumber
 * @param {number} interestRate
 * @param {boolean} diminishing
 * @param {number} capitalSum
 * @param {number} interestSum
 *
 * @returns {{ capital: number, interest: number, installment: number, remain: number, interestSum: number }}
 */
const getNextInstalment = (
  amount, installmentsNumber, interestRate, diminishing, capitalSum, interestSum
) => {
  let capital
  let interest
  let installment
  let irmPow
  let interestRateMonth = interestRate / 1200

  if (diminishing) {
    capital = amount / installmentsNumber
    interest = (amount - capitalSum) * interestRateMonth
    installment = rnd(capital + interest)
  } else {
    irmPow = Math.pow(1 + interestRateMonth, installmentsNumber)
    installment = rnd(amount * ((interestRateMonth * irmPow) / (irmPow - 1)))
    interest = rnd((amount - capitalSum) * interestRateMonth)
    capital = installment - interest
  }

  return {
    capital: rnd(capital),
    interest: rnd(interest),
    installment: installment,
    remain: rnd(amount - capitalSum - capital),
    interestSum: interestSum + interest
  }
}

/**
 * Create Loan Object with all instalments and sum of interest
 *
 * @param {number} amount                   full amount of Loan
 * @param {number} installmentsNumber       how meny installments will be
 * @param {number} interestRate             interest rate in percent (3.5) equal/annuity (false)
 * @param {boolean} diminishing             if installments will be diminishing (true) or not
 *
 * @return {object}
 */
const Loan = (amount, installmentsNumber, interestRate, diminishing = false) => {
  /** Checking params */
  if (!amount || amount <= 0 ||
     !installmentsNumber || installmentsNumber <= 0 ||
     !interestRate || interestRate <= 0) {
    throw new Error(`wrong parameters: ${amount} ${installmentsNumber} ${interestRate}`)
  }

  let installments = []
  let interestSum = 0
  let capitalSum = 0
  let sum = 0

  for (let i = 0; i < installmentsNumber; i++) {
    let inst = getNextInstalment(
      amount, installmentsNumber, interestRate, diminishing, capitalSum, interestSum
    )

    inst.
    sum += inst.installment
    capitalSum += inst.capital
    interestSum += inst.interest
    /** adding lost sum on rounding */
    if (i === installmentsNumber - 1) {
      capitalSum += inst.remain
      sum += inst.remain
      inst.remain = 0
    }

    installments.push(inst)
  }

  return {
    installments: installments,
    amount: rnd(amount),
    interestSum: rnd(interestSum),
    capitalSum: rnd(capitalSum),
    sum: rnd(sum)
  }
}

module.exports = Loan