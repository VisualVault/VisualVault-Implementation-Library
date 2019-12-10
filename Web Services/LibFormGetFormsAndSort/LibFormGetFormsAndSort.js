var logger = require('../log');
var Q = require('q');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "USERID";
    options.password = "PASSWORD";
    options.clientId = "DEVELOPERKEY";
    options.clientSecret = "DEVELOPERSECRET";
    return options;
};


module.exports.main = function (ffCollection, vvClient, response) {
    /*
     Script Name:   LibFormGetFormsAndSort
     Customer:      VisualVault Library Function
     Purpose:       The purpose of this script is to grab a group of form records and sort them by one or two columns.
     Parameters:
                    1. Form Name - (string, Required) the template ID of the form to get
                    2. Query - (string, Required) String that contains the query for the getForms call
                    3. Sort Columns - (array, Required) An array of columns to be sorted on (can pass in 1 or 2 columns). If 2 columns passed in, array will be sorted by the first column and then by the second. The strings in the array should start with a lower case letter. ex. ['dispensary ID', 'card Expire Record']
     Psuedo code:   
                    1. Call getForms() to grab a specific set of forms. Query passed in by user.
                    2. Sort the array of form objects by the passed in user columns (by one or two columns).
                    3. Send back the new sorted array to the client/user.
     Date of Dev:   03/07/2019
     Last Rev Date: 12/10/2019

     Revision Notes:
     03/08/2019 - Alex Rhee: Initial creation of the business process.
     12/10/2019 - Kendra Austin: Update header info. 
    */

    logger.info('Start of the process LibFormGetFormsAndSort at ' + Date());

    try {
        //Variables that will be passed in by the user
        var FormName = ffCollection.getFormFieldByName('Form Name').value;
        var ColumnsArray = ffCollection.getFormFieldByName('Sort Columns').value;
        var QueryVar = ffCollection.getFormFieldByName('Query').value;

        //Config variables
        var errorArray = [];                                                                   //Array to hold all errors encountered with sending emails
        var sortedArray = [];                                                                  //Array to hold the sorted results

        //Uncomment below to test the script directly, otherwise these values will be passed in by the user/client
        // // Test variables
        // var FormTemplateID = 'Dispensary Personnel Application';                                                        //Form template ID
        // var sortColumns = ['card Expire Date']                                                        //Array that holds the columns to sort on
        // var formQueryObj = {};                                                                 //Query object for the getForms() call
        // formQueryObj.q = "[Card Expire Date] IS NOT NULL";
        // // formQueryObj.q = "[Last Name] eq '" + LastName + "' AND [First Name] eq '" + FirstName + "' AND [Status] eq 'Approved' AND [DOB] eq '" + BirthDate + "'";
        // formQueryObj.expand = true;

        //Set up the getForms call with the passed in data
        var FormTemplateID = FormName;                                                          //Form template ID
        var sortColumns = ColumnsArray                                                          //Array that holds the columns to sort on
        var formQueryObj = {};                                                                  //Query object for the getForms() call
        formQueryObj.q = QueryVar;
        formQueryObj.expand = true;


        //Initialization of the return object
        var outputCollection = [];

        Q
            .allSettled(
            [
                vvClient.forms.getForms(formQueryObj, FormTemplateID)
            ]
            )
            .then(
            function (promises) {
                if (promises[0].state == 'fulfilled') {
                    //Variable that holds the results of the getForms() call
                    var promise = JSON.parse(promises[0].value);
                    //Measure the response of the promise getForms() call
                    if (promise.meta.status == 200) {

                        //If only one columns passed in, sort on only one field
                        if (sortColumns.length == 1) {
                            console.log('One column')
                            sortedArray = promise.data.sort(function (a, b) {
                                console.log(b[sortColumns[0]]);
                                var textB = a[sortColumns[0]];
                                var textA = b[sortColumns[0]];
                                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                            })

                            outputCollection[0] = 'Success';
                            outputCollection[1] = sortedArray;
                            console.log(outputCollection)
                            response.json(200, outputCollection);
                        }
                        //If two colummns passed in, sort on both columns starting with the first column
                        else if (sortColumns.length == 2) {
                            console.log('Two columns')
                            //Function to sort on multiple columns
                            function fieldSorter(fields) {
                                return function (a, b) {
                                    return fields
                                        .map(function (o) {
                                            var dir = 1;
                                            if (o[0] === '-') {
                                                dir = -1;
                                                o = o.substring(1);
                                            }
                                            if (a[o] > b[o]) return dir;
                                            if (a[o] < b[o]) return -(dir);
                                            return 0;
                                        })
                                        .reduce(function firstNonZeroValue(p, n) {
                                            return p ? p : n;
                                        }, 0);
                                };
                            }
                            //Load the sorted data into a new array
                            sortedArray = promise.data.sort(fieldSorter(sortColumns));
                            outputCollection[0] = 'Success';
                            outputCollection[1] = sortedArray;
                            console.log(outputCollection)
                            response.json(200, outputCollection);
                        }
                    }
                    else {
                        throw new Error('Attempt to retrieve form history encountered an error.');
                    }
                }
            }
            )
    }
    catch (exception) {
        //Error catching, will send the user the error message
        logger.info(exception);
        console.log(exception);
        outputCollection[0] = 'Error';
        outputCollection.push(exception.message + ". ");
        response.json(200, outputCollection);
        return false;
    }
};
