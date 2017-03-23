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
 * @param {number} num number to rount (example 123.4355 -> 123.44)
 *
 * @returns {number}
 */
const rnd = num => Math.round(num * 100) / 100

module.exports = rnd
