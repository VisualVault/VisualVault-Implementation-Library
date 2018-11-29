var vvEntities = require("../VVRestApi");
var logger = require('../log');

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
    /*Script Name:   LibSiteEmailLookup
     Customer:      VisualVault Library Function
     Purpose:       Get a list User IDs, First Name, Last Name and Email addresses for all users who are in a VisualVault Location.
                    Commonly used to get list of all email addresses for a provider.
     Parameters:    The following represent variables passed into the function:
                    Site ID = the id of the service provider used to lookup the VisualVault Location.

     Process PseudoCode:
                    1. Get the Site for the Site ID passed in.
                    2. Get list of users for that site.  Not discriminating between enabled or disabled users.
                    3. Load users into an object and return to the calling function.

     Return Array:  The following represents the array of information returned to the calling function. This is a standardized response. Any item in the array at points 2 or above can be used to return multiple items of information.
                    0 - Status: Success, Failure
		            1 - Message
                    2 - Array of User Objects

     Date of Dev:   02/16/2018
     Last Rev Date: 03/09/2018
     Revision Notes:
     02/16/2018 - Jason Hatch: Initial creation of the business process.
     03/09/2018 - Jason Hatch: Added mechanism to get the usid from the users.
     */

    logger.info('Start of the process LibSiteEmailLookup at ' + Date());

    var outputCollection = [];

    var siteID = ffCollection.getFormFieldByName('Site ID');
    var SiteInfo = '';

    var sitedata = {};
    sitedata.q = "name eq '" + siteID.value + "'";
    sitedata.fields = 'id,name';

    vvClient.sites.getSites(sitedata).then(function (siteResp) {
        var siteData = JSON.parse(siteResp);
        if (siteData.meta.status == '200' && siteData.data.length > 0) {
            logger.info('Site found for ' + siteID.value);
            SiteInfo = siteData.data[0].id;
        }
        else {
            logger.info('Site Not found for ' + siteID.value);
            outputCollection[0] = 'No Site';
            outputCollection[1] = 'A site was not found where the user could be created.';
            throw new Error();
        }

        var userParams = {};
        return vvClient.users.getUsers(userParams, SiteInfo);
    }).then(function (userResp) {
        var userRespData = JSON.parse(userResp);
        if (userRespData.meta.status == '200' && userRespData.data.length > 0) {
            var emailList = [];
            for (var a = 0; a < userRespData.data.length; a++) {
                var userObj = {};
                userObj.userid = userRespData.data[a]['userid'];
                userObj.firstname = userRespData.data[a]['firstName'];
                userObj.lastname = userRespData.data[a]['lastName'];
                userObj.email = userRespData.data[a]['emailAddress'];
                userObj.enabled = userRespData.data[a]['enabled'];
                userObj.siteid = userRespData.data[a]['siteId'];
                userObj.usid = userRespData.data[a]['id']
                emailList.push(userObj);
            }
            outputCollection[0] = 'Emails Found';
            outputCollection[1] = 'List of Emails Found and Returned.';
            outputCollection[2] = emailList;
            return response.json(200, outputCollection);
        }
        else {
            outputCollection[0] = 'No Email';
            outputCollection[1] = 'No Emails found for this site.';
            throw new Error();
        }


    }).catch(function (err) {
        if (!outputCollection[0]) {
            var errorMessage = '';
            if (err.message) {
                logger.info("Error: " + err.message);
                errorMessage = "Error: " + err.message;
            } else {
                logger.info("Error: " + err);
                errorMessage = "Error: " + err;
            }
            outputCollection[0] = 'Error';
            outputCollection[1] = errorMessage;
            return response.json(200, outputCollection);
        }
        else {
            return response.json(200, outputCollection);
        }


    });

}   
