/*
	Script Name:   FormatCurrency
	Customer:      VisualVault
	Purpose:       The purpose of this function is to format any currency passed as a parameter to: x.xx
	Parameters:    The following represent variables passed into the function:
				   -Currency: string value that represents the currency number
                   e.g: '4.2267'
				  
	Return Value:  The following represents the value being returned from this function:
                   currency: string value		
				   or
				   formatedCurrency: string value

	Date of Dev: 01/07/2020
	Last Rev Date: 06/21/2022
	Revision Notes:
				01/07/2020 - Kendra Austin:  Initial creation.
				06/21/2022 - Franco Petosa Ayala: Update to ES6 and better error handling.
*/

let strArr = currency.split(''); // e.g: currency = 5.46 --> strArr = ['5','.','4','6']

// remove from array any not number caracter, except for '.'
strArr = strArr.map(digit => {
  if(!isNaN(digit) || digit == '.'){
    return digit
  }else{
    return ''
  }
})

// build up the string removing white spaces in case they are present
let formatedCurrency = strArr.join('').trim()

// verify the string can be converted to type number
if(!isNaN(formatedCurrency) && formatedCurrency != ''){

	// convert the string to number and apply the format x.xx
   formatedCurrency = parseFloat(formatedCurrency).toFixed(2)
   return formatedCurrency

}else{
	//as the passed value can not be formated it is returned unmodified
	return currency
}
