export interface Installment {
  capital: number;
  interest: number;
  installment: number;
  remain: number;
  interestSum: number;
}

export interface LoanInstance {
  installments: Installment[];
  amount: number;
  interestSum: number;
  capitalSum: number;
  sum: number;
}

export type GetNextInstalmentFunction = (
  amount: number,
  installmentsNumber: number,
  interestRate: number,
  loanType: LoanType,
  capitalSum: number,
  interestSum: number
) => Installment;

export interface InstallmentPart {
  capital: number;
  interest: number;
  installment: number;
}

export type GetNextInstalmentPartFunction = (
  amount: number,
  installmentsNumber: number,
  interestRateMonth: number,
  capitalSum: number
) => InstallmentPart;

export type LoanType = 'annuity' | 'annuityDue' | 'diminishing' | GetNextInstalmentPartFunction

export type LoanFunction = (
  amount: number,
  installmentsNumber: number,
  interestRate: number,
  loanType: LoanType | false | true = 'annuity'
) => LoanInstance;

/**
 * Create Loan Instance with all installments and sum of interest
 *
 * @param {number}  amount              full amount of Loan
 * @param {number}  installmentsNumber  how many installments will be
 * @param {number}  interestRate        interest rate in percent (3.5) equal/annuity (false)
 * @param {boolean} diminishing         if installments will be diminishing (true) or not
 */
export const Loan: LoanFunction

export interface LoanToHtmlTableParams {
  formatMoney?: (num: number) => string;
  translations?: Record<string, string>;
}

export type LoanToHtmlTableFunction = (
  loan: LoanInstance,
  params: LoanToHtmlTableParams = {}
) => string

/**
 * Create Loan Object with all installments and sum of interest
 * @param {LoanInstance}           loan     loan instance object
 * @param {LoanToHtmlTableParams}  params   params
 *
 * @return {string} html string with the table
 */
export const loanToHtmlTable: LoanToHtmlTableFunction


