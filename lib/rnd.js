/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

/**
 * Round helper function
 * @param {number} num number to round (example 123.4355 -> 123.44)
 *
 * @returns {number}
 */
function rnd (num) {
  return Math.round(num * 100) / 100
}

export default rnd
