/*
	Script Name:   FormatTime
	Customer:      VisualVault
	Purpose:       The purpose of this function is to take a time string entered in any format and format it into a standard of HH:MM AM or HH:MM PM.
	Parameters:    The following represent variables passed into the function:
				   -timeEntered: string value that represents the time
				  
	Return Value:  The following represents the value being returned from this function:
                   -timeEntered: string value (In case format is not applyable)
                   -timeString: string value   (In case format is applyable)
    
	Date of Dev: 12/07/2018
	Last Rev Date: 06/22/2022
	Revision Notes:
				12/07/2018 - Jason Hatch: Initial creation of the logic
				06/22/2022 - Franco Petosa Ayala: Update to ES6 and better handling.
*/

//verify the string contains "AM/PM/:"
let timeString = (timeEntered.toString()).toUpperCase();
let isAM = timeString.includes("AM");
let isPM = timeString.includes("PM");

const isColon = timeString.includes(":");

//build the string array based on the timeString digits
let stringArr = timeString.split("")
stringArr = stringArr.filter(digit => {
  if(!isNaN(digit) && digit != " "){
    return true
  }else if(digit == ":"){
     return true
  }else{
    return false
  }
})

//verify is not an empty array
if(stringArr.length === 0){
    return timeEntered
}

//build the string time only with time logical simbols: numbers and ":"
timeString = stringArr.join("")

let hour = '';
let minutes = '';
  
if(isColon){ // expected passed parameter value: HH:MM

    hour = timeString.split(":")[0]; //catch hour digits
    minutes = timeString.split(":")[1]; //catch minutes digits

}else if(timeString.length === 4){ // expected passed parameter value: HHMM
  
    //verify is valid military time format HHMM
    if(parseFloat(timeString) > 2400){
        return timeEntered
    }
  
    //In military time format the 2 first digit corresponds to the hour and the other last 2 to the minutes
    hour = timeString[0] + timeString[1] ; //catch hour digits
    minutes = timeString[2] + timeString[3]; //catch minutes digits
  
}else if(timeString.length === 3){ // expected passed parameter value: HMM

    //In military time format the first digit corresponds to the hour and the other last 2 to the minutes
    hour = '0' + timeString[0] ; //catch hour digits
    minutes = timeString[1] + timeString[2]; //catch minutes digits

}else if(isAM || isPM){ // expected timeString value: HH

    hour = timeString;
    minutes = '00';

}else{
    //In this case it is assumed that the timeEntered value is not a valid string time
    return timeEntered
}

//verify is valid hour and minute format HH / MM
if(hour === "" || minutes === ""){
    return timeEntered
}else if(hour.length > 2 || minutes.length > 2){
    return timeEntered
}

//if includes AM or PM the hour must be between 1 and 12
if(isAM || isPM){
    if(parseFloat(hour) <= 0 || parseFloat(hour) > 12){
        return timeEntered
    }
} 

//verify the hour has a logical value between 0 and 23
if(parseFloat(hour) >= 24){
    return timeEntered
}
  
//verify the minutes have a logical value between 0 and 59
if(parseFloat(minutes) >= 60){
    return timeEntered
}
  
//build the string time formated

//if AM/PM is missing it can still be assumed by the hour
if(!isAM && !isPM && parseFloat(hour) < 12){
    isAM = true;
}else if(!isAM && !isPM && parseFloat(hour) >= 12){
    isPM = true;
}
  
//format hour to HH
if(parseFloat(hour) === 0){
    hour = '12'
}else if(parseFloat(hour) < 10){
    hour = `0${parseFloat(hour)}`;
}else if(parseFloat(hour) > 12 && parseFloat(hour) < 22){
    hour = `0${parseFloat(hour)-12}`;
}else if(parseFloat(hour) >= 22){
    hour = `${parseFloat(hour)-12}`;
}

//format minutes to MM
if(parseFloat(minutes) < 10){
    minutes = `0${parseFloat(minutes)}`;
}else if(minutes === undefined){
    minutes = `00`;
}
  
//concat AM or PM to timeString 
if(isAM){
    timeString = `${hour}:${minutes} AM`
}else if(isPM){
    timeString = `${hour}:${minutes} PM`
}

return timeString

