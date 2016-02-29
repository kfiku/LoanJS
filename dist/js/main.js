(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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


},{"./lib/bestLoan":4,"./lib/loan":5,"./lib/loanToHtmlTable":6}],4:[function(require,module,exports){
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

},{"../lib/loan.js":5,"interestjs":2}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"lodash.tostring":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var _ = {escape: require("lodash.escape")};
module.exports = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<td>'+
((__t=( data.id ))==null?'':__t)+
'</td>\n  <td><input class="amount" type="text" value="'+
((__t=( data.amount))==null?'':__t)+
'"></td>\n  <td><input class="quantity" type="text" value="'+
((__t=( data.quantity ))==null?'':__t)+
'"></td>\n  <td><input class="interest" type="text" value="'+
((__t=( data.interest ))==null?'':__t)+
'"></td>\n  <td><span class="equalInterestSum">'+
((__t=( data.equalInterestSum ))==null?'':__t)+
'</span></td>\n  <td><span class="equalInstallmentAmount">'+
((__t=( data.equalInstallmentAmount ))==null?'':__t)+
'</span></td>\n  <td><span class="diminishingInterestsSum">'+
((__t=( data.diminishingInterestsSum ))==null?'':__t)+
'</span></td>\n  <td><span class="diminishingFirstInstallmentAmount">'+
((__t=( data.diminishingFirstInstallmentAmount ))==null?'':__t)+
'</span></td>\n  <td><span class="diminishingLastInstallmentAmount">'+
((__t=( data.diminishingLastInstallmentAmount ))==null?'':__t)+
'</span></td>\n  <td><button class="remove">X</button></td>';
}
return __p;
};

},{"lodash.escape":7}],10:[function(require,module,exports){
var Row_1 = require('./Row');
var CompareList = (function () {
    function CompareList() {
        var _this = this;
        this.rows = [];
        this.el = document.querySelector('#mainTbody');
        this.addNewBtn = document.querySelector('#addCompareRow');
        this.addNewBtn.addEventListener('click', function () { return _this.addNewRow(); });
        this.render();
    }
    CompareList.prototype.getData = function () {
        var list = localStorage.getItem('compate');
        if (!list) {
            list = '[{}]';
        }
        try {
            list = JSON.parse(list);
        }
        catch (e) {
            list = [];
        }
        return list;
    };
    CompareList.prototype.render = function () {
        var _this = this;
        this.getData().forEach(function (el) { return _this.addNewRow(el); });
    };
    CompareList.prototype.addNewRow = function (el) {
        var _this = this;
        if (el === void 0) { el = { amount: 100000, quantity: 360, interest: 3.5 }; }
        el.id = this.rows.length;
        var cr = new Row_1.CompareRow(el);
        this.rows.push(cr);
        this.el.appendChild(cr.el);
        cr.on('change', function () { return _this.save(); });
        cr.on('remove', function () { return _this.onRowRemove(cr); });
        this.save();
    };
    CompareList.prototype.save = function () {
        var list = [];
        this.rows.forEach(function (row) {
            list.push({
                id: row.data.id,
                amount: row.data.amount,
                quantity: row.data.quantity,
                interest: row.data.interest
            });
        });
        localStorage.setItem('compate', JSON.stringify(list));
    };
    CompareList.prototype.onRowRemove = function (cr) {
        this.rows.splice(cr.data.id, 1);
        this.save();
    };
    return CompareList;
})();
exports.CompareList = CompareList;
;

},{"./Row":11}],11:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../../typings/tsd.d.ts" />
var events_1 = require('events');
var tpl = require('../../tpl/tableRow.tpl');
var Loan = require('loanjs').Loan;
var CompareRow = (function (_super) {
    __extends(CompareRow, _super);
    function CompareRow(data) {
        _super.call(this);
        this.data = data;
        this.render();
    }
    CompareRow.prototype.render = function () {
        var _this = this;
        if (!this.el) {
            this.el = document.createElement('tr');
            this.el.innerHTML = tpl({ data: this.data });
            this.amount = this.el.querySelector('.amount');
            this.quantity = this.el.querySelector('.quantity');
            this.interest = this.el.querySelector('.interest');
            this.listenField(this.amount);
            this.listenField(this.quantity);
            this.listenField(this.interest);
            this.equalInterestSum = this.el.querySelector('.equalInterestSum');
            this.equalInstallmentAmount = this.el.querySelector('.equalInstallmentAmount');
            this.diminishingInterestsSum = this.el.querySelector('.diminishingInterestsSum');
            this.diminishingFirstInstallmentAmount = this.el.querySelector('.diminishingFirstInstallmentAmount');
            this.diminishingLastInstallmentAmount = this.el.querySelector('.diminishingLastInstallmentAmount');
            this.removeBtn = this.el.querySelector('.remove');
            this.removeBtn.addEventListener('click', function () { return _this.onRemove(); });
        }
        // counting loan
        this.data.equalLoan = new Loan(this.data.amount, this.data.quantity, this.data.interest);
        this.data.diminishingLoan = new Loan(this.data.amount, this.data.quantity, this.data.interest, true);
        this.data.equalInterestSum = this.data.equalLoan.interestSum;
        this.data.equalInstallmentAmount = this.data.equalLoan.installments[0].installment;
        this.data.diminishingInterestsSum = this.data.equalLoan.interestSum;
        this.data.diminishingFirstInstallmentAmount = this.data.equalLoan.installments[0].installment;
        this.data.diminishingLastInstallmentAmount = this.data.equalLoan.installments[this.data.diminishingLoan.installments.length - 1].installment;
        // Setting InnerHTML of elements
        this.equalInterestSum.innerHTML = this.data.equalInterestSum;
        this.equalInstallmentAmount.innerHTML = this.data.equalInstallmentAmount;
        this.diminishingInterestsSum.innerHTML = this.data.diminishingInterestsSum;
        this.diminishingFirstInstallmentAmount.innerHTML = this.data.diminishingFirstInstallmentAmount;
        this.diminishingLastInstallmentAmount.innerHTML = this.data.diminishingLastInstallmentAmount;
        return this;
    };
    CompareRow.prototype.listenField = function (field) {
        var _this = this;
        field.addEventListener('keyup', function (e) { return _this.onFieldChange(e); });
        field.addEventListener('change', function (e) { return _this.onFieldChange(e); });
    };
    CompareRow.prototype.onFieldChange = function (e) {
        // console.log(e.keyCode);
        // KEYBOARD EVENT  NUMPAD                                   NUMB ERS                               BACKSPACE
        if (e.keyCode && !((e.keyCode >= 96 && e.keyCode <= 105) || (e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode === 8)) {
            return;
        }
        e.target.value = this.data[e.target.className] = parseFloat(e.target.value.replace(',', '.')) || 0;
        this.render();
        this.emit('change');
    };
    CompareRow.prototype.onRemove = function () {
        this.el.parentNode.removeChild(this.el);
        this.emit('remove');
    };
    return CompareRow;
})(events_1.EventEmitter);
exports.CompareRow = CompareRow;
;

},{"../../tpl/tableRow.tpl":9,"events":1,"loanjs":3}],12:[function(require,module,exports){
var List_1 = require('./Compare/List');
var list = new List_1.CompareList();

},{"./Compare/List":10}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9pbnRlcmVzdGpzL2xpYi9pbnRlcmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2FuanMvTG9hbkpTLmpzIiwibm9kZV9tb2R1bGVzL2xvYW5qcy9saWIvYmVzdExvYW4uanMiLCJub2RlX21vZHVsZXMvbG9hbmpzL2xpYi9sb2FuLmpzIiwibm9kZV9tb2R1bGVzL2xvYW5qcy9saWIvbG9hblRvSHRtbFRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC5lc2NhcGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoLnRvc3RyaW5nL2luZGV4LmpzIiwic3JjL3RwbC90YWJsZVJvdy50cGwiLCJzcmMvdHMvQ29tcGFyZS9MaXN0LnRzIiwic3JjL3RzL0NvbXBhcmUvUm93LnRzIiwic3JjL3RzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0EzRkEsQUEyRkMsRUEzRitCLHFCQUFZLEVBMkYzQztBQTNGWSxrQkFBVSxhQTJGdEIsQ0FBQTtBQUFBLENBQUM7OztBQ2hHRixxQkFBNEIsZ0JBQWdCLENBQUMsQ0FBQTtBQUU3QyxJQUFJLElBQUksR0FBRyxJQUFJLGtCQUFXLEVBQUUsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKlxuICogSW50ZXJlc3RKU1xuICogQ2FsY3VsYXRlIGNvbXBvdW5kIGludGVyZXN0XG4gKiBodHRwczovL2dpdGh1Yi5jb20va2Zpa3UvSW50ZXJlc3RKU1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBHcnplZ29yeiBLbGltZWtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4vKipcbiAqIENyZWF0ZSBJbnRlcmVzdCBPYmplY3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgICAgICAgICAgICAgICAgICAgZnVsbCBhbW91bnQgb2YgTG9hblxuICogQHBhcmFtIHtudW1iZXJ9IGluc3RhbGxtZW50c051bWJlciAgICAgICBob3cgbWVueSBpbnN0YWxsbWVudHMgd2lsbCBiZVxuICogQHBhcmFtIHtudW1iZXJ9IGludGVyZXN0UmF0ZSAgICAgICAgICAgICBpbnRlcmVzdCByYXRlIGluIHBlcmNlbnQgKDMuNSlcbiAqIEBwYXJhbSB7W2Jvb2xdfSBkaW1pbmlzaGluZ0luc3RhbGxtZW50cyAgaWYgaW5zdGFsbG1lbnRzIHdpbGwgYmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGltaW5pc2hpbmcgKHRydWUpIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVxdWFsL2FubnVpdHkgKGZhbHNlKVxuICpcbiAqIEByZXR1cm4ge29iamVjdH0ge1xuICogICAgICAgICAgICAgICAgICAgIHBheW1lbnRzICA6IFtcbiogICAgICAgICAgICAgICAgICAgICAge1xuKiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGl0YWw6IG51bWJlcixcbiogICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmVzdDogbnVtYmVyLFxuKiAgICAgICAgICAgICAgICAgICAgICAgIHRheDogbnVtYmVyLFxuKiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGl0YWxTdW06IG51bWJlcixcbiogICAgICAgICAgICAgICAgICAgICAgICBzdW06IG51bWJlclxuKiAgICAgICAgICAgICAgICAgICAgICB9XG4qICAgICAgICAgICAgICAgICAgICBdLFxuKiAgICAgICAgICAgICAgICAgICAgaW50ZXJlc3RTdW0gICA6IG51bWJlcixcbiogICAgICAgICAgICAgICAgICAgIGNhcGl0YWxTdW0gICAgOiBudW1iZXIsXG4qICAgICAgICAgICAgICAgICAgICB0YXhTdW0gICAgICAgIDogbnVtYmVyLFxuKiAgICAgICAgICAgICAgICAgICAgc3VtICAgICAgICAgICA6IG51bWJlclxuICogICAgICAgICAgICAgICAgICB9XG4gKi9cbnZhciBJbnRlcmVzdCA9IGZ1bmN0aW9uIChzaW5nbGVBbW91bnQsIG1vbnRocywgaW50ZXJlc3RSYXRlLCBwYXJhbXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBpZighc2luZ2xlQW1vdW50IHx8IHNpbmdsZUFtb3VudCA8PSAwIHx8XG4gICAgICFtb250aHMgfHwgbW9udGhzIDw9IDAgfHxcbiAgICAgIWludGVyZXN0UmF0ZSB8fCBpbnRlcmVzdFJhdGUgPD0gMCApIHtcbiAgICB0aHJvdyAnd3JvbmcgcGFyYW1ldGVycyAoJyArXG4gICAgICAgICAgW3NpbmdsZUFtb3VudCwgbW9udGhzLCBpbnRlcmVzdFJhdGUsIHBhcmFtc10uam9pbignLCAnKSArXG4gICAgICAgICAgJyknO1xuICB9XG5cbiAgLy8gZGVmYXVsdHNcbiAgcGFyYW1zID0gdHlwZW9mIHBhcmFtcyA9PT0gJ29iamVjdCcgPyBwYXJhbXMgOiB7fTtcbiAgcGFyYW1zLnN0YXJ0QW1vdW50ICAgID0gcGFyYW1zLnN0YXJ0QW1vdW50ICE9PSB1bmRlZmluZWQgPyBwYXJhbXMuc3RhcnRBbW91bnQgOiAwO1xuICBwYXJhbXMudGF4ICAgICAgICAgICAgPSBwYXJhbXMudGF4ICE9PSB1bmRlZmluZWQgICAgICAgICA/IHBhcmFtcy50YXggICAgICAgICA6IDA7XG4gIHBhcmFtcy5keW5hbWljQW1vdW50ICA9IHR5cGVvZiBwYXJhbXMuZHluYW1pY0Ftb3VudCA9PT0gJ2Z1bmN0aW9uJz8gcGFyYW1zLmR5bmFtaWNBbW91bnQgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBzaW5nbGVBbW91bnQ7IH07XG5cbiAgdmFyIHBheW1lbnRzID0gW10sXG4gICAgICBpbnRlcmVzdFN1bSAgID0gMCxcbiAgICAgIGNhcGl0YWxTdW0gICAgPSAwLFxuICAgICAgdGF4U3VtICAgICAgICA9IDAsXG4gICAgICBzdW0gICAgICAgICAgID0gcGFyYW1zLnN0YXJ0QW1vdW50LFxuICAgICAgc2luZ2xlSW50ZXJlc3QgPSBpbnRlcmVzdFJhdGUgLyAxMiAvIDEwMCxcblxuICAgICAgaSA9IDAsXG4gICAgICBwLFxuXG4gICAgICBybmQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSoxMDApLzEwMDtcbiAgICAgIH0sXG5cbiAgICAgIGdldE5leHRQYXltZW50ID0gZnVuY3Rpb24oaSkge1xuICAgICAgICB2YXIgY2FwaXRhbCAgPSBwYXJhbXMuZHluYW1pY0Ftb3VudChpKSxcbiAgICAgICAgICAgIGludGVyZXN0ID0gcm5kKChjYXBpdGFsICsgc3VtKSAqIChzaW5nbGVJbnRlcmVzdCkpLFxuICAgICAgICAgICAgdGF4ICAgICAgPSBybmQoaW50ZXJlc3QgKiAocGFyYW1zLnRheC8xMDApKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNhcGl0YWw6IGNhcGl0YWwsXG4gICAgICAgICAgaW50ZXJlc3Q6IGludGVyZXN0LFxuICAgICAgICAgIHRheDogdGF4LFxuICAgICAgICAgIGNhcGl0YWxTdW06IGNhcGl0YWxTdW0gKyBjYXBpdGFsLFxuICAgICAgICAgIHN1bTogcm5kKHN1bSArIGNhcGl0YWwgKyBpbnRlcmVzdCAtIHRheClcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgZm9yIChpOyBpIDwgbW9udGhzOyBpKyspIHtcbiAgICBwID0gZ2V0TmV4dFBheW1lbnQoaSk7XG5cbiAgICBzdW0gICAgICAgICAgPSBwLnN1bTtcbiAgICBjYXBpdGFsU3VtICAgPSBwLmNhcGl0YWxTdW07XG4gICAgaW50ZXJlc3RTdW0gKz0gcC5pbnRlcmVzdDtcbiAgICB0YXhTdW0gICAgICArPSBwLnRheDtcblxuICAgIHBheW1lbnRzLnB1c2gocCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBheW1lbnRzICAgICAgOiBwYXltZW50cyxcbiAgICBpbnRlcmVzdFN1bSAgIDogcm5kKGludGVyZXN0U3VtKSxcbiAgICBjYXBpdGFsU3VtICAgIDogcm5kKGNhcGl0YWxTdW0pLFxuICAgIHRheFN1bSAgICAgICAgOiB0YXhTdW0sXG4gICAgc3VtICAgICAgICAgICA6IHN1bVxuICB9O1xufTtcblxuaWYodHlwZW9mIG1vZHVsZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgLy8gYnJvd3NlclxuICBpZih0eXBlb2YgSU5URVJFU1RKU19OQU1FU1BBQ0UgPT09ICdvYmplY3QnKSB7XG4gICAgSU5URVJFU1RKU19OQU1FU1BBQ0UuSW50ZXJlc3QgPSBJbnRlcmVzdDtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuSW50ZXJlc3QgPSBJbnRlcmVzdDtcbiAgfVxufSBlbHNlIHtcbiAgLy8gbm9kZSBvciBicm93c2VyZnlcbiAgbW9kdWxlLmV4cG9ydHMgPSBJbnRlcmVzdDtcbn1cblxufSgpKTtcbiIsIi8qXG4gKiBMb2FuSlNcbiAqIENhbGN1bGF0aW5nIGxvYW4gaW4gZXF1YWwgb3IgZGltaW5pc2hpbmcgaW5zdGFsbG1lbnRzXG4gKiBodHRwczovL2dpdGh1Yi5jb20va2Zpa3UvTG9hbkpTXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEdyemVnb3J6IEtsaW1la1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgTG9hbjogcmVxdWlyZSgnLi9saWIvbG9hbicpLFxuICAgIEJlc3RMb2FuOiByZXF1aXJlKCcuL2xpYi9iZXN0TG9hbicpLFxuICAgIGxvYW5Ub0h0bWxUYWJsZTogcmVxdWlyZSgnLi9saWIvbG9hblRvSHRtbFRhYmxlJyksXG4gIH07XG59KCkpO1xuXG4iLCIvKlxuICogTG9hbkpTXG4gKiBDYWxjdWxhdGluZyBsb2FuIGluIGVxdWFsIG9yIGRpbWluaXNoaW5nIGluc3RhbGxtZW50c1xuICogaHR0cHM6Ly9naXRodWIuY29tL2tmaWt1L0xvYW5KU1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBHcnplZ29yeiBLbGltZWtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbmlmKHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gIHZhciBMb2FuID0gcmVxdWlyZSgnLi4vbGliL2xvYW4uanMnKTtcbiAgdmFyIEludGVyZXN0ID0gcmVxdWlyZSgnaW50ZXJlc3RqcycpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBCZXN0TG9hbiBPYmplY3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhJbnN0YWxsbWVudFxuICogQHBhcmFtIHtudW1iZXJ9IG1heEluc3RhbGxtZW50c051bWJlclxuICogQHBhcmFtIHtudW1iZXJ9IGludGVyZXN0UmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHNhdmluZ3NJbnRlcmVzdFJhdGVcbiAqXG4gKiBAcmV0dXJuIHtvYmplY3R9IHtcbiAgICBiZXN0OiB7XG4gICAgICBkaW1pbmlzaGluZzogZmFsc2UsXG4gICAgICBtb25leVRvTG9hbjogMjk0OS40NCxcbiAgICAgIG1vbmV5VG9TYXZpbmdzOiA1MC41NixcbiAgICAgIGluc3ROcjogMjA0LFxuICAgICAgbG9hbjogTG9hbkpzT2JqZWN0LFxuICAgICAgaW50ZXJlc3Q6IEludGVyZXN0SnNPYmplY3QsXG4gICAgICBwb2ludE9mQ29udGFjdDogeyBpbnN0TnI6IDE0NiwgY29zdHM6IDE2NDY3OC42NyB9XG4gICAgfSxcbiAgICB2YXJpYW50cyA6IFtcbiAgICAgIC8vIGFsbCB2YXJpYW50cyBhcnJheVxuICAgICAge1xuICAgICAgICBkaW1pbmlzaGluZzogZmFsc2UsXG4gICAgICAgIG1vbmV5VG9Mb2FuOiAyOTQ5LjQ0LFxuICAgICAgICBtb25leVRvU2F2aW5nczogNTAuNTYsXG4gICAgICAgIGluc3ROcjogMjA0LFxuICAgICAgICBsb2FuOiBMb2FuSnNPYmplY3QsXG4gICAgICAgIGludGVyZXN0OiBJbnRlcmVzdEpzT2JqZWN0LFxuICAgICAgICBwb2ludE9mQ29udGFjdDogeyBpbnN0TnI6IDE0NiwgY29zdHM6IDE2NDY3OC42NyB9XG4gICAgICB9LFxuICAgICAgLi4uXG4gICAgXVxuICB9XG4gKi9cbnZhciBCZXN0TG9hbiA9IGZ1bmN0aW9uIChhbW91bnQsIG1heEluc3RhbGxtZW50LCBtYXhJbnN0YWxsbWVudHNOdW1iZXIsIGludGVyZXN0UmF0ZSwgc2F2aW5nc0ludGVyZXN0UmF0ZSwgcGFyYW1zKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgaWYoIWFtb3VudCAgICAgICAgICAgICAgICB8fCBhbW91bnQgICAgICAgICAgICAgICAgPD0gMCB8fFxuICAgICAhbWF4SW5zdGFsbG1lbnQgICAgICAgIHx8IG1heEluc3RhbGxtZW50ICAgICAgICA8PSAwIHx8XG4gICAgICFtYXhJbnN0YWxsbWVudHNOdW1iZXIgfHwgbWF4SW5zdGFsbG1lbnRzTnVtYmVyIDw9IDAgfHxcbiAgICAgIWludGVyZXN0UmF0ZSAgICAgICAgICB8fCBpbnRlcmVzdFJhdGUgICAgICAgICAgPD0gMCB8fFxuICAgICAhc2F2aW5nc0ludGVyZXN0UmF0ZSAgIHx8IHNhdmluZ3NJbnRlcmVzdFJhdGUgICA8PSAwICkge1xuICAgIHRocm93ICd3cm9uZyBwYXJhbWV0ZXJzICgnICtcbiAgICAgICAgICBbYW1vdW50LCBtYXhJbnN0YWxsbWVudCwgbWF4SW5zdGFsbG1lbnRzTnVtYmVyLCBpbnRlcmVzdFJhdGUsIHNhdmluZ3NJbnRlcmVzdFJhdGVdLmpvaW4oJywgJykgK1xuICAgICAgICAgICcpJztcbiAgfVxuICAvLyBkZWZhdWx0c1xuICBwYXJhbXMgPSB0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyA/IHBhcmFtcyA6IHt9O1xuICAvKipcbiAgICogYWNjdXJhY3kgaW4gbW9udGhzIC0gaG93IG1lbnkgaXRlcmF0aW9ucyB3aWxsIGJlIGNvdW50ZWQgaW4gYSB5ZWFyICovXG4gIHBhcmFtcy5hY2N1cmFjeSA9IHBhcmFtcy5hY2N1cmFjeSB8fCAxMjtcblxuICB2YXIgdmFyaWFudHMgPSBbXSxcbiAgICAgIGluc3ROciA9IG1heEluc3RhbGxtZW50c051bWJlcixcbiAgICAgIGkgPSAwLFxuICAgICAgdiwgYmVzdCxcblxuICAgICAgLy8gcm91bmQgaGVscGVyIGZ1bmN0aW9uXG4gICAgICBybmQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSoxMDApLzEwMDtcbiAgICAgIH0sXG5cbiAgICAgIGNvdW50VmFyaWFudCA9IGZ1bmN0aW9uIChpbnN0TnIsIGRpbWluaXNoaW5nKSB7XG4gICAgICAgIHZhciBsb2FuID0gbmV3IExvYW4oYW1vdW50LCBpbnN0TnIsIGludGVyZXN0UmF0ZSwgZGltaW5pc2hpbmcpLFxuICAgICAgICAgICAgbW9uZXlUb0xvYW4gPSBsb2FuLmluc3RhbGxtZW50c1swXS5pbnN0YWxsbWVudCxcbiAgICAgICAgICAgIG1vbmV5VG9TYXZpbmdzID0gcm5kKG1heEluc3RhbGxtZW50IC0gbW9uZXlUb0xvYW4pLFxuICAgICAgICAgICAgcG9pbnRPZkNvbnRhY3QsIGludGVyZXN0LCBpbnRJLCBsb2FuSSxcbiAgICAgICAgICAgIGkgPSAwO1xuXG4gICAgICAgIGlmKGRpbWluaXNoaW5nKSB7XG4gICAgICAgICAgcGFyYW1zLmR5bmFtaWNBbW91bnQgPSBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICBpZihsb2FuLmluc3RhbGxtZW50c1tpXSkge1xuICAgICAgICAgICAgICByZXR1cm4gcm5kKG1heEluc3RhbGxtZW50IC0gbG9hbi5pbnN0YWxsbWVudHNbaV0uaW5zdGFsbG1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZihtb25leVRvU2F2aW5ncyA+IDApIHtcbiAgICAgICAgICBpbnRlcmVzdCA9IG5ldyBJbnRlcmVzdChtb25leVRvU2F2aW5ncywgaW5zdE5yLCBzYXZpbmdzSW50ZXJlc3RSYXRlLCBwYXJhbXMpO1xuXG4gICAgICAgICAgZm9yIChpOyBpIDwgaW5zdE5yOyBpKyspIHtcbiAgICAgICAgICAgIGludEkgPSBpbnRlcmVzdC5wYXltZW50c1tpXTtcbiAgICAgICAgICAgIGxvYW5JID0gbG9hbi5pbnN0YWxsbWVudHNbaV07XG5cbiAgICAgICAgICAgIGlmKGludEkuc3VtID49IGxvYW5JLnJlbWFpbikge1xuICAgICAgICAgICAgICAvLyBpbiB0aGlzIG1vbnRoIGludGVyZXN0IHN1bSBpcyBtb3JlIG9yIGVxdWFsIHRvIGxvYW4gcmVtYWluXG4gICAgICAgICAgICAgIC8vIGxvYW4gY2FuIGJlIGZpbmlzaGVkIGJ5IHB1dHRpbmcgbW9uZXkgZnJvbSBzYXZpbmcgdG8gbG9hblxuICAgICAgICAgICAgICBwb2ludE9mQ29udGFjdCA9IHtcbiAgICAgICAgICAgICAgICBpbnN0TnI6IGksXG4gICAgICAgICAgICAgICAgY29zdHM6IHJuZChsb2FuSS5pbnRlcmVzdFN1bSlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkaW1pbmlzaGluZzogISFkaW1pbmlzaGluZyxcbiAgICAgICAgICBtb25leVRvTG9hbjogbW9uZXlUb0xvYW4sICAgICAgIC8vIGhvdyBtdXRjaCBtb25leSBnbyB0byBsb2FuIGluc3RhbGxtZW50XG4gICAgICAgICAgbW9uZXlUb1NhdmluZ3M6IG1vbmV5VG9TYXZpbmdzLCAvLyBob3cgbXV0Y2ggbW9uZXkgZ28gdG8gc2F2aW5nc1xuICAgICAgICAgIGluc3ROcjogaW5zdE5yLFxuICAgICAgICAgIGxvYW46IGxvYW4sXG4gICAgICAgICAgaW50ZXJlc3Q6IGludGVyZXN0LFxuICAgICAgICAgIHBvaW50T2ZDb250YWN0OiBwb2ludE9mQ29udGFjdFxuICAgICAgICB9O1xuXG4gICAgICB9O1xuXG4gIHYgPSBjb3VudFZhcmlhbnQoaW5zdE5yKTtcbiAgd2hpbGUgKHYucG9pbnRPZkNvbnRhY3QpIHtcbiAgICB2YXJpYW50cy5wdXNoKHYpO1xuICAgIGlmKGluc3ROciA+IDEyKSB7XG4gICAgICBpbnN0TnIgLT0gcGFyYW1zLmFjY3VyYWN5O1xuICAgICAgdiA9IGNvdW50VmFyaWFudChpbnN0TnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ID0ge307XG4gICAgfVxuICB9XG4gIGluc3ROciArPSBwYXJhbXMuYWNjdXJhY3kgLSAxO1xuICB2YXIgYWNjID0gMTtcbiAgdiA9IGNvdW50VmFyaWFudChpbnN0TnIpO1xuICB3aGlsZSAodi5wb2ludE9mQ29udGFjdCkge1xuICAgIHZhcmlhbnRzLnB1c2godik7XG4gICAgaW5zdE5yIC09IGFjYztcbiAgICB2ID0gY291bnRWYXJpYW50KGluc3ROcik7XG4gIH1cblxuICBpbnN0TnIgPSBtYXhJbnN0YWxsbWVudHNOdW1iZXI7XG4gIHYgPSBjb3VudFZhcmlhbnQoaW5zdE5yLCB0cnVlKTtcbiAgd2hpbGUgKHYucG9pbnRPZkNvbnRhY3QpIHtcbiAgICB2YXJpYW50cy5wdXNoKHYpO1xuICAgIGlmKGluc3ROciA+IDEyKSB7XG4gICAgICBpbnN0TnIgLT0gcGFyYW1zLmFjY3VyYWN5O1xuICAgICAgdiA9IGNvdW50VmFyaWFudChpbnN0TnIsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ID0ge307XG4gICAgfVxuICB9XG4gIGluc3ROciArPSBwYXJhbXMuYWNjdXJhY3kgLSAxO1xuICB2ID0gY291bnRWYXJpYW50KGluc3ROcik7XG4gIHdoaWxlICh2LnBvaW50T2ZDb250YWN0KSB7XG4gICAgdmFyaWFudHMucHVzaCh2KTtcbiAgICBpbnN0TnIgLT0gYWNjO1xuICAgIHYgPSBjb3VudFZhcmlhbnQoaW5zdE5yLCB0cnVlKTtcbiAgfVxuXG4gIGZvciAoaTsgaSA8IHZhcmlhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdiA9IHZhcmlhbnRzW2ldO1xuICAgIGlmKCFiZXN0IHx8IGJlc3QucG9pbnRPZkNvbnRhY3QuY29zdHMgPiB2LnBvaW50T2ZDb250YWN0LmNvc3RzKSB7XG4gICAgICBiZXN0ID0gdjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGJlc3Q6IGJlc3QsXG4gICAgdmFyaWFudHM6IHZhcmlhbnRzXG4gIH07XG5cbn07XG5cbmlmKHR5cGVvZiBtb2R1bGUgPT09ICd1bmRlZmluZWQnKSB7XG4gIC8vIGJyb3dzZXJcbiAgaWYodHlwZW9mIExPQU5KU19OQU1FU1BBQ0UgPT09ICdvYmplY3QnKSB7XG4gICAgTE9BTkpTX05BTUVTUEFDRS5CZXN0TG9hbiA9IEJlc3RMb2FuO1xuICB9IGVsc2Uge1xuICAgIGlmKCF3aW5kb3cuTG9hbkpTKSB7XG4gICAgICB3aW5kb3cuTG9hbkpTID0ge307XG4gICAgfVxuICAgIHdpbmRvdy5Mb2FuSlMuQmVzdExvYW4gPSBCZXN0TG9hbjtcbiAgfVxufSBlbHNlIHtcbiAgLy8gbm9kZSBvciBicm93c2VyZnlcbiAgbW9kdWxlLmV4cG9ydHMgPSBCZXN0TG9hbjtcbn1cblxufSgpKTtcbiIsIi8qXG4gKiBMb2FuSlNcbiAqIENhbGN1bGF0aW5nIGxvYW4gaW4gZXF1YWwgb3IgZGltaW5pc2hpbmcgaW5zdGFsbG1lbnRzXG4gKiBodHRwczovL2dpdGh1Yi5jb20va2Zpa3UvTG9hbkpTXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEdyemVnb3J6IEtsaW1la1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbigpIHtcbi8qKlxuICogQ3JlYXRlIExvYW4gT2JqZWN0IHdpdGggYWxsIGluc3RhbG1lbnRzIGFuZCBzdW0gb2YgaW50ZXJlc3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgICAgICAgICAgICAgICAgICAgZnVsbCBhbW91bnQgb2YgTG9hblxuICogQHBhcmFtIHtudW1iZXJ9IGluc3RhbGxtZW50c051bWJlciAgICAgICBob3cgbWVueSBpbnN0YWxsbWVudHMgd2lsbCBiZVxuICogQHBhcmFtIHtudW1iZXJ9IGludGVyZXN0UmF0ZSAgICAgICAgICAgICBpbnRlcmVzdCByYXRlIGluIHBlcmNlbnQgKDMuNSlcbiAqIEBwYXJhbSB7W2Jvb2xdfSBkaW1pbmlzaGluZ0luc3RhbGxtZW50cyAgaWYgaW5zdGFsbG1lbnRzIHdpbGwgYmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGltaW5pc2hpbmcgKHRydWUpIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVxdWFsL2FubnVpdHkgKGZhbHNlKVxuICpcbiAqIEByZXR1cm4ge29iamVjdH0ge1xuICogICAgICAgICAgICAgICAgICAgIGFtb3VudDogMTAwMCxcbiAqICAgICAgICAgICAgICAgICAgICBjYXBpdGFsU3VtOiA5OTkuOTYsXG4gKiAgICAgICAgICAgICAgICAgICAgaW50ZXJlc3RTdW06IDI3LjA5XG4gKiAgICAgICAgICAgICAgICAgICAgc3VtOiAxMDI3LjA5XG4gKiAgICAgICAgICAgICAgICAgICAgaW5zdGFsbG1lbnRzOiBbXG4gKiAgICAgICAgICAgICAgICAgICAgICB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGl0YWw6IDgzLjMzLFxuICogICAgICAgICAgICAgICAgICAgICAgICBpbnN0YWxsbWVudDogODcuNVxuICogICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmVzdDogNC4xN1xuICogICAgICAgICAgICAgICAgICAgICAgICByZW1haW46IDBcbiAqICAgICAgICAgICAgICAgICAgICAgIH0sXG4gKiAgICAgICAgICAgICAgICAgICAgICB7Li4ufSxcbiAqICAgICAgICAgICAgICAgICAgICAgIC4uLlxuICogICAgICAgICAgICAgICAgICAgIF1cbiAqICAgICAgICAgICAgICAgICAgfVxuICovXG52YXIgTG9hbiA9IGZ1bmN0aW9uIChhbW91bnQsIGluc3RhbGxtZW50c051bWJlciwgaW50ZXJlc3RSYXRlLCBkaW1pbmlzaGluZykge1xuICAndXNlIHN0cmljdCc7XG4gIGlmKCFhbW91bnQgfHwgYW1vdW50IDw9IDAgfHxcbiAgICAgIWluc3RhbGxtZW50c051bWJlciB8fCBpbnN0YWxsbWVudHNOdW1iZXIgPD0gMCB8fFxuICAgICAhaW50ZXJlc3RSYXRlIHx8IGludGVyZXN0UmF0ZSA8PSAwICkge1xuICAgIHRocm93ICd3cm9uZyBwYXJhbWV0ZXJzICgnICtcbiAgICAgICAgICBbYW1vdW50LCBpbnN0YWxsbWVudHNOdW1iZXIsIGludGVyZXN0UmF0ZSwgZGltaW5pc2hpbmddLmpvaW4oJywgJykgK1xuICAgICAgICAgICcpJztcbiAgfVxuXG4gIHZhciBpbnN0YWxsbWVudHMgPSBbXSxcbiAgICAgIGludGVyZXN0U3VtID0gMCxcbiAgICAgIGNhcGl0YWxTdW0gID0gMCxcbiAgICAgIHN1bSAgICAgICAgID0gMCxcblxuICAgICAgaW5zdCxcblxuICAgICAgLy8gcm91bmQgaGVscGVyIGZ1bmN0aW9uXG4gICAgICBybmQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSoxMDApLzEwMDtcbiAgICAgIH0sXG5cbiAgICAgIGdldE5leHRJbnN0YWxtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjYXBpdGFsLFxuICAgICAgICAgICAgaW50ZXJlc3QsXG4gICAgICAgICAgICBpbnN0YWxsbWVudCxcbiAgICAgICAgICAgIGlybVBvdyxcbiAgICAgICAgICAgIGludGVyZXN0UmF0ZU1vbnRoID0gaW50ZXJlc3RSYXRlIC8gMTIwMDtcblxuICAgICAgICBpZiAoZGltaW5pc2hpbmcpIHtcbiAgICAgICAgICBjYXBpdGFsID0gYW1vdW50IC8gaW5zdGFsbG1lbnRzTnVtYmVyO1xuICAgICAgICAgIGludGVyZXN0ID0gKGFtb3VudCAtIGNhcGl0YWxTdW0pICogaW50ZXJlc3RSYXRlTW9udGg7XG4gICAgICAgICAgaW5zdGFsbG1lbnQgPSBybmQoY2FwaXRhbCArIGludGVyZXN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpcm1Qb3cgPSBNYXRoLnBvdygxICsgaW50ZXJlc3RSYXRlTW9udGgsIGluc3RhbGxtZW50c051bWJlcik7XG4gICAgICAgICAgaW5zdGFsbG1lbnQgPSBybmQoYW1vdW50ICogKChpbnRlcmVzdFJhdGVNb250aCAqIGlybVBvdykgLyAoaXJtUG93IC0gMSkpKTtcbiAgICAgICAgICBpbnRlcmVzdCA9IHJuZCgoYW1vdW50IC0gY2FwaXRhbFN1bSkgKiBpbnRlcmVzdFJhdGVNb250aCk7XG4gICAgICAgICAgY2FwaXRhbCA9IGluc3RhbGxtZW50IC0gaW50ZXJlc3Q7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNhcGl0YWw6IHJuZChjYXBpdGFsKSxcbiAgICAgICAgICBpbnRlcmVzdDogcm5kKGludGVyZXN0KSxcbiAgICAgICAgICBpbnN0YWxsbWVudDogaW5zdGFsbG1lbnQsXG4gICAgICAgICAgcmVtYWluOiBybmQoYW1vdW50IC0gY2FwaXRhbFN1bSAtIGNhcGl0YWwpLFxuICAgICAgICAgIGludGVyZXN0U3VtOiBpbnRlcmVzdFN1bSArIGludGVyZXN0XG4gICAgICAgIH07XG4gICAgICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaW5zdGFsbG1lbnRzTnVtYmVyOyBpKyspIHtcbiAgICBpbnN0ID0gZ2V0TmV4dEluc3RhbG1lbnQoKTtcblxuICAgIHN1bSAgICAgICAgICs9IGluc3QuaW5zdGFsbG1lbnQ7XG4gICAgY2FwaXRhbFN1bSAgKz0gaW5zdC5jYXBpdGFsO1xuICAgIGludGVyZXN0U3VtICs9IGluc3QuaW50ZXJlc3Q7XG4gICAgLy8gYWRkaW5nIGxvc3Qgc3VtIG9uIHJvdW5kaW5nXG4gICAgaWYoaSA9PT0gaW5zdGFsbG1lbnRzTnVtYmVyIC0gMSkge1xuICAgICAgY2FwaXRhbFN1bSArPSBpbnN0LnJlbWFpbjtcbiAgICAgIGluc3QucmVtYWluID0gMDtcbiAgICB9XG5cbiAgICBpbnN0YWxsbWVudHMucHVzaChpbnN0KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5zdGFsbG1lbnRzICA6IGluc3RhbGxtZW50cyxcbiAgICBhbW91bnQgICAgICAgIDogcm5kKGFtb3VudCksXG4gICAgaW50ZXJlc3RTdW0gICA6IHJuZChpbnRlcmVzdFN1bSksXG4gICAgY2FwaXRhbFN1bSAgICA6IHJuZChjYXBpdGFsU3VtKSxcbiAgICBzdW0gICAgICAgICAgIDogc3VtXG4gIH07XG59O1xuXG5pZih0eXBlb2YgbW9kdWxlID09PSAndW5kZWZpbmVkJykge1xuICAvLyBicm93c2VyXG4gIGlmKHR5cGVvZiBMT0FOSlNfTkFNRVNQQUNFID09PSAnb2JqZWN0Jykge1xuICAgIExPQU5KU19OQU1FU1BBQ0UuTG9hbiA9IExvYW47XG4gIH0gZWxzZSB7XG4gICAgaWYoIXdpbmRvdy5Mb2FuSlMpIHtcbiAgICAgIHdpbmRvdy5Mb2FuSlMgPSB7fTtcbiAgICB9XG4gICAgd2luZG93LkxvYW5KUy5Mb2FuID0gTG9hbjtcbiAgfVxufSBlbHNlIHtcbiAgLy8gbm9kZSBvciBicm93c2VyZnlcbiAgbW9kdWxlLmV4cG9ydHMgPSBMb2FuO1xufVxuXG59KCkpO1xuIiwiLypcbiAqIExvYW5KU1xuICogQ2FsY3VsYXRpbmcgbG9hbiBpbiBlcXVhbCBvciBkaW1pbmlzaGluZyBpbnN0YWxsbWVudHNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9rZmlrdS9Mb2FuSlNcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgR3J6ZWdvcnogS2xpbWVrXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuLyoqXG4gKiBDcmVhdGUgTG9hbiBPYmplY3Qgd2l0aCBhbGwgaW5zdGFsbWVudHMgYW5kIHN1bSBvZiBpbnRlcmVzdFxuICogQHBhcmFtIHtMb2FufSAgICBsb2FuICAgICBsb2FuIG9iamVjdFxuICogQHBhcmFtIHtvYmplY3R9ICBwYXJhbXMgICBwYXJhbXNcbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgIGh0bWwgc3RyaW5nIHdpdGggdGFibGVcbiAqL1xudmFyIGxvYW5Ub0h0bWxUYWJsZSA9IGZ1bmN0aW9uIChsb2FuLCBwYXJhbXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gIHBhcmFtcy5mb3JtYXRNb25leSA9IHBhcmFtcy5mb3JtYXRNb25leSB8fCBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIG51bS50b0ZpeGVkKDIpO1xuICB9O1xuICB2YXJcbiAgICBmbSA9IHBhcmFtcy5mb3JtYXRNb25leSxcbiAgICB0cmFucyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGlmKHBhcmFtcy50cmFuc2xhdGlvbnMgJiYgcGFyYW1zLnRyYW5zbGF0aW9uc1trZXldKSB7XG4gICAgICAgIHJldHVybiBwYXJhbXMudHJhbnNsYXRpb25zW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH0sXG4gICAgaHRtbCA9IFtcbiAgICAgICc8dGFibGU+JyArXG4gICAgICAgICc8dGhlYWQ+JyArXG4gICAgICAgICAgJzx0cj4nICtcbiAgICAgICAgICAgICc8dGg+PC90aD4nICtcbiAgICAgICAgICAgICc8dGg+JyArIHRyYW5zKCdDYXBpdGFsJykgKyAnPC90aD4nICtcbiAgICAgICAgICAgICc8dGg+JyArIHRyYW5zKCdJbnRlcmVzdCcpICsgJzwvdGg+JyArXG4gICAgICAgICAgICAnPHRoPicgKyB0cmFucygnSW5zdGFsbWVudCcpICsgJzwvdGg+JyArXG4gICAgICAgICAgICAnPHRoPicgKyB0cmFucygnUmVtYWluJykgKyAnPC90aD4nICtcbiAgICAgICAgICAgICc8dGg+JyArIHRyYW5zKCdJbnRlcmVzdCBzdW0nKSArICc8L3RoPicgK1xuICAgICAgICAgICc8L3RyPicgK1xuICAgICAgICAnPC90aGVhZD4nK1xuICAgICAgICAnPHRib2R5PicsXG4gICAgICAgICAgJycsICAvLyBib2R5IGNvbnRlbnQgWzFdXG4gICAgICAgICc8L3Rib2R5PicgK1xuICAgICAgJzwvdGFibGU+J1xuICAgIF07XG5cbiAgY29uc29sZS5sb2cobG9hbik7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2FuLmluc3RhbGxtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpbnN0ID0gbG9hbi5pbnN0YWxsbWVudHNbaV0sXG4gICAgICAgIGluc3RIdG1sID1cbiAgICAgICAgICAnPHRyPicgK1xuICAgICAgICAgICAgJzx0ZD4nICsgKGkrMSkgKyAnPC90ZD4nICtcbiAgICAgICAgICAgICc8dGQ+JyArIGZtKGluc3QuY2FwaXRhbCkgKyAnPC90ZD4nICtcbiAgICAgICAgICAgICc8dGQ+JyArIGZtKGluc3QuaW50ZXJlc3QpICsgJzwvdGQ+JyArXG4gICAgICAgICAgICAnPHRkPicgKyBmbShpbnN0Lmluc3RhbGxtZW50KSArICc8L3RkPicgK1xuICAgICAgICAgICAgJzx0ZD4nICsgZm0oaW5zdC5yZW1haW4pICsgJzwvdGQ+JyArXG4gICAgICAgICAgICAnPHRkPicgKyBmbShpbnN0LmludGVyZXN0U3VtKSArICc8L3RkPicgK1xuICAgICAgICAgICc8L3RyPic7XG4gICAgaHRtbFsxXSArPSBpbnN0SHRtbDtcbiAgfVxuXG4gIGh0bWxbMV0gKz1cbiAgICAnPHRyPicgK1xuICAgICAgJzx0ZD4nICsgdHJhbnMoJ3N1bScpICsgJzwvdGQ+JyArXG4gICAgICAnPHRkPicgKyBmbShsb2FuLmNhcGl0YWxTdW0pICsgJzwvdGQ+JyArXG4gICAgICAnPHRkPicgKyBmbShsb2FuLmludGVyZXN0U3VtKSArICc8L3RkPicgK1xuICAgICAgJzx0ZD4nICsgZm0obG9hbi5zdW0pICsgJzwvdGQ+JyArXG4gICAgICAnPHRkPi08L3RkPicgK1xuICAgICAgJzx0ZD4tPC90ZD4nICtcbiAgICAnPC90cj4nO1xuXG4gIHJldHVybiBodG1sLmpvaW4oJycpO1xufTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGxvYW5Ub0h0bWxUYWJsZTtcbn1cbmlmKHR5cGVvZiBtb2R1bGUgPT09ICd1bmRlZmluZWQnKSB7XG4gIC8vIGJyb3dzZXJcbiAgaWYodHlwZW9mIExPQU5KU19OQU1FU1BBQ0UgPT09ICdvYmplY3QnKSB7XG4gICAgTE9BTkpTX05BTUVTUEFDRS5sb2FuVG9IdG1sVGFibGUgPSBsb2FuVG9IdG1sVGFibGU7XG4gIH0gZWxzZSB7XG4gICAgaWYoIXdpbmRvdy5Mb2FuSlMpIHtcbiAgICAgIHdpbmRvdy5Mb2FuSlMgPSB7fTtcbiAgICB9XG4gICAgd2luZG93LkxvYW5KUy5sb2FuVG9IdG1sVGFibGUgPSBsb2FuVG9IdG1sVGFibGU7XG4gIH1cbn0gZWxzZSB7XG4gIC8vIG5vZGUgb3IgYnJvd3NlcmZ5XG4gIG1vZHVsZS5leHBvcnRzID0gbG9hblRvSHRtbFRhYmxlO1xufVxuXG59KCkpO1xuIiwiLyoqXG4gKiBsb2Rhc2ggNC4wLjAgKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTYgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxNiBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIHRvU3RyaW5nID0gcmVxdWlyZSgnbG9kYXNoLnRvc3RyaW5nJyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIEhUTUwgZW50aXRpZXMgYW5kIEhUTUwgY2hhcmFjdGVycy4gKi9cbnZhciByZVVuZXNjYXBlZEh0bWwgPSAvWyY8PlwiJ2BdL2csXG4gICAgcmVIYXNVbmVzY2FwZWRIdG1sID0gUmVnRXhwKHJlVW5lc2NhcGVkSHRtbC5zb3VyY2UpO1xuXG4vKiogVXNlZCB0byBtYXAgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLiAqL1xudmFyIGh0bWxFc2NhcGVzID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gIFwiJ1wiOiAnJiMzOTsnLFxuICAnYCc6ICcmIzk2Oydcbn07XG5cbi8qKlxuICogVXNlZCBieSBgXy5lc2NhcGVgIHRvIGNvbnZlcnQgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hyIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byBlc2NhcGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAqL1xuZnVuY3Rpb24gZXNjYXBlSHRtbENoYXIoY2hyKSB7XG4gIHJldHVybiBodG1sRXNjYXBlc1tjaHJdO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBjaGFyYWN0ZXJzIFwiJlwiLCBcIjxcIiwgXCI+XCIsICdcIicsIFwiJ1wiLCBhbmQgXCJcXGBcIiBpbiBgc3RyaW5nYCB0b1xuICogdGhlaXIgY29ycmVzcG9uZGluZyBIVE1MIGVudGl0aWVzLlxuICpcbiAqICoqTm90ZToqKiBObyBvdGhlciBjaGFyYWN0ZXJzIGFyZSBlc2NhcGVkLiBUbyBlc2NhcGUgYWRkaXRpb25hbFxuICogY2hhcmFjdGVycyB1c2UgYSB0aGlyZC1wYXJ0eSBsaWJyYXJ5IGxpa2UgW19oZV9dKGh0dHBzOi8vbXRocy5iZS9oZSkuXG4gKlxuICogVGhvdWdoIHRoZSBcIj5cIiBjaGFyYWN0ZXIgaXMgZXNjYXBlZCBmb3Igc3ltbWV0cnksIGNoYXJhY3RlcnMgbGlrZVxuICogXCI+XCIgYW5kIFwiL1wiIGRvbid0IG5lZWQgZXNjYXBpbmcgaW4gSFRNTCBhbmQgaGF2ZSBubyBzcGVjaWFsIG1lYW5pbmdcbiAqIHVubGVzcyB0aGV5J3JlIHBhcnQgb2YgYSB0YWcgb3IgdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlLlxuICogU2VlIFtNYXRoaWFzIEJ5bmVucydzIGFydGljbGVdKGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9hbWJpZ3VvdXMtYW1wZXJzYW5kcylcbiAqICh1bmRlciBcInNlbWktcmVsYXRlZCBmdW4gZmFjdFwiKSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEJhY2t0aWNrcyBhcmUgZXNjYXBlZCBiZWNhdXNlIGluIElFIDwgOSwgdGhleSBjYW4gYnJlYWsgb3V0IG9mXG4gKiBhdHRyaWJ1dGUgdmFsdWVzIG9yIEhUTUwgY29tbWVudHMuIFNlZSBbIzU5XShodHRwczovL2h0bWw1c2VjLm9yZy8jNTkpLFxuICogWyMxMDJdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMDIpLCBbIzEwOF0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvIzEwOCksIGFuZFxuICogWyMxMzNdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMzMpIG9mIHRoZSBbSFRNTDUgU2VjdXJpdHkgQ2hlYXRzaGVldF0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvKVxuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBXaGVuIHdvcmtpbmcgd2l0aCBIVE1MIHlvdSBzaG91bGQgYWx3YXlzIFtxdW90ZSBhdHRyaWJ1dGUgdmFsdWVzXShodHRwOi8vd29ua28uY29tL3Bvc3QvaHRtbC1lc2NhcGluZylcbiAqIHRvIHJlZHVjZSBYU1MgdmVjdG9ycy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSBzdHJpbmcgdG8gZXNjYXBlLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZXNjYXBlKCdmcmVkLCBiYXJuZXksICYgcGViYmxlcycpO1xuICogLy8gPT4gJ2ZyZWQsIGJhcm5leSwgJmFtcDsgcGViYmxlcydcbiAqL1xuZnVuY3Rpb24gZXNjYXBlKHN0cmluZykge1xuICBzdHJpbmcgPSB0b1N0cmluZyhzdHJpbmcpO1xuICByZXR1cm4gKHN0cmluZyAmJiByZUhhc1VuZXNjYXBlZEh0bWwudGVzdChzdHJpbmcpKVxuICAgID8gc3RyaW5nLnJlcGxhY2UocmVVbmVzY2FwZWRIdG1sLCBlc2NhcGVIdG1sQ2hhcilcbiAgICA6IHN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGU7XG4iLCIvKipcbiAqIGxvZGFzaCA0LjEuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxNiBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDE2IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgYE9iamVjdGAuICovXG52YXIgb2JqZWN0VHlwZXMgPSB7XG4gICdmdW5jdGlvbic6IHRydWUsXG4gICdvYmplY3QnOiB0cnVlXG59O1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGV4cG9ydHNgLiAqL1xudmFyIGZyZWVFeHBvcnRzID0gKG9iamVjdFR5cGVzW3R5cGVvZiBleHBvcnRzXSAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlKVxuICA/IGV4cG9ydHNcbiAgOiB1bmRlZmluZWQ7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYC4gKi9cbnZhciBmcmVlTW9kdWxlID0gKG9iamVjdFR5cGVzW3R5cGVvZiBtb2R1bGVdICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlKVxuICA/IG1vZHVsZVxuICA6IHVuZGVmaW5lZDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gY2hlY2tHbG9iYWwoZnJlZUV4cG9ydHMgJiYgZnJlZU1vZHVsZSAmJiB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCk7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgc2VsZmAuICovXG52YXIgZnJlZVNlbGYgPSBjaGVja0dsb2JhbChvYmplY3RUeXBlc1t0eXBlb2Ygc2VsZl0gJiYgc2VsZik7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgd2luZG93YC4gKi9cbnZhciBmcmVlV2luZG93ID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHdpbmRvd10gJiYgd2luZG93KTtcblxuLyoqIERldGVjdCBgdGhpc2AgYXMgdGhlIGdsb2JhbCBvYmplY3QuICovXG52YXIgdGhpc0dsb2JhbCA9IGNoZWNrR2xvYmFsKG9iamVjdFR5cGVzW3R5cGVvZiB0aGlzXSAmJiB0aGlzKTtcblxuLyoqXG4gKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICpcbiAqIFRoZSBgdGhpc2AgdmFsdWUgaXMgdXNlZCBpZiBpdCdzIHRoZSBnbG9iYWwgb2JqZWN0IHRvIGF2b2lkIEdyZWFzZW1vbmtleSdzXG4gKiByZXN0cmljdGVkIGB3aW5kb3dgIG9iamVjdCwgb3RoZXJ3aXNlIHRoZSBgd2luZG93YCBvYmplY3QgaXMgdXNlZC5cbiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8XG4gICgoZnJlZVdpbmRvdyAhPT0gKHRoaXNHbG9iYWwgJiYgdGhpc0dsb2JhbC53aW5kb3cpKSAmJiBmcmVlV2luZG93KSB8fFxuICAgIGZyZWVTZWxmIHx8IHRoaXNHbG9iYWwgfHwgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGdsb2JhbCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge251bGx8T2JqZWN0fSBSZXR1cm5zIGB2YWx1ZWAgaWYgaXQncyBhIGdsb2JhbCBvYmplY3QsIGVsc2UgYG51bGxgLlxuICovXG5mdW5jdGlvbiBjaGVja0dsb2JhbCh2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICYmIHZhbHVlLk9iamVjdCA9PT0gT2JqZWN0KSA/IHZhbHVlIDogbnVsbDtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbi8qKiBVc2VkIHRvIGNvbnZlcnQgc3ltYm9scyB0byBwcmltaXRpdmVzIGFuZCBzdHJpbmdzLiAqL1xudmFyIHN5bWJvbFByb3RvID0gU3ltYm9sID8gU3ltYm9sLnByb3RvdHlwZSA6IHVuZGVmaW5lZCxcbiAgICBzeW1ib2xUb1N0cmluZyA9IFN5bWJvbCA/IHN5bWJvbFByb3RvLnRvU3RyaW5nIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgaWYgaXQncyBub3Qgb25lLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWRcbiAqIGZvciBgbnVsbGAgYW5kIGB1bmRlZmluZWRgIHZhbHVlcy4gVGhlIHNpZ24gb2YgYC0wYCBpcyBwcmVzZXJ2ZWQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvU3RyaW5nKG51bGwpO1xuICogLy8gPT4gJydcbiAqXG4gKiBfLnRvU3RyaW5nKC0wKTtcbiAqIC8vID0+ICctMCdcbiAqXG4gKiBfLnRvU3RyaW5nKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiAnMSwyLDMnXG4gKi9cbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlKSB7XG4gIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBTeW1ib2wgPyBzeW1ib2xUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICB9XG4gIHZhciByZXN1bHQgPSAodmFsdWUgKyAnJyk7XG4gIHJldHVybiAocmVzdWx0ID09ICcwJyAmJiAoMSAvIHZhbHVlKSA9PSAtSU5GSU5JVFkpID8gJy0wJyA6IHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1N0cmluZztcbiIsInZhciBfID0ge2VzY2FwZTogcmVxdWlyZShcImxvZGFzaC5lc2NhcGVcIil9O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmope1xudmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLHByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XG53aXRoKG9ianx8e30pe1xuX19wKz0nPHRkPicrXG4oKF9fdD0oIGRhdGEuaWQgKSk9PW51bGw/Jyc6X190KStcbic8L3RkPlxcbiAgPHRkPjxpbnB1dCBjbGFzcz1cImFtb3VudFwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInK1xuKChfX3Q9KCBkYXRhLmFtb3VudCkpPT1udWxsPycnOl9fdCkrXG4nXCI+PC90ZD5cXG4gIDx0ZD48aW5wdXQgY2xhc3M9XCJxdWFudGl0eVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInK1xuKChfX3Q9KCBkYXRhLnF1YW50aXR5ICkpPT1udWxsPycnOl9fdCkrXG4nXCI+PC90ZD5cXG4gIDx0ZD48aW5wdXQgY2xhc3M9XCJpbnRlcmVzdFwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCInK1xuKChfX3Q9KCBkYXRhLmludGVyZXN0ICkpPT1udWxsPycnOl9fdCkrXG4nXCI+PC90ZD5cXG4gIDx0ZD48c3BhbiBjbGFzcz1cImVxdWFsSW50ZXJlc3RTdW1cIj4nK1xuKChfX3Q9KCBkYXRhLmVxdWFsSW50ZXJlc3RTdW0gKSk9PW51bGw/Jyc6X190KStcbic8L3NwYW4+PC90ZD5cXG4gIDx0ZD48c3BhbiBjbGFzcz1cImVxdWFsSW5zdGFsbG1lbnRBbW91bnRcIj4nK1xuKChfX3Q9KCBkYXRhLmVxdWFsSW5zdGFsbG1lbnRBbW91bnQgKSk9PW51bGw/Jyc6X190KStcbic8L3NwYW4+PC90ZD5cXG4gIDx0ZD48c3BhbiBjbGFzcz1cImRpbWluaXNoaW5nSW50ZXJlc3RzU3VtXCI+JytcbigoX190PSggZGF0YS5kaW1pbmlzaGluZ0ludGVyZXN0c1N1bSApKT09bnVsbD8nJzpfX3QpK1xuJzwvc3Bhbj48L3RkPlxcbiAgPHRkPjxzcGFuIGNsYXNzPVwiZGltaW5pc2hpbmdGaXJzdEluc3RhbGxtZW50QW1vdW50XCI+JytcbigoX190PSggZGF0YS5kaW1pbmlzaGluZ0ZpcnN0SW5zdGFsbG1lbnRBbW91bnQgKSk9PW51bGw/Jyc6X190KStcbic8L3NwYW4+PC90ZD5cXG4gIDx0ZD48c3BhbiBjbGFzcz1cImRpbWluaXNoaW5nTGFzdEluc3RhbGxtZW50QW1vdW50XCI+JytcbigoX190PSggZGF0YS5kaW1pbmlzaGluZ0xhc3RJbnN0YWxsbWVudEFtb3VudCApKT09bnVsbD8nJzpfX3QpK1xuJzwvc3Bhbj48L3RkPlxcbiAgPHRkPjxidXR0b24gY2xhc3M9XCJyZW1vdmVcIj5YPC9idXR0b24+PC90ZD4nO1xufVxucmV0dXJuIF9fcDtcbn07XG4iLCJpbXBvcnQgeyBDb21wYXJlUm93IH0gZnJvbSAnLi9Sb3cnO1xuXG5leHBvcnQgY2xhc3MgQ29tcGFyZUxpc3Qge1xuICBlbDtcbiAgcm93czogQ29tcGFyZVJvd1tdID0gW107XG4gIGFkZE5ld0J0bjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21haW5UYm9keScpO1xuICAgIHRoaXMuYWRkTmV3QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZENvbXBhcmVSb3cnKTtcbiAgICB0aGlzLmFkZE5ld0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuYWRkTmV3Um93KCkpXG5cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgZ2V0RGF0YSgpIHtcbiAgICBsZXQgbGlzdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjb21wYXRlJyk7XG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICBsaXN0ID0gJ1t7fV0nO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgbGlzdCA9IEpTT04ucGFyc2UobGlzdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGlzdCA9IFtdO1xuICAgIH1cblxuICAgIHJldHVybiBsaXN0O1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHRoaXMuZ2V0RGF0YSgpLmZvckVhY2goKGVsKSA9PiB0aGlzLmFkZE5ld1JvdyhlbCkpO1xuICB9XG5cbiAgYWRkTmV3Um93IChlbDogYW55ID0geyBhbW91bnQ6IDEwMDAwMCwgcXVhbnRpdHk6IDM2MCwgaW50ZXJlc3Q6IDMuNSB9KSB7XG4gICAgZWwuaWQgPSB0aGlzLnJvd3MubGVuZ3RoO1xuICAgIGxldCBjciA9IG5ldyBDb21wYXJlUm93KGVsKTtcblxuICAgIHRoaXMucm93cy5wdXNoKGNyKTtcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKGNyLmVsKTtcblxuICAgIGNyLm9uKCdjaGFuZ2UnLCAoKSA9PiB0aGlzLnNhdmUoKSk7XG4gICAgY3Iub24oJ3JlbW92ZScsICgpID0+IHRoaXMub25Sb3dSZW1vdmUoY3IpKTtcblxuICAgIHRoaXMuc2F2ZSgpO1xuICB9XG5cbiAgc2F2ZSAoKSB7XG4gICAgbGV0IGxpc3QgPSBbXTtcbiAgICB0aGlzLnJvd3MuZm9yRWFjaCgocm93OiBDb21wYXJlUm93KSA9PiB7XG4gICAgICBsaXN0LnB1c2goe1xuICAgICAgICBpZDogcm93LmRhdGEuaWQsXG4gICAgICAgIGFtb3VudDogcm93LmRhdGEuYW1vdW50LFxuICAgICAgICBxdWFudGl0eTogcm93LmRhdGEucXVhbnRpdHksXG4gICAgICAgIGludGVyZXN0OiByb3cuZGF0YS5pbnRlcmVzdFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjb21wYXRlJywgSlNPTi5zdHJpbmdpZnkobGlzdCkpO1xuICB9XG5cbiAgb25Sb3dSZW1vdmUgKGNyOiBDb21wYXJlUm93KSB7XG4gICAgdGhpcy5yb3dzLnNwbGljZShjci5kYXRhLmlkLCAxKTtcbiAgICB0aGlzLnNhdmUoKTtcbiAgfVxufTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi90eXBpbmdzL3RzZC5kLnRzXCIgLz5cbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5sZXQgdHBsID0gIHJlcXVpcmUoJy4uLy4uL3RwbC90YWJsZVJvdy50cGwnKTtcbmxldCBMb2FuID0gIHJlcXVpcmUoJ2xvYW5qcycpLkxvYW47XG5cbmV4cG9ydCBjbGFzcyBDb21wYXJlUm93IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgZWw7XG4gIGFtb3VudDogSFRNTElucHV0RWxlbWVudDtcbiAgcXVhbnRpdHk6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGludGVyZXN0OiBIVE1MSW5wdXRFbGVtZW50O1xuXG4gIGVxdWFsSW50ZXJlc3RTdW06IEhUTUxTcGFuRWxlbWVudDtcbiAgZXF1YWxJbnN0YWxsbWVudEFtb3VudDogSFRNTFNwYW5FbGVtZW50O1xuXG4gIGRpbWluaXNoaW5nSW50ZXJlc3RzU3VtOiBIVE1MU3BhbkVsZW1lbnQ7XG4gIGRpbWluaXNoaW5nRmlyc3RJbnN0YWxsbWVudEFtb3VudDogSFRNTFNwYW5FbGVtZW50O1xuICBkaW1pbmlzaGluZ0xhc3RJbnN0YWxsbWVudEFtb3VudDogSFRNTFNwYW5FbGVtZW50O1xuXG4gIHJlbW92ZUJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGRhdGEpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBpZighdGhpcy5lbCkge1xuICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG4gICAgICB0aGlzLmVsLmlubmVySFRNTCA9IHRwbCh7ZGF0YTogdGhpcy5kYXRhfSk7XG5cbiAgICAgIHRoaXMuYW1vdW50ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcuYW1vdW50Jyk7XG4gICAgICB0aGlzLnF1YW50aXR5ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucXVhbnRpdHknKTtcbiAgICAgIHRoaXMuaW50ZXJlc3QgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5pbnRlcmVzdCcpO1xuXG4gICAgICB0aGlzLmxpc3RlbkZpZWxkKHRoaXMuYW1vdW50KTtcbiAgICAgIHRoaXMubGlzdGVuRmllbGQodGhpcy5xdWFudGl0eSk7XG4gICAgICB0aGlzLmxpc3RlbkZpZWxkKHRoaXMuaW50ZXJlc3QpO1xuXG4gICAgICB0aGlzLmVxdWFsSW50ZXJlc3RTdW0gPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5lcXVhbEludGVyZXN0U3VtJyk7XG4gICAgICB0aGlzLmVxdWFsSW5zdGFsbG1lbnRBbW91bnQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5lcXVhbEluc3RhbGxtZW50QW1vdW50Jyk7XG5cbiAgICAgIHRoaXMuZGltaW5pc2hpbmdJbnRlcmVzdHNTdW0gPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5kaW1pbmlzaGluZ0ludGVyZXN0c1N1bScpO1xuICAgICAgdGhpcy5kaW1pbmlzaGluZ0ZpcnN0SW5zdGFsbG1lbnRBbW91bnQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5kaW1pbmlzaGluZ0ZpcnN0SW5zdGFsbG1lbnRBbW91bnQnKTtcbiAgICAgIHRoaXMuZGltaW5pc2hpbmdMYXN0SW5zdGFsbG1lbnRBbW91bnQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5kaW1pbmlzaGluZ0xhc3RJbnN0YWxsbWVudEFtb3VudCcpO1xuXG4gICAgICB0aGlzLnJlbW92ZUJ0biA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnJlbW92ZScpO1xuICAgICAgdGhpcy5yZW1vdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm9uUmVtb3ZlKCkpO1xuICAgIH1cblxuICAgIC8vIGNvdW50aW5nIGxvYW5cbiAgICB0aGlzLmRhdGEuZXF1YWxMb2FuID0gbmV3IExvYW4odGhpcy5kYXRhLmFtb3VudCwgdGhpcy5kYXRhLnF1YW50aXR5LCB0aGlzLmRhdGEuaW50ZXJlc3QpO1xuICAgIHRoaXMuZGF0YS5kaW1pbmlzaGluZ0xvYW4gPSBuZXcgTG9hbih0aGlzLmRhdGEuYW1vdW50LCB0aGlzLmRhdGEucXVhbnRpdHksIHRoaXMuZGF0YS5pbnRlcmVzdCwgdHJ1ZSk7XG5cbiAgICB0aGlzLmRhdGEuZXF1YWxJbnRlcmVzdFN1bSA9IHRoaXMuZGF0YS5lcXVhbExvYW4uaW50ZXJlc3RTdW07XG4gICAgdGhpcy5kYXRhLmVxdWFsSW5zdGFsbG1lbnRBbW91bnQgPSB0aGlzLmRhdGEuZXF1YWxMb2FuLmluc3RhbGxtZW50c1swXS5pbnN0YWxsbWVudDtcblxuICAgIHRoaXMuZGF0YS5kaW1pbmlzaGluZ0ludGVyZXN0c1N1bSA9IHRoaXMuZGF0YS5lcXVhbExvYW4uaW50ZXJlc3RTdW07XG4gICAgdGhpcy5kYXRhLmRpbWluaXNoaW5nRmlyc3RJbnN0YWxsbWVudEFtb3VudCA9IHRoaXMuZGF0YS5lcXVhbExvYW4uaW5zdGFsbG1lbnRzWzBdLmluc3RhbGxtZW50O1xuICAgIHRoaXMuZGF0YS5kaW1pbmlzaGluZ0xhc3RJbnN0YWxsbWVudEFtb3VudCA9IHRoaXMuZGF0YS5lcXVhbExvYW4uaW5zdGFsbG1lbnRzW3RoaXMuZGF0YS5kaW1pbmlzaGluZ0xvYW4uaW5zdGFsbG1lbnRzLmxlbmd0aCAtIDFdLmluc3RhbGxtZW50O1xuXG4gICAgLy8gU2V0dGluZyBJbm5lckhUTUwgb2YgZWxlbWVudHNcbiAgICB0aGlzLmVxdWFsSW50ZXJlc3RTdW0uaW5uZXJIVE1MICAgICAgICAgICAgICAgICAgPSB0aGlzLmRhdGEuZXF1YWxJbnRlcmVzdFN1bTtcbiAgICB0aGlzLmVxdWFsSW5zdGFsbG1lbnRBbW91bnQuaW5uZXJIVE1MICAgICAgICAgICAgPSB0aGlzLmRhdGEuZXF1YWxJbnN0YWxsbWVudEFtb3VudDtcblxuICAgIHRoaXMuZGltaW5pc2hpbmdJbnRlcmVzdHNTdW0uaW5uZXJIVE1MICAgICAgICAgICA9IHRoaXMuZGF0YS5kaW1pbmlzaGluZ0ludGVyZXN0c1N1bTtcbiAgICB0aGlzLmRpbWluaXNoaW5nRmlyc3RJbnN0YWxsbWVudEFtb3VudC5pbm5lckhUTUwgPSB0aGlzLmRhdGEuZGltaW5pc2hpbmdGaXJzdEluc3RhbGxtZW50QW1vdW50O1xuICAgIHRoaXMuZGltaW5pc2hpbmdMYXN0SW5zdGFsbG1lbnRBbW91bnQuaW5uZXJIVE1MICA9IHRoaXMuZGF0YS5kaW1pbmlzaGluZ0xhc3RJbnN0YWxsbWVudEFtb3VudDtcblxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5GaWVsZCAoZmllbGQ6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICBmaWVsZC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChlKSA9PiB0aGlzLm9uRmllbGRDaGFuZ2UoZSkpO1xuICAgIGZpZWxkLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB0aGlzLm9uRmllbGRDaGFuZ2UoZSkpO1xuICB9XG5cbiAgb25GaWVsZENoYW5nZSAoZSkge1xuICAgIC8vIGNvbnNvbGUubG9nKGUua2V5Q29kZSk7XG5cbiAgICAvLyBLRVlCT0FSRCBFVkVOVCAgTlVNUEFEICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOVU1CIEVSUyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCQUNLU1BBQ0VcbiAgICBpZihlLmtleUNvZGUgJiYgISgoZS5rZXlDb2RlID49IDk2ICYmIGUua2V5Q29kZSA8PSAxMDUpIHx8IChlLmtleUNvZGUgPj0gNDggJiYgZS5rZXlDb2RlIDw9IDU3KSB8fCBlLmtleUNvZGUgPT09IDgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZS50YXJnZXQudmFsdWUgPSB0aGlzLmRhdGFbZS50YXJnZXQuY2xhc3NOYW1lXSA9IHBhcnNlRmxvYXQoZS50YXJnZXQudmFsdWUucmVwbGFjZSgnLCcsICcuJykpIHx8IDA7XG5cbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gIH1cblxuICBvblJlbW92ZSgpIHtcbiAgICB0aGlzLmVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbCk7XG4gICAgdGhpcy5lbWl0KCdyZW1vdmUnKTtcbiAgfVxufTtcbiIsImltcG9ydCB7IENvbXBhcmVMaXN0IH0gZnJvbSAnLi9Db21wYXJlL0xpc3QnO1xuXG5sZXQgbGlzdCA9IG5ldyBDb21wYXJlTGlzdCgpO1xuIl19
