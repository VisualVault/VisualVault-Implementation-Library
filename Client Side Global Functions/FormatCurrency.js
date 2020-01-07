//Purpose of function is to take a Currency entered in any format and format it into a standard of X.XX

//parameter: Currency
//Pass in a string that represents the Currency

//Convert string to integer
var s2 = parseFloat(Currency);

if (s2.toFixed(2) == 'NaN') {
    return Currency;
}
else {
    return s2.toFixed(2);
}
