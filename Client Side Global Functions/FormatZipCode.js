/*
	Script Name:   FormatZipCode
	Customer:      VisualVault
	Purpose:       The purpose of this function is to take a US Zip Code entered in any format and format it into a standard of either ##### or #####-#### (zip + 4). 
	Parameters:    The following represent variables passed into the function:
				          -zipEntered: string value that represents the US Zip Code
				  
	Return Value:  The following represents the value being returned from this function:
                  -zipEntered: string value (In case format is not applyable)
                  -formattedZip: string value   (In case format is applyable)
    
	Date of Dev: unknown
	Last Rev Date: 07/11/2022
	Revision Notes:
        unknown - unknown: Initial creation of the business process.
				07/11/2022 - Franco Petosa Ayala: update to ES6.
*/

// initialize in false value
let notValid = false;

let stringArr = (zipEntered.toString()).split("");

//build the string array based only on number digits
stringArr = stringArr.filter(digit => {
  if(!isNaN(digit) && digit != " "){
    return true
  }else if(digit === '-'){
    return false
  }else{
    //if the US Zip Code contains a digit that is not neither a number nor a hyphen it means is not valid 
    notValid = true;
    return false
  }
})

//verify the passed US Zip Code is valid
if(notValid){
  return zipEntered
}else if(stringArr.length !== 5 && stringArr.length !== 9){
  return zipEntered
}

//if is a comepleted US Zip Code of 9 valid digits, add the hyphen right after the first five digits
if (stringArr.length === 9) {  
  stringArr.splice(5,0,"-")
}

//build-up the string formattedZip
const formattedZip = stringArr.join("");

return formattedZip