str = str.toLowerCase();
var formattedString = str.replace(/[a-z]/i, function (letter) { return letter.toUpperCase(); });
return formattedString;
