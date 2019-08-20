var logger = require('../log');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "USERNAME";
    options.password = "PASSWORD";
    options.clientId = 'DEVELOPERKEY';
    options.clientSecret = 'DEVELOPERSECRET';
    return options;
};

module.exports.main = function (ffCollection, vvClient, response) {
    /*Script Name:   LibFormCityInformationLookup
     Customer:      VisualVault
     Purpose:       The purpose of this process is acquire city, state and county information based on zip code.  
     Parameter:     Zip Code
     Response:      [0] - Success or Error
                    [1] - Message
                    [2] - Address information object
     Psuedo code: 
                1. API call to www.zip-codes.com to lookup city, state and county information.
     Date of Dev:   05/14/2019
     Last Rev Date: 
     Revision Notes:
     05/14/2019 - Jason Hatch: Script created
     08/20/2019 - Jason Hatch: Updated to capture error if zipcode not found.
     */

    logger.info('Start of the process LibFormCityInformationLookup at ' + Date());

    var outputArray = [];
    //Create variables for the values the user inputs
    var zipCode = ffCollection.getFormFieldByName('ZipCode').value;

    const request = require('request');

    request('https://api.zip-codes.com/ZipCodesAPI.svc/1.0/GetZipCodeDetails/' + zipCode + '?key=IAOS9DUCUA87IRKX87WB', { json: true }, (err, res, body) => {
    //request('https://api.zip-codes.com/ZipCodesAPI.svc/1.0/GetZipCodeDetails/' + zipCode + '?key=DEMOAPIKEY', { json: true }, (err, res, body) => {

        if (err) {
            //Error occurred
            outputArray[0] = 'Error';
            outputArray[1] = 'Error Occurred of ' + err;
            response.json(200, outputArray);
        }
        else {
            if (body.hasOwnProperty('Error')) {
                //Error occurred
                outputArray[0] = 'Error';
                outputArray[1] = 'Error Occurred of ' + body.Error;
                response.json(200, outputArray);
            }
            else {
                var cityResult = JSON.parse(body.trim());
                if (cityResult.item != 'undefined' && cityResult.Error != 'ZIP Code Not Found') {
                    var cityObj = {};
                    cityObj.City = cityResult.item.PreferredLastLineName;
                    cityObj.State = cityResult.item.State;
                    cityObj.County = cityResult.item.CountyName;

                    outputArray[0] = 'Success';
                    outputArray[1] = 'Information acquired';
                    outputArray[2] = cityObj;
                    response.json(200, outputArray);
                }
                else if (cityResult.Error != 'ZIP Code Not Found') {
                    outputArray[0] = 'Error';
                    outputArray[1] = 'Zip code not found.';
                    response.json(200, outputArray);
                }
                else {
                    outputArray[0] = 'Error';
                    outputArray[1] = 'Unhandled error from acquiring city information';
                    response.json(200, outputArray);
                }
            }
        }
    });
}
