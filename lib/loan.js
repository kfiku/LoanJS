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
 * @type {import("../types").GetNextInstalmentFunction}
 */
const getNextInstalment = (
  amount,
  installmentsNumber,
  interestRate,
  diminishing,
  capitalSum,
  interestSum
) => {
  let capital
  let interest
  let installment
  let irmPow
  const interestRateMonth = interestRate / 1200

  if (diminishing) {
    capital = rnd(amount / installmentsNumber)
    interest = rnd((amount - capitalSum) * interestRateMonth)
    installment = capital + interest
  } else {
    irmPow = Math.pow(1 + interestRateMonth, installmentsNumber)
    installment = rnd(amount * ((interestRateMonth * irmPow) / (irmPow - 1)))
    interest = rnd((amount - capitalSum) * interestRateMonth)
    capital = installment - interest
  }

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
function Loan (amount, installmentsNumber, interestRate, diminishing = false) {
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
  let interestSum = 0
  let capitalSum = 0
  let sum = 0

  for (let i = 0; i < installmentsNumber; i++) {
    const inst = getNextInstalment(
      amount,
      installmentsNumber,
      interestRate,
      diminishing,
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
