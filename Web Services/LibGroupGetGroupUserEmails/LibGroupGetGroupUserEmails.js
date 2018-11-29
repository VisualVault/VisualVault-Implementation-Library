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
    /*Script Name:   LibGroupGetGroupUserEmails
     Customer:      VisualVault
     Purpose:       Get a list User IDs, First Name, Last Name and Email addresses for all users who are the member of a group or multiple groups.
     Parameters:    The following represent variables passed into the function:
                     Array of VisualVault security Groups.  Example as follows:
                     
                     var groupsParamObj = [
                            {
                                name: 'groups',
                                value: ['Information and Eligibility Staff', 'Information and Eligibility Managers']
                            }
                        ];
                     
                     
     Process PseudoCode:
                    1. Extract a list of groups and get the group.  
                    2. For each group found, get user information and load user information into the UserData object.
                    3. Return UserData object to the calling function.


     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                     Any item in the array at points 2 or above can be used to return multiple items of information.
                     0 - Status: 'Success' or 'Error'
                     1 - Message
                     2 - User data object with list of users.

     Date of Dev:   11/16/2017
     Last Rev Date: 06/04/2018
     Revision Notes:
     11/16/2017 - Austin Noel: Initial creation of the business process. 
     06/04/2018 - Jason Hatch: Add mechanism to return with group name.
     */

    logger.info('Start of the process LibGroupGetGroupUserEmails at ' + Date());
    var Q = require('q');

    //Initialization of the return object
    var returnObj = [];
    returnObj[0] = "Success";
    returnObj[1] = "The process completed successfully";

    //Initialization of the function variables
    var isError = false;
    var userData = [];
    var groupIds = [];

    //Function that constructs a query to fetch the list of groups and verify all group names exist in VisualVault
    var getGroupIds = function (groupNames) {

        var groupsData = {};

        //Build the query to include the entire list of groups in an "IN" clause
        var inClause = '';
        groupNames.forEach(function (groupName) {
            if (inClause.length > 0) {
                inClause += ",";
            }
            inClause += "'" + groupName + "'";
        });

        groupsData.q = "[name] IN (" + inClause + ")"

        return vvClient.groups.getGroups(groupsData).then(function (response) {
            var foundGroups = JSON.parse(response).data;

            //Make sure each passed in group name has a group returned from the query
            groupNames.forEach(function (group, index) {
                if (!foundGroups.find(function (foundGroup) {
                    return foundGroup.name.toLowerCase() === group.toLowerCase();
                })) {
                    isError = true;
                    returnObj[0] = "Error";
                    returnObj[1] = "One or more of the passed in group names were unable to found.";
                }
            });

            return foundGroups;
        });
    }

    var getUserInformationForGroup = function (groupID, groupName) {
        if (!isError) {
            var groupsData = {};
            groupsData.fields = "Id,Name,UserId,FirstName,LastName,EmailAddress";

            return vvClient.groups.getGroupsUsers(groupsData, groupID).then(function (resp) {
                var respData = JSON.parse(resp);

                if (respData.meta.status == '200') {
                    var usersInfo = respData.data;

                    usersInfo.forEach(function (userInfo) {
                        //Add the user to the data array if it's not already there
                        if (!userData.find(function (user, index) {
                            return user.id === userInfo.id;
                        })) {
                            userInfo.groupname = groupName;
                            userData.push(userInfo);
                        }
                    });

                } else {
                    isError = true;

                    var errorMessage = "The call to retrieve group members returned with an error.";
                    logger.info(errorMessage);

                    returnObj[0] = "Error";
                    returnObj[1] = errorMessage;
                }
            });
        }
    }

    //Extract and validate the passed in parameters
    var groups = [];
    var groupsField = ffCollection.getFormFieldByName('groups');
    if (groupsField && groupsField.value && groupsField.value.length > 0) {

        //Get the groupIds for all the passed in groups
        getGroupIds(groupsField.value).then(function (foundGroups) {
            //loop through each group and fetch the that exist in the group
            var result = Q.resolve();
            if (!isError) {
                foundGroups.forEach(function (group) {
                    result = result.then(function (resp) {
                        return getUserInformationForGroup(group.id, group.name);
                    });
                });
            }

            return result;
        })
            .then(function (resp) {
                returnObj[2] = userData;
                return response.json(returnObj);
            });
    } else {
        isError = true;

        returnObj[0] = "Error";
        returnObj[1] = "The 'groups' parameter was not supplied or had an invalid value";

        return response.json(returnObj);
    }

}   
