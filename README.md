#  [![Build Status](https://secure.travis-ci.org/kfiku/LoanJS.png?branch=master)](https://travis-ci.org/kfiku/LoanJS)

> Calculate loan in js (browser/node.js) for equal installments, installments decreasing, the sum of interest, etc.


## Getting Started

Install the module with: `npm install loanjs`

```js
var Loan = require('loanjs');
var loan = new Loan(1000, // amount
                    12,   // installments number
                    5,    // interest rate
                    true  // diminishin
                    ); 
// returns
{ 
  installments  : [
    {
      capital : number,
      intrest : number,
      sum     : number
    }
  ],
  amount        : number,
  interestSum   : number,
  capitalSum    : number,
  sum           : number
}
```


```sh
# creates a browser.js
$ grunt browserify
```



## Documentation

Loan(amount, installmentsNumber, interestRate, diminishing)

### Arguments
| Argument           | type   | default   | Description
| ------------------ | ------ | --------- | ------------------
| amount             | number | *required | full amount of Loan
| installmentsNumber | number | *required | how meny installments will be
| interestRate       | number | *required | interest rate in percent (ex. 3.5)
| diminishing        | bool   | false     | if installments will be - true: diminishing; false: equal/annuity

### Returns
```js
{ 
  installments  : [
    {
      capital     : number,
      intrest     : number,
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

var Loan = require('loanjs');

var loan_1 = new Loan(1000, 12, 5, true);
// loan on 1 000($) in 12 diminishing installments (ex. months) with 5% interest rate

var loan_2 = new Loan(500000, 360, 3.5);
// loan on 500 000($) in 360 equal installments (30 years) with 3.5% interest rate

```

Browser example:
```html
<script src="../../lib/loan.js"></script>
<script>
    var loan = new Loan(1000, 12, 5, true);
</script>
```

more examples [here](https://github.com/kfiku/LoanJS/tree/master/example)

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 Grzegorz Klimek  
Licensed under the MIT license.
