/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2023 Grzegorz Klimek
 * Licensed under the MIT license.
 */

import rnd from './rnd'

/**
 * @type {import("../types").GetNextInstalmentPartFunction}
 */
function getNextDiminishingInstalment (amount, installmentsNumber, capitalSum, interestRateMonth) {
  const capital = rnd(amount / installmentsNumber)
  const interest = rnd((amount - capitalSum) * interestRateMonth)
  const installment = capital + interest

  return { capital, interest, installment }
}

/**
 * @type {import("../types").GetNextInstalmentPartFunction}
 */
function getNextAnnuityInstalment (amount, installmentsNumber, capitalSum, interestRateMonth) {
  const irmPow = Math.pow(1 + interestRateMonth, installmentsNumber)
  const installment = rnd(amount * ((interestRateMonth * irmPow) / (irmPow - 1)))
  const interest = rnd((amount - capitalSum) * interestRateMonth)
  const capital = installment - interest

  return { capital, interest, installment }
}

const nextInstalmentFnMap = {
  annuity: getNextAnnuityInstalment,
  diminishing: getNextDiminishingInstalment
}

/**
 * @type {import("../types").GetNextInstalmentFunction}
 */
function getNextInstalment (
  amount,
  installmentsNumber,
  interestRate,
  loanType,
  capitalSum,
  interestSum
) {
  const interestRateMonth = interestRate / 1200
  const nextInstalmentFn = nextInstalmentFnMap[loanType] || getNextAnnuityInstalment
  const { capital, interest, installment } = nextInstalmentFn(amount, installmentsNumber, capitalSum, interestRateMonth)

  return {
    capital,
    interest,
    installment,
    remain: amount - capitalSum - capital,
    interestSum: interestSum + interest
  }
}

/**
 * @type {import('../types').LoanFunction}
 */
function Loan (amount, installmentsNumber, interestRate, loanTypeWithBool = 'annuity') {
  if (
    !amount ||
    amount <= 0 ||
    !installmentsNumber ||
    installmentsNumber <= 0 ||
    !interestRate ||
    interestRate <= 0
  ) {
    throw new Error(
      `wrong parameters: ${amount} ${installmentsNumber} ${interestRate}`
    )
  }

  const installments = []
  const loanType = typeof loanTypeWithBool === 'boolean' ? loanTypeFromBool(loanTypeWithBool) : loanTypeWithBool
  let interestSum = 0
  let capitalSum = 0
  let sum = 0

  for (let i = 0; i < installmentsNumber; i++) {
    const inst = getNextInstalment(
      amount,
      installmentsNumber,
      interestRate,
      loanType,
      capitalSum,
      interestSum
    )

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
    installments,
    amount: rnd(amount),
    interestSum: rnd(interestSum),
    capitalSum: rnd(capitalSum),
    sum: rnd(sum)
  }
}

/**
 * @param {boolean} boolType
 * @returns {import("../types").LoanType}
 */
function loanTypeFromBool (boolType) {
  return boolType ? 'diminishing' : 'annuity'
}

/* istanbul ignore next */
if (typeof window !== 'undefined') {
  /** @type {any} */
  const localWindow = window
  if (!localWindow.LoanJS) {
    localWindow.LoanJS = {}
  }
  localWindow.LoanJS.Loan = Loan
}

export default Loan
