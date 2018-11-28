/*
    Script Name:   BusinessDaysDifference
    Customer:      VisualVault
    Purpose:       This function takes in 2 dates and calculates the number of calendar days between them.  
    Parameters:    The following represent variables passed into the function:  
                   date1, date2:         date as a string from getfieldvalue.

    Return Value:  The following represents the value being returned from this function:
                        days:  Returns a number that represents the days between 2 dates.        


    Date of Dev:   06/01/2017
    Last Rev Date: 

    Revision Notes:
    06/01/2017 - Jason Hatch: Initial creation of the business process. 

*/



//This function will calculate the number of business days between two dates.
//Get 1 day in milliseconds
var one_day = 1000 * 60 * 60 * 24;

var date1casted = new Date(date1);
var date2casted = new Date(date2);

var a = date1casted.toISOString;
var b = date2casted.toISOString;

// Handle special cases
var startDay = date1casted.getDay();
var endDay = date2casted.getDay();


var days = 0;

if (date1casted.getDate() != date2casted.getDate()) {

    // Convert both dates to milliseconds
    var date1_ms = date1casted.getTime();
    var date2_ms = date2casted.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;

    // Convert back to days and return
    days = Math.round(difference_ms / one_day);

    //Following section handles positive days.
    if (days > 0 || days == 0) {
        var weeks = Math.floor(days / 7);

        days = days - (weeks * 2);

        // Remove weekend not previously removed.   
        if (startDay - endDay > 1)
            days = days - 2;

        if (startDay == 0 && endDay == 6)
            days = days - 1;

        // Remove start day if span starts on Sunday but ends before Saturday
        if (startDay == 0 && endDay != 6)
            days = days - 1

        // Remove end day if span ends on Saturday but starts after Sunday
        if (endDay == 6 && startDay != 0)
            days = days - 1
    }
    else if (days == -1) {  //Handles if weekend days right next to each other were set and it is a negative number.
        if ((startDay == 0 || startDay == 6) && ((endDay == 0 || endDay == 6))) {
            days = 0;
        }
    }
    else {
        days = days * -1;   //Make positive number for good calculation in next step.
        var weeks = Math.floor(days / 7);

        days = days - (weeks * 2);

        days = days * -1;  //Change back to negative as this is a negative number path.

        if (startDay == 0 && endDay == 6) {
            days = days + 1;
        }
        else if (startDay == 0 && endDay == 0) {
            //Do nothing because weeks calculation above already removed 2 days.
        }
        else if (startDay == 0 && endDay != 6) {
            days = days + 1
        }
        else if (startDay == 6 && endDay == 6) {
            //Do nothing because weeks calculation already removed 2 days.
        }
        else if (startDay == 6 && endDay != 0) {
            //days = days + 1
        }
        else if (startDay < endDay && days > -7) {
            days = days + 2;
        }
    }
}
else {
    days = 0;
}

return days;
