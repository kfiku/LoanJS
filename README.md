# LoanJS

[<img src="http://npm.packagequality.com/badge/loanjs.png" align="right"/>](http://packagequality.com/#?package=loanjs)
[![NPM version](https://badge.fury.io/js/loanjs.svg)](http://badge.fury.io/js/loanjs)
![core gzip size](http://img.badgesize.io/https://unpkg.com/loanjs@1.0.1/dist/loan.min.js?compression=gzip&label=core%20gzip%20size)
![build status](https://github.com/kfiku/LoanJS/actions/workflows/node.js.yml/badge.svg)


Super **small** (**~500B**) and **fast** module to calculate loan in js (browser/node.js) for **equal**/**decreasing**/**annuity**/**annuityDue** installments, the **sum of interest**, etc, with TypeScript support

## Getting Started

Install with:

```
npm install loanjs
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
  'annuity'  // loanType: 'annuity' | 'annuityDue' | 'diminishing' | GetNextInstalmentPartFunction
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
LoanJS.Loan(amount, installmentsNumber, interestRate, loanType)

### Arguments
| Argument           | type           | default   | Description
| ------------------ | -------------- | --------- | ------------------
| amount             | number         | *required | full amount of Loan
| installmentsNumber | number         | *required | how many installments will be (in months)
| interestRate       | number         | *required | interest rate in percent (ex. 3.5)
| loanType           | string or fn   | 'annuity' | 'annuity' | 'annuityDue' | 'diminishing' | GetNextInstalmentPartFunction

```ts
interface InstallmentPart {
  capital: number;
  interest: number;
  installment: number;
}

type GetNextInstalmentPartFunction = (
  amount: number,
  installmentsNumber: number,
  interestRateMonth: number,
  capitalSum: number
) => InstallmentPart;
```

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

### typescript example

```ts
import { Loan } from 'loanjs';

const annuityLoan = new Loan(1000, 12, 5, 'annuity');

const annuityDueLoan = new Loan(1000, 12, 5, 'annuityDue');

const diminishingLoan = new Loan(1000, 12, 5, 'diminishing');

const customInstalmentLoan = new Loan(1000, 12, 5, getNext10Instalment);
function getNext10Instalment (amount: number, installmentsNumber: number, capitalSum: number, interestRateMonth: number) {
  const capital = rnd(amount / installmentsNumber);
  const interest = 10;
  const installment = capital + interest;

  return { capital, interest, installment };
}
```

### nodejs example

```js
import { Loan } from 'loanjs';
// or
const { Loan } = require('loanjs');

const loan_1 = new Loan(1000, 12, 5, 'diminishing');
// loan on 1 000($) in 12 loanType installments (ex. months) with 5% interest rate

const loan_2 = new Loan(500000, 360, 3.5, 'annuity');
// loan on 500 000($) in 360 equal installments (30 years) with 3.5% interest rate
```

### Browser example:
> You can also render loan as html table

```html
<script src="../../dist/loan.js"></script>
<script src="../../dist/loanToHtmlTable.js"></script>
<script>
    const loan = new LoanJS.Loan(1000, 12, 5, 'annuity');

    const div = document.createElement("div");
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

#### 2023-06-23 v1.1.0
 * add `annuityDue` interest rate loan type
 * changing the fourth argument `diminishing` to `loanType` (`annuity` | `diminishing` | `annuityDue`), with backward compatibility (false == 'annuity', true == 'diminishing')
 * refactor getNextInstalment to be open for extensions
 * add option to provide function to loanType to customize instalments counting

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
