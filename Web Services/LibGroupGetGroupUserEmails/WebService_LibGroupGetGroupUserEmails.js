//Array variable that contains the VisualVault security group names found in Group Admin
var groupsParamObj = [
    {
        name: 'groups',
        value: ['Information and Eligibility Staff', 'Information and Eligibility Managers']
    }
];

return vvClient.scripts.runWebService('LibGroupGetGroupUserEmails', groupsParamObj).then(function (userInfoResponse) {
    if (userInfoResponse.meta.status === 200) {
        if (userInfoResponse.hasOwnProperty('data')){
            if (userInfoResponse.data[2] != 'undefined') {
                var userInfo = userInfoResponse.data[2];
                //Extract email information for use to send an email.  Place in a comma separated variable.
                userInfo.forEach(function (user) {
                    if (user.hasOwnProperty('emailAddress')) {
                        if (emailList != '') {
                            emailList += ',';
                        }
                        emailList += user['emailAddress'];
                    }
                });
            }
            else {
                throw new Error("The call to Get Group User Emails returned successfully, but the data could not be accessed.");
            }
        }
        else {
            throw new Error("The call to Get Group User Emails returned successfully, but the data was not returned.");
        }
    }
    else {
        throw new Error("An error was encountered when calling the Get Group User Emails process. The status returned was: " + userInfoResponse.meta.status +
                        ". The status message returned was: " + userInfoResponse.meta.statusMsg);
    }
});
