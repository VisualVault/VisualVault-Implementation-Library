/*
    Script Name:   CaseTitleChange
    Customer:      VisualVault
    Purpose:       This function formats the output string to lowercase and uppercase only on:
                        -The first character of the string.
                        -The first character after a whitespace or hyphen. 
                   e.g: 'JOHN-DOE' --> John-Doe
                        'JOHN DOE' --> John Doe
                        'john-doe' --> John-Doe
                        'john - doe' --> John-Doe
                        'john   -doe' --> John-Doe
    Parameters:    The following represent variables passed into the function:  
                   -str: string value (required)
    Return Value:  The following represents the value being returned from this function:
                    -newStr: string value formatted
    Date of Dev: 05/20/2022
    Last Rev Date: 05/20/2022
    Revision Notes:
    05/20/2022 - Franco Petosa Ayala: Initial creation of the business process.
    05/20/2022 - Franco Petosa Ayala: Update to ES6.
*/

let newStr = str.trim().toLowerCase(); //deletes white spaces and lowercases every character
let strArr = []; //will contain each word of the str string as an item
const hyphenIncluded = str.includes('-'); //verify if there is an hyphen included in the passed string

//build up the str array e.g: [john,doe]
if(hyphenIncluded){
    strArr = newStr.split('-');
}else {
    strArr = newStr.split(' ');
}

//uppercase the first character of each word, except for white spaces 
const newStrArr = strArr.map( word => {
    const cleanWord = word.trim(); //in case there is an internal white space e.g: ' doe'
    if( cleanWord != '') {
        const letterUpperCased = cleanWord[0].toUpperCase(); //uppercases the first character
        const newWord = letterUpperCased + cleanWord.substring(1); //concats uppercased first character with the rest of the word
        return newWord
    }
})

//build the new formated string
if(hyphenIncluded){
    newStr = newStrArr.join('-'); // e.g: John-Doe
}else {
    newStr = newStrArr.join(' '); // e.g: John Doe
}

// returns the formated string to the global function 
return newStr