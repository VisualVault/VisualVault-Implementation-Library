/* 
    CaseTitleChange global script
    Params: str (String, Required)
    Purpose: The purpose of this function is to format the string to have every word
                    be uppercase. (i.e. JOHN SMITH will become John Smith; JOHN-SMITH will become John-Smith)
    03/17/2020 - Updated code to include hyphens (-) as a delimiter.
*/

str = str.toLowerCase();
var hyphenIncluded = false;

if (str.indexOf('-') > 0){
    hyphenIncluded = true;
}

if(hyphenIncluded){
    var str_arr = str.split('-');
    var formatted_arr = [];
    str_arr.forEach(function(item){
        formatted_arr.push(item.replace(/[a-z]/i, function (letter) { return letter.toUpperCase(); }))
    });

    str = formatted_arr.join('-');
}

var str_arr = str.split(' ');
var formatted_arr = [];
str_arr.forEach(function(item){
    formatted_arr.push(item.replace(/[a-z]/i, function (letter) { return letter.toUpperCase(); }))
});

var formattedString = formatted_arr.join(' '); 
return formattedString;
