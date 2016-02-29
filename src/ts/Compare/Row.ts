/// <reference path="../../../typings/tsd.d.ts" />
import { EventEmitter } from 'events';
let tpl =  require('../../tpl/tableRow.tpl');
let Loan =  require('loanjs').Loan;

export class CompareRow extends EventEmitter {
  el;
  amount: HTMLInputElement;
  quantity: HTMLInputElement;
  interest: HTMLInputElement;

  equalInterestSum: HTMLSpanElement;
  equalInstallmentAmount: HTMLSpanElement;

  diminishingInterestsSum: HTMLSpanElement;
  diminishingFirstInstallmentAmount: HTMLSpanElement;
  diminishingLastInstallmentAmount: HTMLSpanElement;

  removeBtn: HTMLButtonElement;

  constructor(public data) {
    super();

    this.render();
  }

  render() {
    if(!this.el) {
      this.el = document.createElement('tr');
      this.el.innerHTML = tpl({data: this.data});

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
      this.removeBtn.addEventListener('click', () => this.onRemove());
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
    this.equalInterestSum.innerHTML                  = this.data.equalInterestSum;
    this.equalInstallmentAmount.innerHTML            = this.data.equalInstallmentAmount;

    this.diminishingInterestsSum.innerHTML           = this.data.diminishingInterestsSum;
    this.diminishingFirstInstallmentAmount.innerHTML = this.data.diminishingFirstInstallmentAmount;
    this.diminishingLastInstallmentAmount.innerHTML  = this.data.diminishingLastInstallmentAmount;


    return this;
  }

  listenField (field: HTMLInputElement) {
    field.addEventListener('keyup', (e) => this.onFieldChange(e));
    field.addEventListener('change', (e) => this.onFieldChange(e));
  }

  onFieldChange (e) {
    // console.log(e.keyCode);

    // KEYBOARD EVENT  NUMPAD                                   NUMB ERS                               BACKSPACE
    if(e.keyCode && !((e.keyCode >= 96 && e.keyCode <= 105) || (e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode === 8)) {
      return;
    }

    e.target.value = this.data[e.target.className] = parseFloat(e.target.value.replace(',', '.')) || 0;

    this.render();
    this.emit('change');
  }

  onRemove() {
    console.log(this.el);
    this.el.parentNode.removeChild(this.el);
    this.emit('remove');
  }
};
