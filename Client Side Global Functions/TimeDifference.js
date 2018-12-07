//TimeDifference global function

//Pass in the following variables:  startTime, stopTime, startDate, stopDate, returnUnit
//Time variables need to be in the format of 11:00 AM
//Date variables need to be a valid date string.  
//returnUnit needs to be Seconds or Hours, otherwise it will return milliseconds.

if (startDate == null || stopDate == null || startTime == null || stopTime == null || startDate == '' || stopDate == '' || startTime == '' || stopTime == '') {
    return 'Invalid Parameters';
}

var dateStart = new Date(startDate);
var dateEnd = new Date(stopDate);

//Need to replace a special character inserted into the date object by IE in order to process on both IE 11 and other browsers.
var startString = dateStart.toLocaleDateString().replace(/\u200E/g, '') + ", " + startTime;
var endString = dateEnd.toLocaleDateString().replace(/\u200E/g, '') + ", " + stopTime;

var timeStart = new Date(startString);
var timeEnd = new Date(endString);

//The following 2 formats were tested and worked in IE 11.  Formatting to the first format above.
//var timeStart = new Date('12/7/2018, 8:32:42 AM');
//var timeEnd = new Date('12/7/2018, 8:45:42 AM');

//var timeStart = new Date('2018-12-07T15:46:59.948Z');
//var timeEnd = new Date('2018-12-07T15:56:59.948Z');

var difference = timeEnd.getTime() - timeStart.getTime();

if (returnUnit == 'Seconds') {
    var valRet = Math.floor((difference / 1000 / 60) << 0);
}
else if (returnUnit == 'Hours') {
    //var valRet = Math.floor((difference / 1000 / 60 / 60) << 0);\
    var valRet = (difference / 1000 / 60 / 60);
}
else {
    valRet = difference;
}

return valRet.toFixed(2);
