# LoanJS

[<img src="http://npm.packagequality.com/badge/loanjs.png" align="right"/>](http://packagequality.com/#?package=loanjs)
[![NPM version](https://badge.fury.io/js/loanjs.svg)](http://badge.fury.io/js/loanjs)
![core gzip size](http://img.badgesize.io/https://unpkg.com/loanjs@1.0.1/dist/loan.min.js?compression=gzip&label=core%20gzip%20size)

Super **small** (**~500B**) and **fast** module to calculate loan in js (browser/node.js) for **equal**/**decreasing** installments, the **sum of interest**, etc.

Now with TypeScript support

## Getting Started

Install the module with:
```
npm install loanjs
```

or Bower:
```
bower install loan-js --save
```

#### Calculating Loan:
```js
import { Loan } from 'loanjs';
// or
const { Loan } = require('loanjs');

const loan = new Loan(
  1000, // amount
  12,   // installments number
  5,    // interest rate
  true  // diminishing
);
/** returns
{
  installments  : [
    {
      capital     : number,
      interest    : number,
      installment : number,
      remain      : number
    }
  ],
  amount        : number,
  interestSum   : number,
  capitalSum    : number,
  sum           : number
}
*/
```

## Documentation

### Loan
LoanJS.Loan(amount, installmentsNumber, interestRate, diminishing)

### Arguments
| Argument           | type   | default   | Description
| ------------------ | ------ | --------- | ------------------
| amount             | number | *required | full amount of Loan
| installmentsNumber | number | *required | how many installments will be (in months)
| interestRate       | number | *required | interest rate in percent (ex. 3.5)
| diminishing        | bool   | false     | if installments will be - true: diminishing; false: equal/annuity

### Returns
```js
{
  installments  : [
    {
      capital     : number,
      interest    : number,
      installment : number,
      remain      : number
    }
  ],
  amount        : number,
  interestSum   : number,
  capitalSum    : number,
  sum           : number
}
```

## Examples

nodejs / browserify example
```js

const { Loan } = require('loanjs');

const loan_1 = new Loan(1000, 12, 5, true);
// loan on 1 000($) in 12 diminishing installments (ex. months) with 5% interest rate

const loan_2 = new Loan(500000, 360, 3.5);
// loan on 500 000($) in 360 equal installments (30 years) with 3.5% interest rate
```

Browser example:
> You can also render loan as html table

```html
<script src="../../dist/loan.js"></script>
<script src="../../dist/loanToHtmlTable.js"></script>
<script>
    var loan = new LoanJS.Loan(1000, 12, 5, true);

    var div = document.createElement("div");
    div.innerHTML = LoanJS.loanToHtmlTable(loan); // loan rendering as html table string
    document.body.appendChild(div);
</script>
```

more examples [here](https://github.com/kfiku/LoanJS/tree/master/example)

## Similar projects
* [InterestJS](https://github.com/kfiku/InterestJS) - counting regular savings

## Contributing

Im open for contributors :).


## Release History

#### 2023-06-23 v1.0.11
 * add TypeScript types
 * code cleanup
 * packages update

#### 2017-08-06 v1.0.0
 * go to es6
 * make dist files
 * make 100% covered tests

#### 2016-02-29 v0.1.4
 * update dependencies

#### 2015-10-12 v0.1.3
 * fixing typo intrest -> interest [#3](https://github.com/kfiku/LoanJS/issues/3)
 * update dependencies

#### 2014-11-10 v0.0.4
 * update dependencies

#### 2014-11-10 v0.0.2
 * now you can use it in node/browserify and browser



## License

Copyright (c) 2023 Grzegorz Klimek
Licensed under the MIT license.
