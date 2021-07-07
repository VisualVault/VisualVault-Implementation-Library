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

module.exports.main = async function (ffCollection, vvClient, response) {
    /*Script Name:   LibSiteEmailLookup
   Customer:      VisualVault Library Function
   Purpose:       Get a list User IDs, First Name, Last Name and Email addresses for all users who are in a VisualVault Location.
                  Commonly used to get list of all email addresses for a provider.
   Parameters:    The following represent variables passed into the function:
                  Site ID = (string, Required) the id of the service provider used to lookup the VisualVault Location.

   Process PseudoCode:
                  1. Get the Site for the Site ID passed in.
                  2. Get list of users for that site.  Not discriminating between enabled or disabled users.
                  3. Load users into an object and return to the calling function.

   Return Array:  The following represents the array of information returned to the calling function. This is a standardized response. Any item in the array at points 2 or above can be used to return multiple items of information.
                  0 - Status: Success, Failure
                  1 - Message
                  2 - Array of User Objects

   Date of Dev:   02/16/2018
   Last Rev Date:  07/06/2021
   Revision Notes:
   02/16/2018 - Jason Hatch: Initial creation of the business process.
   03/09/2018 - Jason Hatch: Added mechanism to get the usid from the users.
   07/06/2021 - Emanuel Jofré: Promises transpiled to async/await.
   */

    // Logs the execution start time of the script
    logger.info('Start of the process LibSiteEmailLookup at ' + Date());

    // Initialization of the return object
    let returnObj = [];

    /********************
     * Helper Functions *
     ********************/

    async function getSites(siteID) {
        let site = {};
        // Query
        site.q = `name eq '${siteID}'`;
        // Field names to return
        site.fields = 'id, name';
        // Gets site
        const resp = await vvClient.sites.getSites(site)

        return resp;
    }

    async function getUsers(SiteInfo) {
        let usersParams = {};
        // Gets users
        const resp = await vvClient.users.getUsers(usersParams, SiteInfo);

        return resp;
    }

    /*****************
     * Main Function *
     *****************/

    try {
        // Extract the passed in parameter
        const siteID = ffCollection.getFormFieldByName('Site ID');

        // Validates the passed in parameter
        if (!siteID.value || siteID.value == ' ') {
            returnObj[0] = 'No Site';
            returnObj[1] = "A site was not found where the user could be created.";
        } else {
            // Gets site data
            const sitesResp = await getSites(siteID.value, vvClient);

            // Processes the response from getSites()
            const site = JSON.parse(sitesResp);

            if (site.meta.status === 200 && site.data.length > 0) {
                logger.info('Site found for ' + siteID.value);
                const siteInfo = site.data[0].id;

                // Gets users
                const usersResp = await getUsers(siteInfo, vvClient);

                // Processes the response from getSites()
                const users = JSON.parse(usersResp);

                if (users.meta.status === 200 && users.data.length > 0) {
                    let emailList = [];
                    const usersData = users.data;

                    usersData.forEach(user => {
                        // Creates user object
                        const usersObj = {
                            email: user.emailAddress,
                            enabled: user.enabled,
                            firstname: user.firstName,
                            lastname: user.lastName,
                            siteid: user.siteId,
                            userid: user.userid,
                            usid: user.id
                        };
                        // Add the user to the email list
                        emailList.push(usersObj);
                    });
                    returnObj[0] = 'Emails Found';
                    returnObj[1] = 'List of Emails Found and Returned.';
                    returnObj[2] = emailList;
                } else {
                    returnObj[0] = 'No Email';
                    returnObj[1] = 'No Emails found for this site.';
                }
            } else {
                logger.info(`Site '${siteID.value}' not found or has no users.`);
                returnObj[0] = 'No Site';
                returnObj[1] = "A site was not found where the user could be created.";
            }
        }
    } catch (error) {
        returnObj[0] = "Error";
        returnObj[1] = error.message ? error.message : error;
    }

    return response.json(200, returnObj);
}
