/// <reference path="../../../typings/tsd.d.ts" />
let tpl =  require('../../tpl/tableRow.tpl');
let Loan =  require('loanjs').Loan;

export class CompareRow {
  el;
  amount;
  quantity;
  interest;

  constructor(public data) {
    this.render();

    this.amount = this.el.querySelector('#creditAmount');
    this.quantity = this.el.querySelector('#installmentsQuantity');
    this.interest = this.el.querySelector('#interest');

    this.amount.value
    this.quantity.value
    this.interest.value
  }

  render() {
    if(!this.el) {
      this.el = document.createElement('tr');
    } else {

    }

    let equalLoan = new Loan(this.data.amount, this.data.quantity, this.data.interest);
    let diminishingLoan = new Loan(this.data.amount, this.data.quantity, this.data.interest, true);

    this.data.equalInterestSum = equalLoan.interestSum;
    this.data.equalInstallmentAmount = equalLoan.installments[0].installment;

    this.data.diminishingInterestsSum = diminishingLoan.interestSum;
    this.data.diminishingFirstInstallmentAmount = diminishingLoan.installments[0].installment;
    this.data.diminishingLastInstallmentAmount = diminishingLoan.installments[diminishingLoan.installments.length - 1].installment;

    this.el.innerHTML = tpl({data: this.data});

    return this;
  }
};
