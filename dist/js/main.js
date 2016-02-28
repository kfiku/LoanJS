(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * InterestJS
 * Calculate compound interest
 * https://github.com/kfiku/InterestJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
/**
 * Create Interest Object
 * @param {number} amount                   full amount of Loan
 * @param {number} installmentsNumber       how meny installments will be
 * @param {number} interestRate             interest rate in percent (3.5)
 * @param {[bool]} diminishingInstallments  if installments will be
 *                                          diminishing (true) or
 *                                          equal/annuity (false)
 *
 * @return {object} {
 *                    payments  : [
*                      {
*                        capital: number,
*                        interest: number,
*                        tax: number,
*                        capitalSum: number,
*                        sum: number
*                      }
*                    ],
*                    interestSum   : number,
*                    capitalSum    : number,
*                    taxSum        : number,
*                    sum           : number
 *                  }
 */
var Interest = function (singleAmount, months, interestRate, params) {
  'use strict';
  if(!singleAmount || singleAmount <= 0 ||
     !months || months <= 0 ||
     !interestRate || interestRate <= 0 ) {
    throw 'wrong parameters (' +
          [singleAmount, months, interestRate, params].join(', ') +
          ')';
  }

  // defaults
  params = typeof params === 'object' ? params : {};
  params.startAmount    = params.startAmount !== undefined ? params.startAmount : 0;
  params.tax            = params.tax !== undefined         ? params.tax         : 0;
  params.dynamicAmount  = typeof params.dynamicAmount === 'function'? params.dynamicAmount : function () { return singleAmount; };

  var payments = [],
      interestSum   = 0,
      capitalSum    = 0,
      taxSum        = 0,
      sum           = params.startAmount,
      singleInterest = interestRate / 12 / 100,

      i = 0,
      p,

      rnd = function (num) {
        return Math.round(num*100)/100;
      },

      getNextPayment = function(i) {
        var capital  = params.dynamicAmount(i),
            interest = rnd((capital + sum) * (singleInterest)),
            tax      = rnd(interest * (params.tax/100));

        return {
          capital: capital,
          interest: interest,
          tax: tax,
          capitalSum: capitalSum + capital,
          sum: rnd(sum + capital + interest - tax)
        };
      };

  for (i; i < months; i++) {
    p = getNextPayment(i);

    sum          = p.sum;
    capitalSum   = p.capitalSum;
    interestSum += p.interest;
    taxSum      += p.tax;

    payments.push(p);
  }

  return {
    payments      : payments,
    interestSum   : rnd(interestSum),
    capitalSum    : rnd(capitalSum),
    taxSum        : taxSum,
    sum           : sum
  };
};

if(typeof module === 'undefined') {
  // browser
  if(typeof INTERESTJS_NAMESPACE === 'object') {
    INTERESTJS_NAMESPACE.Interest = Interest;
  } else {
    window.Interest = Interest;
  }
} else {
  // node or browserfy
  module.exports = Interest;
}

}());

},{}],2:[function(require,module,exports){
/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
  module.exports = {
    Loan: require('./lib/loan'),
    BestLoan: require('./lib/bestLoan'),
    loanToHtmlTable: require('./lib/loanToHtmlTable'),
  };
}());


},{"./lib/bestLoan":3,"./lib/loan":4,"./lib/loanToHtmlTable":5}],3:[function(require,module,exports){
/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {

if(typeof require === 'function') {
  var Loan = require('../lib/loan.js');
  var Interest = require('interestjs');
}

/**
 * Create BestLoan Object
 * @param {number} amount
 * @param {number} maxInstallment
 * @param {number} maxInstallmentsNumber
 * @param {number} interestRate
 * @param {number} savingsInterestRate
 *
 * @return {object} {
    best: {
      diminishing: false,
      moneyToLoan: 2949.44,
      moneyToSavings: 50.56,
      instNr: 204,
      loan: LoanJsObject,
      interest: InterestJsObject,
      pointOfContact: { instNr: 146, costs: 164678.67 }
    },
    variants : [
      // all variants array
      {
        diminishing: false,
        moneyToLoan: 2949.44,
        moneyToSavings: 50.56,
        instNr: 204,
        loan: LoanJsObject,
        interest: InterestJsObject,
        pointOfContact: { instNr: 146, costs: 164678.67 }
      },
      ...
    ]
  }
 */
var BestLoan = function (amount, maxInstallment, maxInstallmentsNumber, interestRate, savingsInterestRate, params) {
  'use strict';
  if(!amount                || amount                <= 0 ||
     !maxInstallment        || maxInstallment        <= 0 ||
     !maxInstallmentsNumber || maxInstallmentsNumber <= 0 ||
     !interestRate          || interestRate          <= 0 ||
     !savingsInterestRate   || savingsInterestRate   <= 0 ) {
    throw 'wrong parameters (' +
          [amount, maxInstallment, maxInstallmentsNumber, interestRate, savingsInterestRate].join(', ') +
          ')';
  }
  // defaults
  params = typeof params === 'object' ? params : {};
  /**
   * accuracy in months - how meny iterations will be counted in a year */
  params.accuracy = params.accuracy || 12;

  var variants = [],
      instNr = maxInstallmentsNumber,
      i = 0,
      v, best,

      // round helper function
      rnd = function (num) {
        return Math.round(num*100)/100;
      },

      countVariant = function (instNr, diminishing) {
        var loan = new Loan(amount, instNr, interestRate, diminishing),
            moneyToLoan = loan.installments[0].installment,
            moneyToSavings = rnd(maxInstallment - moneyToLoan),
            pointOfContact, interest, intI, loanI,
            i = 0;

        if(diminishing) {
          params.dynamicAmount = function(i) {
            if(loan.installments[i]) {
              return rnd(maxInstallment - loan.installments[i].installment);
            }
          };
        }

        if(moneyToSavings > 0) {
          interest = new Interest(moneyToSavings, instNr, savingsInterestRate, params);

          for (i; i < instNr; i++) {
            intI = interest.payments[i];
            loanI = loan.installments[i];

            if(intI.sum >= loanI.remain) {
              // in this month interest sum is more or equal to loan remain
              // loan can be finished by putting money from saving to loan
              pointOfContact = {
                instNr: i,
                costs: rnd(loanI.interestSum)
              };
              break;
            }
          }
        }

        return {
          diminishing: !!diminishing,
          moneyToLoan: moneyToLoan,       // how mutch money go to loan installment
          moneyToSavings: moneyToSavings, // how mutch money go to savings
          instNr: instNr,
          loan: loan,
          interest: interest,
          pointOfContact: pointOfContact
        };

      };

  v = countVariant(instNr);
  while (v.pointOfContact) {
    variants.push(v);
    if(instNr > 12) {
      instNr -= params.accuracy;
      v = countVariant(instNr);
    } else {
      v = {};
    }
  }
  instNr += params.accuracy - 1;
  var acc = 1;
  v = countVariant(instNr);
  while (v.pointOfContact) {
    variants.push(v);
    instNr -= acc;
    v = countVariant(instNr);
  }

  instNr = maxInstallmentsNumber;
  v = countVariant(instNr, true);
  while (v.pointOfContact) {
    variants.push(v);
    if(instNr > 12) {
      instNr -= params.accuracy;
      v = countVariant(instNr, true);
    } else {
      v = {};
    }
  }
  instNr += params.accuracy - 1;
  v = countVariant(instNr);
  while (v.pointOfContact) {
    variants.push(v);
    instNr -= acc;
    v = countVariant(instNr, true);
  }

  for (i; i < variants.length; i++) {
    v = variants[i];
    if(!best || best.pointOfContact.costs > v.pointOfContact.costs) {
      best = v;
    }
  }

  return {
    best: best,
    variants: variants
  };

};

if(typeof module === 'undefined') {
  // browser
  if(typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.BestLoan = BestLoan;
  } else {
    if(!window.LoanJS) {
      window.LoanJS = {};
    }
    window.LoanJS.BestLoan = BestLoan;
  }
} else {
  // node or browserfy
  module.exports = BestLoan;
}

}());

},{"../lib/loan.js":4,"interestjs":1}],4:[function(require,module,exports){
/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
/**
 * Create Loan Object with all instalments and sum of interest
 * @param {number} amount                   full amount of Loan
 * @param {number} installmentsNumber       how meny installments will be
 * @param {number} interestRate             interest rate in percent (3.5)
 * @param {[bool]} diminishingInstallments  if installments will be
 *                                          diminishing (true) or
 *                                          equal/annuity (false)
 *
 * @return {object} {
 *                    amount: 1000,
 *                    capitalSum: 999.96,
 *                    interestSum: 27.09
 *                    sum: 1027.09
 *                    installments: [
 *                      {
 *                        capital: 83.33,
 *                        installment: 87.5
 *                        interest: 4.17
 *                        remain: 0
 *                      },
 *                      {...},
 *                      ...
 *                    ]
 *                  }
 */
var Loan = function (amount, installmentsNumber, interestRate, diminishing) {
  'use strict';
  if(!amount || amount <= 0 ||
     !installmentsNumber || installmentsNumber <= 0 ||
     !interestRate || interestRate <= 0 ) {
    throw 'wrong parameters (' +
          [amount, installmentsNumber, interestRate, diminishing].join(', ') +
          ')';
  }

  var installments = [],
      interestSum = 0,
      capitalSum  = 0,
      sum         = 0,

      inst,

      // round helper function
      rnd = function (num) {
        return Math.round(num*100)/100;
      },

      getNextInstalment = function() {
        var capital,
            interest,
            installment,
            irmPow,
            interestRateMonth = interestRate / 1200;

        if (diminishing) {
          capital = amount / installmentsNumber;
          interest = (amount - capitalSum) * interestRateMonth;
          installment = rnd(capital + interest);
        } else {
          irmPow = Math.pow(1 + interestRateMonth, installmentsNumber);
          installment = rnd(amount * ((interestRateMonth * irmPow) / (irmPow - 1)));
          interest = rnd((amount - capitalSum) * interestRateMonth);
          capital = installment - interest;
        }

        return {
          capital: rnd(capital),
          interest: rnd(interest),
          installment: installment,
          remain: rnd(amount - capitalSum - capital),
          interestSum: interestSum + interest
        };
      };

  for (var i = 0; i < installmentsNumber; i++) {
    inst = getNextInstalment();

    sum         += inst.installment;
    capitalSum  += inst.capital;
    interestSum += inst.interest;
    // adding lost sum on rounding
    if(i === installmentsNumber - 1) {
      capitalSum += inst.remain;
      inst.remain = 0;
    }

    installments.push(inst);
  }

  return {
    installments  : installments,
    amount        : rnd(amount),
    interestSum   : rnd(interestSum),
    capitalSum    : rnd(capitalSum),
    sum           : sum
  };
};

if(typeof module === 'undefined') {
  // browser
  if(typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.Loan = Loan;
  } else {
    if(!window.LoanJS) {
      window.LoanJS = {};
    }
    window.LoanJS.Loan = Loan;
  }
} else {
  // node or browserfy
  module.exports = Loan;
}

}());

},{}],5:[function(require,module,exports){
/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
/**
 * Create Loan Object with all instalments and sum of interest
 * @param {Loan}    loan     loan object
 * @param {object}  params   params
 *
 * @return {string}       html string with table
 */
var loanToHtmlTable = function (loan, params) {
  'use strict';
  params = params || {};
  params.formatMoney = params.formatMoney || function (num) {
    return num.toFixed(2);
  };
  var
    fm = params.formatMoney,
    trans = function (key) {
      if(params.translations && params.translations[key]) {
        return params.translations[key];
      } else {
        return key;
      }
    },
    html = [
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th></th>' +
            '<th>' + trans('Capital') + '</th>' +
            '<th>' + trans('Interest') + '</th>' +
            '<th>' + trans('Instalment') + '</th>' +
            '<th>' + trans('Remain') + '</th>' +
            '<th>' + trans('Interest sum') + '</th>' +
          '</tr>' +
        '</thead>'+
        '<tbody>',
          '',  // body content [1]
        '</tbody>' +
      '</table>'
    ];

  console.log(loan);

  for (var i = 0; i < loan.installments.length; i++) {
    var inst = loan.installments[i],
        instHtml =
          '<tr>' +
            '<td>' + (i+1) + '</td>' +
            '<td>' + fm(inst.capital) + '</td>' +
            '<td>' + fm(inst.interest) + '</td>' +
            '<td>' + fm(inst.installment) + '</td>' +
            '<td>' + fm(inst.remain) + '</td>' +
            '<td>' + fm(inst.interestSum) + '</td>' +
          '</tr>';
    html[1] += instHtml;
  }

  html[1] +=
    '<tr>' +
      '<td>' + trans('sum') + '</td>' +
      '<td>' + fm(loan.capitalSum) + '</td>' +
      '<td>' + fm(loan.interestSum) + '</td>' +
      '<td>' + fm(loan.sum) + '</td>' +
      '<td>-</td>' +
      '<td>-</td>' +
    '</tr>';

  return html.join('');
};

if(typeof module !== 'undefined') {
    module.exports = loanToHtmlTable;
}
if(typeof module === 'undefined') {
  // browser
  if(typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.loanToHtmlTable = loanToHtmlTable;
  } else {
    if(!window.LoanJS) {
      window.LoanJS = {};
    }
    window.LoanJS.loanToHtmlTable = loanToHtmlTable;
  }
} else {
  // node or browserfy
  module.exports = loanToHtmlTable;
}

}());

},{}],6:[function(require,module,exports){
/**
 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var toString = require('lodash.tostring');

/** Used to match HTML entities and HTML characters. */
var reUnescapedHtml = /[&<>"'`]/g,
    reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

/** Used to map characters to HTML entities. */
var htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/**
 * Used by `_.escape` to convert characters to HTML entities.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @returns {string} Returns the escaped character.
 */
function escapeHtmlChar(chr) {
  return htmlEscapes[chr];
}

/**
 * Converts the characters "&", "<", ">", '"', "'", and "\`" in `string` to
 * their corresponding HTML entities.
 *
 * **Note:** No other characters are escaped. To escape additional
 * characters use a third-party library like [_he_](https://mths.be/he).
 *
 * Though the ">" character is escaped for symmetry, characters like
 * ">" and "/" don't need escaping in HTML and have no special meaning
 * unless they're part of a tag or unquoted attribute value.
 * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
 * (under "semi-related fun fact") for more details.
 *
 * Backticks are escaped because in IE < 9, they can break out of
 * attribute values or HTML comments. See [#59](https://html5sec.org/#59),
 * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
 * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
 * for more details.
 *
 * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
 * to reduce XSS vectors.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escape('fred, barney, & pebbles');
 * // => 'fred, barney, &amp; pebbles'
 */
function escape(string) {
  string = toString(string);
  return (string && reHasUnescapedHtml.test(string))
    ? string.replace(reUnescapedHtml, escapeHtmlChar)
    : string;
}

module.exports = escape;

},{"lodash.tostring":7}],7:[function(require,module,exports){
(function (global){
/**
 * lodash 4.1.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect free variable `global` from Node.js. */
var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

/** Detect free variable `self`. */
var freeSelf = checkGlobal(objectTypes[typeof self] && self);

/** Detect free variable `window`. */
var freeWindow = checkGlobal(objectTypes[typeof window] && window);

/** Detect `this` as the global object. */
var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

/**
 * Used as a reference to the global object.
 *
 * The `this` value is used if it's the global object to avoid Greasemonkey's
 * restricted `window` object, otherwise the `window` object is used.
 */
var root = freeGlobal ||
  ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
    freeSelf || thisGlobal || Function('return this')();

/**
 * Checks if `value` is a global object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {null|Object} Returns `value` if it's a global object, else `null`.
 */
function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = Symbol ? symbolProto.toString : undefined;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  if (isSymbol(value)) {
    return Symbol ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toString;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],8:[function(require,module,exports){
var _ = {escape: require("lodash.escape")};
module.exports = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<td>'+
((__t=( data.id ))==null?'':__t)+
'</td>\n<td><input id="creditAmount" type="text" value="'+
((__t=( data.amount))==null?'':__t)+
'"></td>\n<td><input id="installmentsQuantity" type="text" value="'+
((__t=( data.quantity ))==null?'':__t)+
'"></td>\n<td><input id="interest" type="text" value="'+
((__t=( data.interest ))==null?'':__t)+
'"></td>\n<td><span id="equalInterestSum">'+
((__t=( data.equalInterestSum ))==null?'':__t)+
'</span></td>\n<td><span id="equalInstallmentAmount">'+
((__t=( data.equalInstallmentAmount ))==null?'':__t)+
'</span></td>\n<td><span id="diminishingInterestsSum">'+
((__t=( data.diminishingInterestsSum ))==null?'':__t)+
'</span></td>\n<td><span id="diminishingFirstInstallmentAmount">'+
((__t=( data.diminishingFirstInstallmentAmount ))==null?'':__t)+
'</span></td>\n<td><span id="diminishingLastInstallmentAmount">'+
((__t=( data.diminishingLastInstallmentAmount ))==null?'':__t)+
'</span></td>';
}
return __p;
};

},{"lodash.escape":6}],9:[function(require,module,exports){
var Row_1 = require('./Row');
var CompareList = (function () {
    function CompareList() {
        this.el = document.getElementById('mainTbody');
        this.render();
    }
    CompareList.prototype.getData = function () {
        var list = localStorage.getItem('compate');
        if (!list) {
            list = '[{ "id": 0, "amount": 100000, "quantity": 360, "interest": 3.5 }]';
        }
        try {
            list = JSON.parse(list);
        }
        catch (e) {
            list = [];
        }
        console.log(list);
        return list;
    };
    CompareList.prototype.render = function () {
        var _this = this;
        this.getData().forEach(function (el) {
            var cr = new Row_1.CompareRow(el);
            _this.el.appendChild(cr.el);
        });
    };
    return CompareList;
})();
exports.CompareList = CompareList;
;

},{"./Row":10}],10:[function(require,module,exports){
/// <reference path="../../../typings/tsd.d.ts" />
var tpl = require('../../tpl/tableRow.tpl');
var Loan = require('loanjs').Loan;
var CompareRow = (function () {
    function CompareRow(data) {
        this.data = data;
        this.render();
        this.amount = this.el.querySelector('#creditAmount');
        this.quantity = this.el.querySelector('#installmentsQuantity');
        this.interest = this.el.querySelector('#interest');
        this.amount.value;
        this.quantity.value;
        this.interest.value;
    }
    CompareRow.prototype.render = function () {
        if (!this.el) {
            this.el = document.createElement('tr');
        }
        else {
        }
        var equalLoan = new Loan(this.data.amount, this.data.quantity, this.data.interest);
        var diminishingLoan = new Loan(this.data.amount, this.data.quantity, this.data.interest, true);
        this.data.equalInterestSum = equalLoan.interestSum;
        this.data.equalInstallmentAmount = equalLoan.installments[0].installment;
        this.data.diminishingInterestsSum = diminishingLoan.interestSum;
        this.data.diminishingFirstInstallmentAmount = diminishingLoan.installments[0].installment;
        this.data.diminishingLastInstallmentAmount = diminishingLoan.installments[diminishingLoan.installments.length - 1].installment;
        this.el.innerHTML = tpl({ data: this.data });
        return this;
    };
    return CompareRow;
})();
exports.CompareRow = CompareRow;
;

},{"../../tpl/tableRow.tpl":8,"loanjs":2}],11:[function(require,module,exports){
var List_1 = require('./Compare/List');
var list = new List_1.CompareList();

},{"./Compare/List":9}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW50ZXJlc3Rqcy9saWIvaW50ZXJlc3QuanMiLCJub2RlX21vZHVsZXMvbG9hbmpzL0xvYW5KUy5qcyIsIm5vZGVfbW9kdWxlcy9sb2FuanMvbGliL2Jlc3RMb2FuLmpzIiwibm9kZV9tb2R1bGVzL2xvYW5qcy9saWIvbG9hbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2FuanMvbGliL2xvYW5Ub0h0bWxUYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2guZXNjYXBlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC50b3N0cmluZy9pbmRleC5qcyIsInNyYy90cGwvdGFibGVSb3cudHBsIiwic3JjL3RzL0NvbXBhcmUvTGlzdC50cyIsInNyYy90cy9Db21wYXJlL1Jvdy50cyIsInNyYy90cy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQSxvQkFBMkIsT0FBTyxDQUFDLENBQUE7QUFFbkM7SUFHRTtRQUNFLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELDZCQUFPLEdBQVA7UUFDRSxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNWLElBQUksR0FBRyxtRUFBbUUsQ0FBQztRQUM3RSxDQUFDO1FBQ0QsSUFBSSxDQUFDO1lBQ0gsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBRTtRQUFBLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDWCxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbEIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCw0QkFBTSxHQUFOO1FBQUEsaUJBTUM7UUFMQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQUMsRUFBRTtZQUN4QixJQUFJLEVBQUUsR0FBRyxJQUFJLGdCQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUIsS0FBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0EvQkEsQUErQkMsSUFBQTtBQS9CWSxtQkFBVyxjQStCdkIsQ0FBQTtBQUFBLENBQUM7OztBQ2pDRixrREFBa0Q7QUFDbEQsSUFBSSxHQUFHLEdBQUksT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDN0MsSUFBSSxJQUFJLEdBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUVuQztJQU1FLG9CQUFtQixJQUFJO1FBQUosU0FBSSxHQUFKLElBQUksQ0FBQTtRQUNyQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFZCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRW5ELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFBO1FBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFBO0lBQ3JCLENBQUM7SUFFRCwyQkFBTSxHQUFOO1FBQ0UsRUFBRSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNaLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7UUFFUixDQUFDO1FBRUQsSUFBSSxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuRixJQUFJLGVBQWUsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUvRixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUV6RSxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUM7UUFDaEUsSUFBSSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsR0FBRyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLGVBQWUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBRS9ILElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUUzQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0F2Q0EsQUF1Q0MsSUFBQTtBQXZDWSxrQkFBVSxhQXVDdEIsQ0FBQTtBQUFBLENBQUM7OztBQzNDRixxQkFBNEIsZ0JBQWdCLENBQUMsQ0FBQTtBQUU3QyxJQUFJLElBQUksR0FBRyxJQUFJLGtCQUFXLEVBQUUsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogSW50ZXJlc3RKU1xuICogQ2FsY3VsYXRlIGNvbXBvdW5kIGludGVyZXN0XG4gKiBodHRwczovL2dpdGh1Yi5jb20va2Zpa3UvSW50ZXJlc3RKU1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBHcnplZ29yeiBLbGltZWtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4vKipcbiAqIENyZWF0ZSBJbnRlcmVzdCBPYmplY3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgICAgICAgICAgICAgICAgICAgZnVsbCBhbW91bnQgb2YgTG9hblxuICogQHBhcmFtIHtudW1iZXJ9IGluc3RhbGxtZW50c051bWJlciAgICAgICBob3cgbWVueSBpbnN0YWxsbWVudHMgd2lsbCBiZVxuICogQHBhcmFtIHtudW1iZXJ9IGludGVyZXN0UmF0ZSAgICAgICAgICAgICBpbnRlcmVzdCByYXRlIGluIHBlcmNlbnQgKDMuNSlcbiAqIEBwYXJhbSB7W2Jvb2xdfSBkaW1pbmlzaGluZ0luc3RhbGxtZW50cyAgaWYgaW5zdGFsbG1lbnRzIHdpbGwgYmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGltaW5pc2hpbmcgKHRydWUpIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVxdWFsL2FubnVpdHkgKGZhbHNlKVxuICpcbiAqIEByZXR1cm4ge29iamVjdH0ge1xuICogICAgICAgICAgICAgICAgICAgIHBheW1lbnRzICA6IFtcbiogICAgICAgICAgICAgICAgICAgICAge1xuKiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGl0YWw6IG51bWJlcixcbiogICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmVzdDogbnVtYmVyLFxuKiAgICAgICAgICAgICAgICAgICAgICAgIHRheDogbnVtYmVyLFxuKiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGl0YWxTdW06IG51bWJlcixcbiogICAgICAgICAgICAgICAgICAgICAgICBzdW06IG51bWJlclxuKiAgICAgICAgICAgICAgICAgICAgICB9XG4qICAgICAgICAgICAgICAgICAgICBdLFxuKiAgICAgICAgICAgICAgICAgICAgaW50ZXJlc3RTdW0gICA6IG51bWJlcixcbiogICAgICAgICAgICAgICAgICAgIGNhcGl0YWxTdW0gICAgOiBudW1iZXIsXG4qICAgICAgICAgICAgICAgICAgICB0YXhTdW0gICAgICAgIDogbnVtYmVyLFxuKiAgICAgICAgICAgICAgICAgICAgc3VtICAgICAgICAgICA6IG51bWJlclxuICogICAgICAgICAgICAgICAgICB9XG4gKi9cbnZhciBJbnRlcmVzdCA9IGZ1bmN0aW9uIChzaW5nbGVBbW91bnQsIG1vbnRocywgaW50ZXJlc3RSYXRlLCBwYXJhbXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBpZighc2luZ2xlQW1vdW50IHx8IHNpbmdsZUFtb3VudCA8PSAwIHx8XG4gICAgICFtb250aHMgfHwgbW9udGhzIDw9IDAgfHxcbiAgICAgIWludGVyZXN0UmF0ZSB8fCBpbnRlcmVzdFJhdGUgPD0gMCApIHtcbiAgICB0aHJvdyAnd3JvbmcgcGFyYW1ldGVycyAoJyArXG4gICAgICAgICAgW3NpbmdsZUFtb3VudCwgbW9udGhzLCBpbnRlcmVzdFJhdGUsIHBhcmFtc10uam9pbignLCAnKSArXG4gICAgICAgICAgJyknO1xuICB9XG5cbiAgLy8gZGVmYXVsdHNcbiAgcGFyYW1zID0gdHlwZW9mIHBhcmFtcyA9PT0gJ29iamVjdCcgPyBwYXJhbXMgOiB7fTtcbiAgcGFyYW1zLnN0YXJ0QW1vdW50ICAgID0gcGFyYW1zLnN0YXJ0QW1vdW50ICE9PSB1bmRlZmluZWQgPyBwYXJhbXMuc3RhcnRBbW91bnQgOiAwO1xuICBwYXJhbXMudGF4ICAgICAgICAgICAgPSBwYXJhbXMudGF4ICE9PSB1bmRlZmluZWQgICAgICAgICA/IHBhcmFtcy50YXggICAgICAgICA6IDA7XG4gIHBhcmFtcy5keW5hbWljQW1vdW50ICA9IHR5cGVvZiBwYXJhbXMuZHluYW1pY0Ftb3VudCA9PT0gJ2Z1bmN0aW9uJz8gcGFyYW1zLmR5bmFtaWNBbW91bnQgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBzaW5nbGVBbW91bnQ7IH07XG5cbiAgdmFyIHBheW1lbnRzID0gW10sXG4gICAgICBpbnRlcmVzdFN1bSAgID0gMCxcbiAgICAgIGNhcGl0YWxTdW0gICAgPSAwLFxuICAgICAgdGF4U3VtICAgICAgICA9IDAsXG4gICAgICBzdW0gICAgICAgICAgID0gcGFyYW1zLnN0YXJ0QW1vdW50LFxuICAgICAgc2luZ2xlSW50ZXJlc3QgPSBpbnRlcmVzdFJhdGUgLyAxMiAvIDEwMCxcblxuICAgICAgaSA9IDAsXG4gICAgICBwLFxuXG4gICAgICBybmQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSoxMDApLzEwMDtcbiAgICAgIH0sXG5cbiAgICAgIGdldE5leHRQYXltZW50ID0gZnVuY3Rpb24oaSkge1xuICAgICAgICB2YXIgY2FwaXRhbCAgPSBwYXJhbXMuZHluYW1pY0Ftb3VudChpKSxcbiAgICAgICAgICAgIGludGVyZXN0ID0gcm5kKChjYXBpdGFsICsgc3VtKSAqIChzaW5nbGVJbnRlcmVzdCkpLFxuICAgICAgICAgICAgdGF4ICAgICAgPSBybmQoaW50ZXJlc3QgKiAocGFyYW1zLnRheC8xMDApKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNhcGl0YWw6IGNhcGl0YWwsXG4gICAgICAgICAgaW50ZXJlc3Q6IGludGVyZXN0LFxuICAgICAgICAgIHRheDogdGF4LFxuICAgICAgICAgIGNhcGl0YWxTdW06IGNhcGl0YWxTdW0gKyBjYXBpdGFsLFxuICAgICAgICAgIHN1bTogcm5kKHN1bSArIGNhcGl0YWwgKyBpbnRlcmVzdCAtIHRheClcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgZm9yIChpOyBpIDwgbW9udGhzOyBpKyspIHtcbiAgICBwID0gZ2V0TmV4dFBheW1lbnQoaSk7XG5cbiAgICBzdW0gICAgICAgICAgPSBwLnN1bTtcbiAgICBjYXBpdGFsU3VtICAgPSBwLmNhcGl0YWxTdW07XG4gICAgaW50ZXJlc3RTdW0gKz0gcC5pbnRlcmVzdDtcbiAgICB0YXhTdW0gICAgICArPSBwLnRheDtcblxuICAgIHBheW1lbnRzLnB1c2gocCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBheW1lbnRzICAgICAgOiBwYXltZW50cyxcbiAgICBpbnRlcmVzdFN1bSAgIDogcm5kKGludGVyZXN0U3VtKSxcbiAgICBjYXBpdGFsU3VtICAgIDogcm5kKGNhcGl0YWxTdW0pLFxuICAgIHRheFN1bSAgICAgICAgOiB0YXhTdW0sXG4gICAgc3VtICAgICAgICAgICA6IHN1bVxuICB9O1xufTtcblxuaWYodHlwZW9mIG1vZHVsZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgLy8gYnJvd3NlclxuICBpZih0eXBlb2YgSU5URVJFU1RKU19OQU1FU1BBQ0UgPT09ICdvYmplY3QnKSB7XG4gICAgSU5URVJFU1RKU19OQU1FU1BBQ0UuSW50ZXJlc3QgPSBJbnRlcmVzdDtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuSW50ZXJlc3QgPSBJbnRlcmVzdDtcbiAgfVxufSBlbHNlIHtcbiAgLy8gbm9kZSBvciBicm93c2VyZnlcbiAgbW9kdWxlLmV4cG9ydHMgPSBJbnRlcmVzdDtcbn1cblxufSgpKTtcbiIsIi8qXG4gKiBMb2FuSlNcbiAqIENhbGN1bGF0aW5nIGxvYW4gaW4gZXF1YWwgb3IgZGltaW5pc2hpbmcgaW5zdGFsbG1lbnRzXG4gKiBodHRwczovL2dpdGh1Yi5jb20va2Zpa3UvTG9hbkpTXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEdyemVnb3J6IEtsaW1la1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgTG9hbjogcmVxdWlyZSgnLi9saWIvbG9hbicpLFxuICAgIEJlc3RMb2FuOiByZXF1aXJlKCcuL2xpYi9iZXN0TG9hbicpLFxuICAgIGxvYW5Ub0h0bWxUYWJsZTogcmVxdWlyZSgnLi9saWIvbG9hblRvSHRtbFRhYmxlJyksXG4gIH07XG59KCkpO1xuXG4iLCIvKlxuICogTG9hbkpTXG4gKiBDYWxjdWxhdGluZyBsb2FuIGluIGVxdWFsIG9yIGRpbWluaXNoaW5nIGluc3RhbGxtZW50c1xuICogaHR0cHM6Ly9naXRodWIuY29tL2tmaWt1L0xvYW5KU1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBHcnplZ29yeiBLbGltZWtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbmlmKHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gIHZhciBMb2FuID0gcmVxdWlyZSgnLi4vbGliL2xvYW4uanMnKTtcbiAgdmFyIEludGVyZXN0ID0gcmVxdWlyZSgnaW50ZXJlc3RqcycpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBCZXN0TG9hbiBPYmplY3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhJbnN0YWxsbWVudFxuICogQHBhcmFtIHtudW1iZXJ9IG1heEluc3RhbGxtZW50c051bWJlclxuICogQHBhcmFtIHtudW1iZXJ9IGludGVyZXN0UmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHNhdmluZ3NJbnRlcmVzdFJhdGVcbiAqXG4gKiBAcmV0dXJuIHtvYmplY3R9IHtcbiAgICBiZXN0OiB7XG4gICAgICBkaW1pbmlzaGluZzogZmFsc2UsXG4gICAgICBtb25leVRvTG9hbjogMjk0OS40NCxcbiAgICAgIG1vbmV5VG9TYXZpbmdzOiA1MC41NixcbiAgICAgIGluc3ROcjogMjA0LFxuICAgICAgbG9hbjogTG9hbkpzT2JqZWN0LFxuICAgICAgaW50ZXJlc3Q6IEludGVyZXN0SnNPYmplY3QsXG4gICAgICBwb2ludE9mQ29udGFjdDogeyBpbnN0TnI6IDE0NiwgY29zdHM6IDE2NDY3OC42NyB9XG4gICAgfSxcbiAgICB2YXJpYW50cyA6IFtcbiAgICAgIC8vIGFsbCB2YXJpYW50cyBhcnJheVxuICAgICAge1xuICAgICAgICBkaW1pbmlzaGluZzogZmFsc2UsXG4gICAgICAgIG1vbmV5VG9Mb2FuOiAyOTQ5LjQ0LFxuICAgICAgICBtb25leVRvU2F2aW5nczogNTAuNTYsXG4gICAgICAgIGluc3ROcjogMjA0LFxuICAgICAgICBsb2FuOiBMb2FuSnNPYmplY3QsXG4gICAgICAgIGludGVyZXN0OiBJbnRlcmVzdEpzT2JqZWN0LFxuICAgICAgICBwb2ludE9mQ29udGFjdDogeyBpbnN0TnI6IDE0NiwgY29zdHM6IDE2NDY3OC42NyB9XG4gICAgICB9LFxuICAgICAgLi4uXG4gICAgXVxuICB9XG4gKi9cbnZhciBCZXN0TG9hbiA9IGZ1bmN0aW9uIChhbW91bnQsIG1heEluc3RhbGxtZW50LCBtYXhJbnN0YWxsbWVudHNOdW1iZXIsIGludGVyZXN0UmF0ZSwgc2F2aW5nc0ludGVyZXN0UmF0ZSwgcGFyYW1zKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgaWYoIWFtb3VudCAgICAgICAgICAgICAgICB8fCBhbW91bnQgICAgICAgICAgICAgICAgPD0gMCB8fFxuICAgICAhbWF4SW5zdGFsbG1lbnQgICAgICAgIHx8IG1heEluc3RhbGxtZW50ICAgICAgICA8PSAwIHx8XG4gICAgICFtYXhJbnN0YWxsbWVudHNOdW1iZXIgfHwgbWF4SW5zdGFsbG1lbnRzTnVtYmVyIDw9IDAgfHxcbiAgICAgIWludGVyZXN0UmF0ZSAgICAgICAgICB8fCBpbnRlcmVzdFJhdGUgICAgICAgICAgPD0gMCB8fFxuICAgICAhc2F2aW5nc0ludGVyZXN0UmF0ZSAgIHx8IHNhdmluZ3NJbnRlcmVzdFJhdGUgICA8PSAwICkge1xuICAgIHRocm93ICd3cm9uZyBwYXJhbWV0ZXJzICgnICtcbiAgICAgICAgICBbYW1vdW50LCBtYXhJbnN0YWxsbWVudCwgbWF4SW5zdGFsbG1lbnRzTnVtYmVyLCBpbnRlcmVzdFJhdGUsIHNhdmluZ3NJbnRlcmVzdFJhdGVdLmpvaW4oJywgJykgK1xuICAgICAgICAgICcpJztcbiAgfVxuICAvLyBkZWZhdWx0c1xuICBwYXJhbXMgPSB0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyA/IHBhcmFtcyA6IHt9O1xuICAvKipcbiAgICogYWNjdXJhY3kgaW4gbW9udGhzIC0gaG93IG1lbnkgaXRlcmF0aW9ucyB3aWxsIGJlIGNvdW50ZWQgaW4gYSB5ZWFyICovXG4gIHBhcmFtcy5hY2N1cmFjeSA9IHBhcmFtcy5hY2N1cmFjeSB8fCAxMjtcblxuICB2YXIgdmFyaWFudHMgPSBbXSxcbiAgICAgIGluc3ROciA9IG1heEluc3RhbGxtZW50c051bWJlcixcbiAgICAgIGkgPSAwLFxuICAgICAgdiwgYmVzdCxcblxuICAgICAgLy8gcm91bmQgaGVscGVyIGZ1bmN0aW9uXG4gICAgICBybmQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSoxMDApLzEwMDtcbiAgICAgIH0sXG5cbiAgICAgIGNvdW50VmFyaWFudCA9IGZ1bmN0aW9uIChpbnN0TnIsIGRpbWluaXNoaW5nKSB7XG4gICAgICAgIHZhciBsb2FuID0gbmV3IExvYW4oYW1vdW50LCBpbnN0TnIsIGludGVyZXN0UmF0ZSwgZGltaW5pc2hpbmcpLFxuICAgICAgICAgICAgbW9uZXlUb0xvYW4gPSBsb2FuLmluc3RhbGxtZW50c1swXS5pbnN0YWxsbWVudCxcbiAgICAgICAgICAgIG1vbmV5VG9TYXZpbmdzID0gcm5kKG1heEluc3RhbGxtZW50IC0gbW9uZXlUb0xvYW4pLFxuICAgICAgICAgICAgcG9pbnRPZkNvbnRhY3QsIGludGVyZXN0LCBpbnRJLCBsb2FuSSxcbiAgICAgICAgICAgIGkgPSAwO1xuXG4gICAgICAgIGlmKGRpbWluaXNoaW5nKSB7XG4gICAgICAgICAgcGFyYW1zLmR5bmFtaWNBbW91bnQgPSBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICBpZihsb2FuLmluc3RhbGxtZW50c1tpXSkge1xuICAgICAgICAgICAgICByZXR1cm4gcm5kKG1heEluc3RhbGxtZW50IC0gbG9hbi5pbnN0YWxsbWVudHNbaV0uaW5zdGFsbG1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZihtb25leVRvU2F2aW5ncyA+IDApIHtcbiAgICAgICAgICBpbnRlcmVzdCA9IG5ldyBJbnRlcmVzdChtb25leVRvU2F2aW5ncywgaW5zdE5yLCBzYXZpbmdzSW50ZXJlc3RSYXRlLCBwYXJhbXMpO1xuXG4gICAgICAgICAgZm9yIChpOyBpIDwgaW5zdE5yOyBpKyspIHtcbiAgICAgICAgICAgIGludEkgPSBpbnRlcmVzdC5wYXltZW50c1tpXTtcbiAgICAgICAgICAgIGxvYW5JID0gbG9hbi5pbnN0YWxsbWVudHNbaV07XG5cbiAgICAgICAgICAgIGlmKGludEkuc3VtID49IGxvYW5JLnJlbWFpbikge1xuICAgICAgICAgICAgICAvLyBpbiB0aGlzIG1vbnRoIGludGVyZXN0IHN1bSBpcyBtb3JlIG9yIGVxdWFsIHRvIGxvYW4gcmVtYWluXG4gICAgICAgICAgICAgIC8vIGxvYW4gY2FuIGJlIGZpbmlzaGVkIGJ5IHB1dHRpbmcgbW9uZXkgZnJvbSBzYXZpbmcgdG8gbG9hblxuICAgICAgICAgICAgICBwb2ludE9mQ29udGFjdCA9IHtcbiAgICAgICAgICAgICAgICBpbnN0TnI6IGksXG4gICAgICAgICAgICAgICAgY29zdHM6IHJuZChsb2FuSS5pbnRlcmVzdFN1bSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkaW1pbmlzaGluZzogISFkaW1pbmlzaGluZyxcbiAgICAgICAgICBtb25leVRvTG9hbjogbW9uZXlUb0xvYW4sICAgICAgIC8vIGhvdyBtdXRjaCBtb25leSBnbyB0byBsb2FuIGluc3RhbGxtZW50XG4gICAgICAgICAgbW9uZXlUb1NhdmluZ3M6IG1vbmV5VG9TYXZpbmdzLCAvLyBob3cgbXV0Y2ggbW9uZXkgZ28gdG8gc2F2aW5nc1xuICAgICAgICAgIGluc3ROcjogaW5zdE5yLFxuICAgICAgICAgIGxvYW46IGxvYW4sXG4gICAgICAgICAgaW50ZXJlc3Q6IGludGVyZXN0LFxuICAgICAgICAgIHBvaW50T2ZDb250YWN0OiBwb2ludE9mQ29udGFjdFxuICAgICAgICB9O1xuXG4gICAgICB9O1xuXG4gIHYgPSBjb3VudFZhcmlhbnQoaW5zdE5yKTtcbiAgd2hpbGUgKHYucG9pbnRPZkNvbnRhY3QpIHtcbiAgICB2YXJpYW50cy5wdXNoKHYpO1xuICAgIGlmKGluc3ROciA+IDEyKSB7XG4gICAgICBpbnN0TnIgLT0gcGFyYW1zLmFjY3VyYWN5O1xuICAgICAgdiA9IGNvdW50VmFyaWFudChpbnN0TnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ID0ge307XG4gICAgfVxuICB9XG4gIGluc3ROciArPSBwYXJhbXMuYWNjdXJhY3kgLSAxO1xuICB2YXIgYWNjID0gMTtcbiAgdiA9IGNvdW50VmFyaWFudChpbnN0TnIpO1xuICB3aGlsZSAodi5wb2ludE9mQ29udGFjdCkge1xuICAgIHZhcmlhbnRzLnB1c2godik7XG4gICAgaW5zdE5yIC09IGFjYztcbiAgICB2ID0gY291bnRWYXJpYW50KGluc3ROcik7XG4gIH1cblxuICBpbnN0TnIgPSBtYXhJbnN0YWxsbWVudHNOdW1iZXI7XG4gIHYgPSBjb3VudFZhcmlhbnQoaW5zdE5yLCB0cnVlKTtcbiAgd2hpbGUgKHYucG9pbnRPZkNvbnRhY3QpIHtcbiAgICB2YXJpYW50cy5wdXNoKHYpO1xuICAgIGlmKGluc3ROciA+IDEyKSB7XG4gICAgICBpbnN0TnIgLT0gcGFyYW1zLmFjY3VyYWN5O1xuICAgICAgdiA9IGNvdW50VmFyaWFudChpbnN0TnIsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ID0ge307XG4gICAgfVxuICB9XG4gIGluc3ROciArPSBwYXJhbXMuYWNjdXJhY3kgLSAxO1xuICB2ID0gY291bnRWYXJpYW50KGluc3ROcik7XG4gIHdoaWxlICh2LnBvaW50T2ZDb250YWN0KSB7XG4gICAgdmFyaWFudHMucHVzaCh2KTtcbiAgICBpbnN0TnIgLT0gYWNjO1xuICAgIHYgPSBjb3VudFZhcmlhbnQoaW5zdE5yLCB0cnVlKTtcbiAgfVxuXG4gIGZvciAoaTsgaSA8IHZhcmlhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdiA9IHZhcmlhbnRzW2ldO1xuICAgIGlmKCFiZXN0IHx8IGJlc3QucG9pbnRPZkNvbnRhY3QuY29zdHMgPiB2LnBvaW50T2ZDb250YWN0LmNvc3RzKSB7XG4gICAgICBiZXN0ID0gdjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGJlc3Q6IGJlc3QsXG4gICAgdmFyaWFudHM6IHZhcmlhbnRzXG4gIH07XG5cbn07XG5cbmlmKHR5cGVvZiBtb2R1bGUgPT09ICd1bmRlZmluZWQnKSB7XG4gIC8vIGJyb3dzZXJcbiAgaWYodHlwZW9mIExPQU5KU19OQU1FU1BBQ0UgPT09ICdvYmplY3QnKSB7XG4gICAgTE9BTkpTX05BTUVTUEFDRS5CZXN0TG9hbiA9IEJlc3RMb2FuO1xuICB9IGVsc2Uge1xuICAgIGlmKCF3aW5kb3cuTG9hbkpTKSB7XG4gICAgICB3aW5kb3cuTG9hbkpTID0ge307XG4gICAgfVxuICAgIHdpbmRvdy5Mb2FuSlMuQmVzdExvYW4gPSBCZXN0TG9hbjtcbiAgfVxufSBlbHNlIHtcbiAgLy8gbm9kZSBvciBicm93c2VyZnlcbiAgbW9kdWxlLmV4cG9ydHMgPSBCZXN0TG9hbjtcbn1cblxufSgpKTtcbiIsIi8qXG4gKiBMb2FuSlNcbiAqIENhbGN1bGF0aW5nIGxvYW4gaW4gZXF1YWwgb3IgZGltaW5pc2hpbmcgaW5zdGFsbG1lbnRzXG4gKiBodHRwczovL2dpdGh1Yi5jb20va2Zpa3UvTG9hbkpTXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEdyemVnb3J6IEtsaW1la1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbigpIHtcbi8qKlxuICogQ3JlYXRlIExvYW4gT2JqZWN0IHdpdGggYWxsIGluc3RhbG1lbnRzIGFuZCBzdW0gb2YgaW50ZXJlc3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgICAgICAgICAgICAgICAgICAgZnVsbCBhbW91bnQgb2YgTG9hblxuICogQHBhcmFtIHtudW1iZXJ9IGluc3RhbGxtZW50c051bWJlciAgICAgICBob3cgbWVueSBpbnN0YWxsbWVudHMgd2lsbCBiZVxuICogQHBhcmFtIHtudW1iZXJ9IGludGVyZXN0UmF0ZSAgICAgICAgICAgICBpbnRlcmVzdCByYXRlIGluIHBlcmNlbnQgKDMuNSlcbiAqIEBwYXJhbSB7W2Jvb2xdfSBkaW1pbmlzaGluZ0luc3RhbGxtZW50cyAgaWYgaW5zdGFsbG1lbnRzIHdpbGwgYmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGltaW5pc2hpbmcgKHRydWUpIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVxdWFsL2FubnVpdHkgKGZhbHNlKVxuICpcbiAqIEByZXR1cm4ge29iamVjdH0ge1xuICogICAgICAgICAgICAgICAgICAgIGFtb3VudDogMTAwMCxcbiAqICAgICAgICAgICAgICAgICAgICBjYXBpdGFsU3VtOiA5OTkuOTYsXG4gKiAgICAgICAgICAgICAgICAgICAgaW50ZXJlc3RTdW06IDI3LjA5XG4gKiAgICAgICAgICAgICAgICAgICAgc3VtOiAxMDI3LjA5XG4gKiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbG1lbnRzOiBbXG4gKiAgICAgICAgICAgICAgICAgICAgICB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGl0YWw6IDgzLjMzLFxuICogICAgICAgICAgICAgICAgICAgICAgICBpbnN0YWxsbWVudDogODcuNVxuICogICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmVzdDogNC4xN1xuICogICAgICAgICAgICAgICAgICAgICAgICByZW1haW46IDBcbiAqICAgICAgICAgICAgICAgICAgICAgIH0sXG4gKiAgICAgICAgICAgICAgICAgICAgICB7Li4ufSxcbiAqICAgICAgICAgICAgICAgICAgICAgIC4uLlxuICogICAgICAgICAgICAgICAgICAgIF1cbiAqICAgICAgICAgICAgICAgICAgfVxuICovXG52YXIgTG9hbiA9IGZ1bmN0aW9uIChhbW91bnQsIGluc3RhbGxtZW50c051bWJlciwgaW50ZXJlc3RSYXRlLCBkaW1pbmlzaGluZykge1xuICAndXNlIHN0cmljdCc7XG4gIGlmKCFhbW91bnQgfHwgYW1vdW50IDw9IDAgfHxcbiAgICAgIWluc3RhbGxtZW50c051bWJlciB8fCBpbnN0YWxsbWVudHNOdW1iZXIgPD0gMCB8fFxuICAgICAhaW50ZXJlc3RSYXRlIHx8IGludGVyZXN0UmF0ZSA8PSAwICkge1xuICAgIHRocm93ICd3cm9uZyBwYXJhbWV0ZXJzICgnICtcbiAgICAgICAgICBbYW1vdW50LCBpbnN0YWxsbWVudHNOdW1iZXIsIGludGVyZXN0UmF0ZSwgZGltaW5pc2hpbmddLmpvaW4oJywgJykgK1xuICAgICAgICAgICcpJztcbiAgfVxuXG4gIHZhciBpbnN0YWxsbWVudHMgPSBbXSxcbiAgICAgIGludGVyZXN0U3VtID0gMCxcbiAgICAgIGNhcGl0YWxTdW0gID0gMCxcbiAgICAgIHN1bSAgICAgICAgID0gMCxcblxuICAgICAgaW5zdCxcblxuICAgICAgLy8gcm91bmQgaGVscGVyIGZ1bmN0aW9uXG4gICAgICBybmQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSoxMDApLzEwMDtcbiAgICAgIH0sXG5cbiAgICAgIGdldE5leHRJbnN0YWxtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjYXBpdGFsLFxuICAgICAgICAgICAgaW50ZXJlc3QsXG4gICAgICAgICAgICBpbnN0YWxsbWVudCxcbiAgICAgICAgICAgIGlybVBvdyxcbiAgICAgICAgICAgIGludGVyZXN0UmF0ZU1vbnRoID0gaW50ZXJlc3RSYXRlIC8gMTIwMDtcblxuICAgICAgICBpZiAoZGltaW5pc2hpbmcpIHtcbiAgICAgICAgICBjYXBpdGFsID0gYW1vdW50IC8gaW5zdGFsbG1lbnRzTnVtYmVyO1xuICAgICAgICAgIGludGVyZXN0ID0gKGFtb3VudCAtIGNhcGl0YWxTdW0pICogaW50ZXJlc3RSYXRlTW9udGg7XG4gICAgICAgICAgaW5zdGFsbG1lbnQgPSBybmQoY2FwaXRhbCArIGludGVyZXN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpcm1Qb3cgPSBNYXRoLnBvdygxICsgaW50ZXJlc3RSYXRlTW9udGgsIGluc3RhbGxtZW50c051bWJlcik7XG4gICAgICAgICAgaW5zdGFsbG1lbnQgPSBybmQoYW1vdW50ICogKChpbnRlcmVzdFJhdGVNb250aCAqIGlybVBvdykgLyAoaXJtUG93IC0gMSkpKTtcbiAgICAgICAgICBpbnRlcmVzdCA9IHJuZCgoYW1vdW50IC0gY2FwaXRhbFN1bSkgKiBpbnRlcmVzdFJhdGVNb250aCk7XG4gICAgICAgICAgY2FwaXRhbCA9IGluc3RhbGxtZW50IC0gaW50ZXJlc3Q7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNhcGl0YWw6IHJuZChjYXBpdGFsKSxcbiAgICAgICAgICBpbnRlcmVzdDogcm5kKGludGVyZXN0KSxcbiAgICAgICAgICBpbnN0YWxsbWVudDogaW5zdGFsbG1lbnQsXG4gICAgICAgICAgcmVtYWluOiBybmQoYW1vdW50IC0gY2FwaXRhbFN1bSAtIGNhcGl0YWwpLFxuICAgICAgICAgIGludGVyZXN0U3VtOiBpbnRlcmVzdFN1bSArIGludGVyZXN0XG4gICAgICAgIH07XG4gICAgICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaW5zdGFsbG1lbnRzTnVtYmVyOyBpKyspIHtcbiAgICBpbnN0ID0gZ2V0TmV4dEluc3RhbG1lbnQoKTtcblxuICAgIHN1bSAgICAgICAgICs9IGluc3QuaW5zdGFsbG1lbnQ7XG4gICAgY2FwaXRhbFN1bSAgKz0gaW5zdC5jYXBpdGFsO1xuICAgIGludGVyZXN0U3VtICs9IGluc3QuaW50ZXJlc3Q7XG4gICAgLy8gYWRkaW5nIGxvc3Qgc3VtIG9uIHJvdW5kaW5nXG4gICAgaWYoaSA9PT0gaW5zdGFsbG1lbnRzTnVtYmVyIC0gMSkge1xuICAgICAgY2FwaXRhbFN1bSArPSBpbnN0LnJlbWFpbjtcbiAgICAgIGluc3QucmVtYWluID0gMDtcbiAgICB9XG5cbiAgICBpbnN0YWxsbWVudHMucHVzaChpbnN0KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5zdGFsbG1lbnRzICA6IGluc3RhbGxtZW50cyxcbiAgICBhbW91bnQgICAgICAgIDogcm5kKGFtb3VudCksXG4gICAgaW50ZXJlc3RTdW0gICA6IHJuZChpbnRlcmVzdFN1bSksXG4gICAgY2FwaXRhbFN1bSAgICA6IHJuZChjYXBpdGFsU3VtKSxcbiAgICBzdW0gICAgICAgICAgIDogc3VtXG4gIH07XG59O1xuXG5pZih0eXBlb2YgbW9kdWxlID09PSAndW5kZWZpbmVkJykge1xuICAvLyBicm93c2VyXG4gIGlmKHR5cGVvZiBMT0FOSlNfTkFNRVNQQUNFID09PSAnb2JqZWN0Jykge1xuICAgIExPQU5KU19OQU1FU1BBQ0UuTG9hbiA9IExvYW47XG4gIH0gZWxzZSB7XG4gICAgaWYoIXdpbmRvdy5Mb2FuSlMpIHtcbiAgICAgIHdpbmRvdy5Mb2FuSlMgPSB7fTtcbiAgICB9XG4gICAgd2luZG93LkxvYW5KUy5Mb2FuID0gTG9hbjtcbiAgfVxufSBlbHNlIHtcbiAgLy8gbm9kZSBvciBicm93c2VyZnlcbiAgbW9kdWxlLmV4cG9ydHMgPSBMb2FuO1xufVxuXG59KCkpO1xuIiwiLypcbiAqIExvYW5KU1xuICogQ2FsY3VsYXRpbmcgbG9hbiBpbiBlcXVhbCBvciBkaW1pbmlzaGluZyBpbnN0YWxsbWVudHNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9rZmlrdS9Mb2FuSlNcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgR3J6ZWdvcnogS2xpbWVrXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuLyoqXG4gKiBDcmVhdGUgTG9hbiBPYmplY3Qgd2l0aCBhbGwgaW5zdGFsbWVudHMgYW5kIHN1bSBvZiBpbnRlcmVzdFxuICogQHBhcmFtIHtMb2FufSAgICBsb2FuICAgICBsb2FuIG9iamVjdFxuICogQHBhcmFtIHtvYmplY3R9ICBwYXJhbXMgICBwYXJhbXNcbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgIGh0bWwgc3RyaW5nIHdpdGggdGFibGVcbiAqL1xudmFyIGxvYW5Ub0h0bWxUYWJsZSA9IGZ1bmN0aW9uIChsb2FuLCBwYXJhbXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gIHBhcmFtcy5mb3JtYXRNb25leSA9IHBhcmFtcy5mb3JtYXRNb25leSB8fCBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIG51bS50b0ZpeGVkKDIpO1xuICB9O1xuICB2YXJcbiAgICBmbSA9IHBhcmFtcy5mb3JtYXRNb25leSxcbiAgICB0cmFucyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGlmKHBhcmFtcy50cmFuc2xhdGlvbnMgJiYgcGFyYW1zLnRyYW5zbGF0aW9uc1trZXldKSB7XG4gICAgICAgIHJldHVybiBwYXJhbXMudHJhbnNsYXRpb25zW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH0sXG4gICAgaHRtbCA9IFtcbiAgICAgICc8dGFibGU+JyArXG4gICAgICAgICc8dGhlYWQ+JyArXG4gICAgICAgICAgJzx0cj4nICtcbiAgICAgICAgICAgICc8dGg+PC90aD4nICtcbiAgICAgICAgICAgICc8dGg+JyArIHRyYW5zKCdDYXBpdGFsJykgKyAnPC90aD4nICtcbiAgICAgICAgICAgICc8dGg+JyArIHRyYW5zKCdJbnRlcmVzdCcpICsgJzwvdGg+JyArXG4gICAgICAgICAgICAnPHRoPicgKyB0cmFucygnSW5zdGFsbWVudCcpICsgJzwvdGg+JyArXG4gICAgICAgICAgICAnPHRoPicgKyB0cmFucygnUmVtYWluJykgKyAnPC90aD4nICtcbiAgICAgICAgICAgICc8dGg+JyArIHRyYW5zKCdJbnRlcmVzdCBzdW0nKSArICc8L3RoPicgK1xuICAgICAgICAgICc8L3RyPicgK1xuICAgICAgICAnPC90aGVhZD4nK1xuICAgICAgICAnPHRib2R5PicsXG4gICAgICAgICAgJycsICAvLyBib2R5IGNvbnRlbnQgWzFdXG4gICAgICAgICc8L3Rib2R5PicgK1xuICAgICAgJzwvdGFibGU+J1xuICAgIF07XG5cbiAgY29uc29sZS5sb2cobG9hbik7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2FuLmluc3RhbGxtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpbnN0ID0gbG9hbi5pbnN0YWxsbWVudHNbaV0sXG4gICAgICAgIGluc3RIdG1sID1cbiAgICAgICAgICAnPHRyPicgK1xuICAgICAgICAgICAgJzx0ZD4nICsgKGkrMSkgKyAnPC90ZD4nICtcbiAgICAgICAgICAgICc8dGQ+JyArIGZtKGluc3QuY2FwaXRhbCkgKyAnPC90ZD4nICtcbiAgICAgICAgICAgICc8dGQ+JyArIGZtKGluc3QuaW50ZXJlc3QpICsgJzwvdGQ+JyArXG4gICAgICAgICAgICAnPHRkPicgKyBmbShpbnN0Lmluc3RhbGxtZW50KSArICc8L3RkPicgK1xuICAgICAgICAgICAgJzx0ZD4nICsgZm0oaW5zdC5yZW1haW4pICsgJzwvdGQ+JyArXG4gICAgICAgICAgICAnPHRkPicgKyBmbShpbnN0LmludGVyZXN0U3VtKSArICc8L3RkPicgK1xuICAgICAgICAgICc8L3RyPic7XG4gICAgaHRtbFsxXSArPSBpbnN0SHRtbDtcbiAgfVxuXG4gIGh0bWxbMV0gKz1cbiAgICAnPHRyPicgK1xuICAgICAgJzx0ZD4nICsgdHJhbnMoJ3N1bScpICsgJzwvdGQ+JyArXG4gICAgICAnPHRkPicgKyBmbShsb2FuLmNhcGl0YWxTdW0pICsgJzwvdGQ+JyArXG4gICAgICAnPHRkPicgKyBmbShsb2FuLmludGVyZXN0U3VtKSArICc8L3RkPicgK1xuICAgICAgJzx0ZD4nICsgZm0obG9hbi5zdW0pICsgJzwvdGQ+JyArXG4gICAgICAnPHRkPi08L3RkPicgK1xuICAgICAgJzx0ZD4tPC90ZD4nICtcbiAgICAnPC90cj4nO1xuXG4gIHJldHVybiBodG1sLmpvaW4oJycpO1xufTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGxvYW5Ub0h0bWxUYWJsZTtcbn1cbmlmKHR5cGVvZiBtb2R1bGUgPT09ICd1bmRlZmluZWQnKSB7XG4gIC8vIGJyb3dzZXJcbiAgaWYodHlwZW9mIExPQU5KU19OQU1FU1BBQ0UgPT09ICdvYmplY3QnKSB7XG4gICAgTE9BTkpTX05BTUVTUEFDRS5sb2FuVG9IdG1sVGFibGUgPSBsb2FuVG9IdG1sVGFibGU7XG4gIH0gZWxzZSB7XG4gICAgaWYoIXdpbmRvdy5Mb2FuSlMpIHtcbiAgICAgIHdpbmRvdy5Mb2FuSlMgPSB7fTtcbiAgICB9XG4gICAgd2luZG93LkxvYW5KUy5sb2FuVG9IdG1sVGFibGUgPSBsb2FuVG9IdG1sVGFibGU7XG4gIH1cbn0gZWxzZSB7XG4gIC8vIG5vZGUgb3IgYnJvd3NlcmZ5XG4gIG1vZHVsZS5leHBvcnRzID0gbG9hblRvSHRtbFRhYmxlO1xufVxuXG59KCkpO1xuIiwiLyoqXG4gKiBsb2Rhc2ggNC4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNiBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIHRvU3RyaW5nID0gcmVxdWlyZSgnbG9kYXNoLnRvc3RyaW5nJyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIEhUTUwgZW50aXRpZXMgYW5kIEhUTUwgY2hhcmFjdGVycy4gKi9cbnZhciByZVVuZXNjYXBlZEh0bWwgPSAvWyY8PlwiJ2BdL2csXG4gICAgcmVIYXNVbmVzY2FwZWRIdG1sID0gUmVnRXhwKHJlVW5lc2NhcGVkSHRtbC5zb3VyY2UpO1xuXG4vKiogVXNlZCB0byBtYXAgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLiAqL1xudmFyIGh0bWxFc2NhcGVzID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gIFwiJ1wiOiAnJiMzOTsnLFxuICAnYCc6ICcmIzk2Oydcbn07XG5cbi8qKlxuICogVXNlZCBieSBgXy5lc2NhcGVgIHRvIGNvbnZlcnQgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hyIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byBlc2NhcGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAqL1xuZnVuY3Rpb24gZXNjYXBlSHRtbENoYXIoY2hyKSB7XG4gIHJldHVybiBodG1sRXNjYXBlc1tjaHJdO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBjaGFyYWN0ZXJzIFwiJlwiLCBcIjxcIiwgXCI+XCIsICdcIicsIFwiJ1wiLCBhbmQgXCJcXGBcIiBpbiBgc3RyaW5nYCB0b1xuICogdGhlaXIgY29ycmVzcG9uZGluZyBIVE1MIGVudGl0aWVzLlxuICpcbiAqICoqTm90ZToqKiBObyBvdGhlciBjaGFyYWN0ZXJzIGFyZSBlc2NhcGVkLiBUbyBlc2NhcGUgYWRkaXRpb25hbFxuICogY2hhcmFjdGVycyB1c2UgYSB0aGlyZC1wYXJ0eSBsaWJyYXJ5IGxpa2UgW19oZV9dKGh0dHBzOi8vbXRocy5iZS9oZSkuXG4gKlxuICogVGhvdWdoIHRoZSBcIj5cIiBjaGFyYWN0ZXIgaXMgZXNjYXBlZCBmb3Igc3ltbWV0cnksIGNoYXJhY3RlcnMgbGlrZVxuICogXCI+XCIgYW5kIFwiL1wiIGRvbid0IG5lZWQgZXNjYXBpbmcgaW4gSFRNTCBhbmQgaGF2ZSBubyBzcGVjaWFsIG1lYW5pbmdcbiAqIHVubGVzcyB0aGV5J3JlIHBhcnQgb2YgYSB0YWcgb3IgdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlLlxuICogU2VlIFtNYXRoaWFzIEJ5bmVucydzIGFydGljbGVdKGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9hbWJpZ3VvdXMtYW1wZXJzYW5kcylcbiAqICh1bmRlciBcInNlbWktcmVsYXRlZCBmdW4gZmFjdFwiKSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEJhY2t0aWNrcyBhcmUgZXNjYXBlZCBiZWNhdXNlIGluIElFIDwgOSwgdGhleSBjYW4gYnJlYWsgb3V0IG9mXG4gKiBhdHRyaWJ1dGUgdmFsdWVzIG9yIEhUTUwgY29tbWVudHMuIFNlZSBbIzU5XShodHRwczovL2h0bWw1c2VjLm9yZy8jNTkpLFxuICogWyMxMDJdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMDIpLCBbIzEwOF0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvIzEwOCksIGFuZFxuICogWyMxMzNdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMzMpIG9mIHRoZSBbSFRNTDUgU2VjdXJpdHkgQ2hlYXRzaGVldF0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvKVxuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBXaGVuIHdvcmtpbmcgd2l0aCBIVE1MIHlvdSBzaG91bGQgYWx3YXlzIFtxdW90ZSBhdHRyaWJ1dGUgdmFsdWVzXShodHRwOi8vd29ua28uY29tL3Bvc3QvaHRtbC1lc2NhcGluZylcbiAqIHRvIHJlZHVjZSBYU1MgdmVjdG9ycy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSBzdHJpbmcgdG8gZXNjYXBlLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZXNjYXBlKCdmcmVkLCBiYXJuZXksICYgcGViYmxlcycpO1xuICogLy8gPT4gJ2ZyZWQsIGJhcm5leSwgJmFtcDsgcGViYmxlcydcbiAqL1xuZnVuY3Rpb24gZXNjYXBlKHN0cmluZykge1xuICBzdHJpbmcgPSB0b1N0cmluZyhzdHJpbmcpO1xuICByZXR1cm4gKHN0cmluZyAmJiByZUhhc1VuZXNjYXBlZEh0bWwudGVzdChzdHJpbmcpKVxuICAgID8gc3RyaW5nLnJlcGxhY2UocmVVbmVzY2FwZWRIdG1sLCBlc2NhcGVIdG1sQ2hhcilcbiAgICA6IHN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGU7XG4iLCIvKipcbiAqIGxvZGFzaCA0LjEuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgYE9iamVjdGAuICovXG52YXIgb2JqZWN0VHlwZXMgPSB7XG4gICdmdW5jdGlvbic6IHRydWUsXG4gICdvYmplY3QnOiB0cnVlXG59O1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGV4cG9ydHNgLiAqL1xudmFyIGZyZWVFeHBvcnRzID0gKG9iamVjdFR5cGVzW3R5cGVvZiBleHBvcnRzXSAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlKVxuICA/IGV4cG9ydHNcbiAgOiB1bmRlZmluZWQ7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYC4gKi9cbnZhciBmcmVlTW9kdWxlID0gKG9iamVjdFR5cGVzW3R5cGVvZiBtb2R1bGVdICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlKVxuICA/IG1vZHVsZVxuICA6IHVuZGVmaW5lZDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gY2hlY2tHbG9iYWwoZnJlZUV4cG9ydHMgJiYgZnJlZU1vZHVsZSAmJiB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCk7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgc2VsZmAuICovXG52YXIgZnJlZVNlbGYgPSBjaGVja0dsb2JhbChvYmplY3RUeXBlc1t0eXBlb2Ygc2VsZl0gJiYgc2VsZik7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgd2luZG93YC4gKi9cbnZhciBmcmVlV2luZG93ID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHdpbmRvd10gJiYgd2luZG93KTtcblxuLyoqIERldGVjdCBgdGhpc2AgYXMgdGhlIGdsb2JhbCBvYmplY3QuICovXG52YXIgdGhpc0dsb2JhbCA9IGNoZWNrR2xvYmFsKG9iamVjdFR5cGVzW3R5cGVvZiB0aGlzXSAmJiB0aGlzKTtcblxuLyoqXG4gKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICpcbiAqIFRoZSBgdGhpc2AgdmFsdWUgaXMgdXNlZCBpZiBpdCdzIHRoZSBnbG9iYWwgb2JqZWN0IHRvIGF2b2lkIEdyZWFzZW1vbmtleSdzXG4gKiByZXN0cmljdGVkIGB3aW5kb3dgIG9iamVjdCwgb3RoZXJ3aXNlIHRoZSBgd2luZG93YCBvYmplY3QgaXMgdXNlZC5cbiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8XG4gICgoZnJlZVdpbmRvdyAhPT0gKHRoaXNHbG9iYWwgJiYgdGhpc0dsb2JhbC53aW5kb3cpKSAmJiBmcmVlV2luZG93KSB8fFxuICAgIGZyZWVTZWxmIHx8IHRoaXNHbG9iYWwgfHwgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGdsb2JhbCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge251bGx8T2JqZWN0fSBSZXR1cm5zIGB2YWx1ZWAgaWYgaXQncyBhIGdsb2JhbCBvYmplY3QsIGVsc2UgYG51bGxgLlxuICovXG5mdW5jdGlvbiBjaGVja0dsb2JhbCh2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHZhbHVlLk9iamVjdCA9PT0gT2JqZWN0KSA/IHZhbHVlIDogbnVsbDtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbi8qKiBVc2VkIHRvIGNvbnZlcnQgc3ltYm9scyB0byBwcmltaXRpdmVzIGFuZCBzdHJpbmdzLiAqL1xudmFyIHN5bWJvbFByb3RvID0gU3ltYm9sID8gU3ltYm9sLnByb3RvdHlwZSA6IHVuZGVmaW5lZCxcbiAgICBzeW1ib2xUb1N0cmluZyA9IFN5bWJvbCA/IHN5bWJvbFByb3RvLnRvU3RyaW5nIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgaWYgaXQncyBub3Qgb25lLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWRcbiAqIGZvciBgbnVsbGAgYW5kIGB1bmRlZmluZWRgIHZhbHVlcy4gVGhlIHNpZ24gb2YgYC0wYCBpcyBwcmVzZXJ2ZWQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvU3RyaW5nKG51bGwpO1xuICogLy8gPT4gJydcbiAqXG4gKiBfLnRvU3RyaW5nKC0wKTtcbiAqIC8vID0+ICctMCdcbiAqXG4gKiBfLnRvU3RyaW5nKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiAnMSwyLDMnXG4gKi9cbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlKSB7XG4gIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBTeW1ib2wgPyBzeW1ib2xUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICB9XG4gIHZhciByZXN1bHQgPSAodmFsdWUgKyAnJyk7XG4gIHJldHVybiAocmVzdWx0ID09ICcwJyAmJiAoMSAvIHZhbHVlKSA9PSAtSU5GSU5JVFkpID8gJy0wJyA6IHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1N0cmluZztcbiIsInZhciBfID0ge2VzY2FwZTogcmVxdWlyZShcImxvZGFzaC5lc2NhcGVcIil9O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmope1xudmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLHByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XG53aXRoKG9ianx8e30pe1xuX19wKz0nPHRkPicrXG4oKF9fdD0oIGRhdGEuaWQgKSk9PW51bGw/Jyc6X190KStcbic8L3RkPlxcbjx0ZD48aW5wdXQgaWQ9XCJjcmVkaXRBbW91bnRcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJytcbigoX190PSggZGF0YS5hbW91bnQpKT09bnVsbD8nJzpfX3QpK1xuJ1wiPjwvdGQ+XFxuPHRkPjxpbnB1dCBpZD1cImluc3RhbGxtZW50c1F1YW50aXR5XCIgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicrXG4oKF9fdD0oIGRhdGEucXVhbnRpdHkgKSk9PW51bGw/Jyc6X190KStcbidcIj48L3RkPlxcbjx0ZD48aW5wdXQgaWQ9XCJpbnRlcmVzdFwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInK1xuKChfX3Q9KCBkYXRhLmludGVyZXN0ICkpPT1udWxsPycnOl9fdCkrXG4nXCI+PC90ZD5cXG48dGQ+PHNwYW4gaWQ9XCJlcXVhbEludGVyZXN0U3VtXCI+JytcbigoX190PSggZGF0YS5lcXVhbEludGVyZXN0U3VtICkpPT1udWxsPycnOl9fdCkrXG4nPC9zcGFuPjwvdGQ+XFxuPHRkPjxzcGFuIGlkPVwiZXF1YWxJbnN0YWxsbWVudEFtb3VudFwiPicrXG4oKF9fdD0oIGRhdGEuZXF1YWxJbnN0YWxsbWVudEFtb3VudCApKT09bnVsbD8nJzpfX3QpK1xuJzwvc3Bhbj48L3RkPlxcbjx0ZD48c3BhbiBpZD1cImRpbWluaXNoaW5nSW50ZXJlc3RzU3VtXCI+JytcbigoX190PSggZGF0YS5kaW1pbmlzaGluZ0ludGVyZXN0c1N1bSApKT09bnVsbD8nJzpfX3QpK1xuJzwvc3Bhbj48L3RkPlxcbjx0ZD48c3BhbiBpZD1cImRpbWluaXNoaW5nRmlyc3RJbnN0YWxsbWVudEFtb3VudFwiPicrXG4oKF9fdD0oIGRhdGEuZGltaW5pc2hpbmdGaXJzdEluc3RhbGxtZW50QW1vdW50ICkpPT1udWxsPycnOl9fdCkrXG4nPC9zcGFuPjwvdGQ+XFxuPHRkPjxzcGFuIGlkPVwiZGltaW5pc2hpbmdMYXN0SW5zdGFsbG1lbnRBbW91bnRcIj4nK1xuKChfX3Q9KCBkYXRhLmRpbWluaXNoaW5nTGFzdEluc3RhbGxtZW50QW1vdW50ICkpPT1udWxsPycnOl9fdCkrXG4nPC9zcGFuPjwvdGQ+Jztcbn1cbnJldHVybiBfX3A7XG59O1xuIiwiaW1wb3J0IHsgQ29tcGFyZVJvdyB9IGZyb20gJy4vUm93JztcblxuZXhwb3J0IGNsYXNzIENvbXBhcmVMaXN0IHtcbiAgZWw7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluVGJvZHknKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgZ2V0RGF0YSgpIHtcbiAgICBsZXQgbGlzdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjb21wYXRlJyk7XG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICBsaXN0ID0gJ1t7IFwiaWRcIjogMCwgXCJhbW91bnRcIjogMTAwMDAwLCBcInF1YW50aXR5XCI6IDM2MCwgXCJpbnRlcmVzdFwiOiAzLjUgfV0nO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgbGlzdCA9IEpTT04ucGFyc2UobGlzdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGlzdCA9IFtdO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGxpc3QpO1xuXG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5nZXREYXRhKCkuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgIGxldCBjciA9IG5ldyBDb21wYXJlUm93KGVsKTtcbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQoY3IuZWwpO1xuICAgIH0pXG5cbiAgfVxufTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL3RzZC5kLnRzXCIgLz5cbmxldCB0cGwgPSAgcmVxdWlyZSgnLi4vLi4vdHBsL3RhYmxlUm93LnRwbCcpO1xubGV0IExvYW4gPSAgcmVxdWlyZSgnbG9hbmpzJykuTG9hbjtcblxuZXhwb3J0IGNsYXNzIENvbXBhcmVSb3cge1xuICBlbDtcbiAgYW1vdW50O1xuICBxdWFudGl0eTtcbiAgaW50ZXJlc3Q7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGRhdGEpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgdGhpcy5hbW91bnQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJyNjcmVkaXRBbW91bnQnKTtcbiAgICB0aGlzLnF1YW50aXR5ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcjaW5zdGFsbG1lbnRzUXVhbnRpdHknKTtcbiAgICB0aGlzLmludGVyZXN0ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcjaW50ZXJlc3QnKTtcblxuICAgIHRoaXMuYW1vdW50LnZhbHVlXG4gICAgdGhpcy5xdWFudGl0eS52YWx1ZVxuICAgIHRoaXMuaW50ZXJlc3QudmFsdWVcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBpZighdGhpcy5lbCkge1xuICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG4gICAgfSBlbHNlIHtcblxuICAgIH1cblxuICAgIGxldCBlcXVhbExvYW4gPSBuZXcgTG9hbih0aGlzLmRhdGEuYW1vdW50LCB0aGlzLmRhdGEucXVhbnRpdHksIHRoaXMuZGF0YS5pbnRlcmVzdCk7XG4gICAgbGV0IGRpbWluaXNoaW5nTG9hbiA9IG5ldyBMb2FuKHRoaXMuZGF0YS5hbW91bnQsIHRoaXMuZGF0YS5xdWFudGl0eSwgdGhpcy5kYXRhLmludGVyZXN0LCB0cnVlKTtcblxuICAgIHRoaXMuZGF0YS5lcXVhbEludGVyZXN0U3VtID0gZXF1YWxMb2FuLmludGVyZXN0U3VtO1xuICAgIHRoaXMuZGF0YS5lcXVhbEluc3RhbGxtZW50QW1vdW50ID0gZXF1YWxMb2FuLmluc3RhbGxtZW50c1swXS5pbnN0YWxsbWVudDtcblxuICAgIHRoaXMuZGF0YS5kaW1pbmlzaGluZ0ludGVyZXN0c1N1bSA9IGRpbWluaXNoaW5nTG9hbi5pbnRlcmVzdFN1bTtcbiAgICB0aGlzLmRhdGEuZGltaW5pc2hpbmdGaXJzdEluc3RhbGxtZW50QW1vdW50ID0gZGltaW5pc2hpbmdMb2FuLmluc3RhbGxtZW50c1swXS5pbnN0YWxsbWVudDtcbiAgICB0aGlzLmRhdGEuZGltaW5pc2hpbmdMYXN0SW5zdGFsbG1lbnRBbW91bnQgPSBkaW1pbmlzaGluZ0xvYW4uaW5zdGFsbG1lbnRzW2RpbWluaXNoaW5nTG9hbi5pbnN0YWxsbWVudHMubGVuZ3RoIC0gMV0uaW5zdGFsbG1lbnQ7XG5cbiAgICB0aGlzLmVsLmlubmVySFRNTCA9IHRwbCh7ZGF0YTogdGhpcy5kYXRhfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsImltcG9ydCB7IENvbXBhcmVMaXN0IH0gZnJvbSAnLi9Db21wYXJlL0xpc3QnO1xuXG5sZXQgbGlzdCA9IG5ldyBDb21wYXJlTGlzdCgpO1xuIl19
