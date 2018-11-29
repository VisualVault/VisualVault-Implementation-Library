//Array variable that contains the VisualVault security group names found in Group Admin
var groupsParamObj = [
    {
        name: 'groups',
        value: ['Information and Eligibility Staff', 'Information and Eligibility Managers']
    }
];

return vvClient.scripts.runWebService('LibGroupGetGroupUserEmails', groupsParamObj).then(function (userInfoResponse) {
    var userInfo = userInfoResponse.data;
    //Extract email information for use to send an email.  Place in a comman separated variable.
    if (userInfo.hasOwnProperty('data')) {
        userInfo.data.forEach(function (user) {
            if (user.hasOwnProperty('emailAddress')) {
                if (emailList != '') {
                    emailList += ',';
                }
                emailList += user['emailAddress'];
            }

        });
    }
});
