//The following is a snippet of code used to call the LibSiteEmailLookup NodeJS script and handle the response.

//Load parameters for the web service
providerParams = [];
var providerObj = {};
providerObj.name = 'Site ID';
providerObj.value = siteID;
providerParams.push(providerObj);

vvClient.scripts.runWebService('LibSiteEmailLookup', providerParams).then(function (emailresp) {
    var emailData = emailresp.data[2];

    for (var c = 0; c < emailData.length; c++) {
        if (emailList.length == 0) {
            if (emailData[c]['enabled'] == true) {
                emailList = emailData[c]['email'];
            }
        }
        else {
            if (emailData[c]['enabled'] == true) {
                emailList = emailList + ',' + emailData[c]['email'];
            }
        }

    }
});
