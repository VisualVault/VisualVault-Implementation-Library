/*
    Script Name:    FormatFEIN
    Customer:       VisualVault
    Purpose:        The purpose of this function is to take a FEIN entered in any format and format it into a standard of XX-XXXXXXX
                    
    Parameters:     The following represent variables passed into the function:
                    enteredFEIN - Pass in a string that represents the FEIN.
                   
    Return Value:   The following represents the value being returned from this function:
                    formattedFEIN: Formatted string representing the FEIN.  
                           
    Date of Dev:    06/01/2017
    Last Rev Date:  23/06/2022
    Revision Notes:
                    06/01/2017 - Cesar Perez: Initial creation of the business process. 
                    23/06/2022 - Franco Petosa Ayala: Update to ES6.
*/

//build the string array based only on number digits
let stringArr = (enteredFEIN.toString()).split("");
stringArr = stringArr.filter(digit => {
    if(!isNaN(digit) && digit != " "){
        return true
    }else{
        return false
    }
})

//verify the passed Federal EIN (FEIN) value is valid
if(stringArr.length < 8 || stringArr.length > 9){
    return enteredFEIN
}

//if the passed Federal EIN (FEIN) has 8 digits a 0 must be added at the beginning
if(stringArr.length === 8){
    stringArr.splice(0,0,"0")
}

//add the hyphen after the second digit
stringArr.splice(2,0,"-")

//build the string formattedFEIN
let formattedFEIN = stringArr.join("")

return formattedFEIN