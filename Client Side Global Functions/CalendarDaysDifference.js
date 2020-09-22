//Passed in parameters: date1, date2 
//return is the days difference number

// Set two dates to two variables
var newDate1 = new Date(date1);
var newDate2 = new Date(date2);

//Calculate the time difference of passed in dates 
var Difference_In_Time = newDate2.getTime() - newDate1.getTime();

// Calculate the number of days between passed in dates 
var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

return Difference_In_Days;
