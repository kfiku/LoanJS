const numeral = require('numeral');
let format = {
  pl: '0,0.00 $',
  en: '$0,0.00'
};

numeral.language('pl', {
    delimiters: {
        thousands: ' ',
        decimal: ','
    },
    currency: {
        symbol: 'zł'
    }
});

// switch between languages
numeral.language(window['lang']);

let money = function (n) {
    return numeral(n).format(format[window['lang']]);
};

export = money;
