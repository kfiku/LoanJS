/**
 * @type {import("../types").LoanToHtmlTableFunction}
 */
function loanToHtmlTable (loan, params = {}) {
  params.formatMoney = params.formatMoney || function (num) {
    return num.toFixed(2)
  }
  const fm = params.formatMoney

  /** @param {string} key */
  const trans = function (key) {
    return params?.translations?.[key] || key
  }
  const html = [
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
      '</thead>' +
      '<tbody>',
    '', // body content [1]
    '</tbody>' +
    '</table>'
  ]

  for (let i = 0; i < loan.installments.length; i++) {
    const inst = loan.installments[i]
    const instHtml =
          '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + fm(inst.capital) + '</td>' +
            '<td>' + fm(inst.interest) + '</td>' +
            '<td>' + fm(inst.installment) + '</td>' +
            '<td>' + fm(inst.remain) + '</td>' +
            '<td>' + fm(inst.interestSum) + '</td>' +
          '</tr>'
    html[1] += instHtml
  }

  html[1] +=
    '<tr>' +
      '<td>' + trans('sum') + '</td>' +
      '<td>' + fm(loan.capitalSum) + '</td>' +
      '<td>' + fm(loan.interestSum) + '</td>' +
      '<td>' + fm(loan.sum) + '</td>' +
      '<td>-</td>' +
      '<td>-</td>' +
    '</tr>'

  return html.join('')
}

/* istanbul ignore next */
if (typeof window !== 'undefined') {
  /** @type {any} */
  const localWindow = window
  if (!localWindow.LoanJS) {
    localWindow.LoanJS = {}
  }
  localWindow.LoanJS.loanToHtmlTable = loanToHtmlTable
}

export default loanToHtmlTable
