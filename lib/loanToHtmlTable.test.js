/* eslint-env jest */
import Loan from './loan'
import loanToHtmlTable from './loanToHtmlTable'
import rnd from './rnd'

test('loanToHtmlTable should generate proper html', () => {
  const loan = Loan(2000, 5, 5, false)

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(5)
  expect(loan.installments[0].installment).toBe(405.01)
  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)

  const table = loanToHtmlTable(loan)

  expect(table).toBe(
    '<table>' +
      '<thead>' +
        '<tr>' +
          '<th></th>' +
          '<th>Capital</th>' +
          '<th>Interest</th>' +
          '<th>Instalment</th>' +
          '<th>Remain</th>' +
          '<th>Interest sum</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        '<tr>' +
          '<td>1</td>' +
          '<td>396.68</td>' +
          '<td>8.33</td>' +
          '<td>405.01</td>' +
          '<td>1603.32</td>' +
          '<td>8.33</td>' +
        '</tr>' +
        '<tr>' +
          '<td>2</td>' +
          '<td>398.33</td>' +
          '<td>6.68</td>' +
          '<td>405.01</td>' +
          '<td>1204.99</td>' +
          '<td>15.01</td>' +
        '</tr>' +
        '<tr>' +
          '<td>3</td>' +
          '<td>399.99</td>' +
          '<td>5.02</td>' +
          '<td>405.01</td>' +
          '<td>805.00</td>' +
          '<td>20.03</td>' +
        '</tr>' +
        '<tr>' +
          '<td>4</td>' +
          '<td>401.66</td>' +
          '<td>3.35</td>' +
          '<td>405.01</td>' +
          '<td>403.34</td>' +
          '<td>23.38</td>' +
        '</tr>' +
        '<tr>' +
          '<td>5</td>' +
          '<td>403.33</td>' +
          '<td>1.68</td>' +
          '<td>405.01</td>' +
          '<td>0.00</td>' +
          '<td>25.06</td>' +
        '</tr>' +
        '<tr>' +
          '<td>sum</td>' +
          '<td>2000.00</td>' +
          '<td>25.06</td>' +
          '<td>2025.06</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
        '</tr>' +
      '</tbody>' +
    '</table>'
  )
})

test('loan js should count loan with equal instalment', () => {
  const loan = Loan(2000, 1, 5, false)

  expect(loan).toBeDefined()
  expect(loan.installments.length).toBe(1)
  expect(loan.installments[0].installment).toBe(2008.33)
  expect(rnd(loan.capitalSum + loan.interestSum)).toBe(loan.sum)

  const table = loanToHtmlTable(loan, {
    translations: {
      Capital: 'Kapitał',
      Interest: 'Odsetki',
      Instalment: 'Rata',
      Remain: 'Pozostało',
      'Interest sum': 'Suma odsetek',
      sum: 'suma'
    },
    formatMoney: m => m.toFixed(2) + ' zł'
  })

  expect(table).toBe(
    '<table>' +
      '<thead>' +
        '<tr>' +
          '<th></th>' +
          '<th>Kapitał</th>' +
          '<th>Odsetki</th>' +
          '<th>Rata</th>' +
          '<th>Pozostało</th>' +
          '<th>Suma odsetek</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        '<tr><td>1</td><td>2000.00 zł</td><td>8.33 zł</td><td>2008.33 zł</td><td>0.00 zł</td><td>8.33 zł</td></tr>' +
        '<tr><td>suma</td><td>2000.00 zł</td><td>8.33 zł</td><td>2008.33 zł</td><td>-</td><td>-</td></tr>' +
      '</tbody>' +
    '</table>'
  )
})
