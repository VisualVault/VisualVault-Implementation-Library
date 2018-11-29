/*
    Script Name:   DisplayConfirmMessaging
    Customer:      VisualVault
    Purpose:       The purpose of this function is to display a VisualVault skinned confirmation message.
    Parameters:    The following represent variables passed into the function:  
                   Passed Parameters:  messagedata,title,okfunction,cancelfunction
                   messagedata - HTML formatted string with the detailed message.
                   title - Title applied to the confirmation dialog box.
                   okfunction - name of the function to call if the user selects OK.
                   cancelfunction - name of the function to call if the user selects cancel.
    Return Value:  The following represents the value being returned from this function:
                            
    Date of Dev:   
    Last Rev Date: 06/01/2017
    Revision Notes:
    06/01/2017 - Austin Noel: Initial creation of the business process. 
*/


if (!title) {
    title = 'Message';
}

VV.Form.HideLoadingPanel();

var regex1 = new RegExp(/(\r\n?|\n)/g);
messagedata = messagedata.replace(regex1, "<br/>");

var regex2 = new RegExp(/(\t)/g);
messagedata = messagedata.replace(regex2, "&emsp;");

if (messagedata && messagedata.length > 0) {
    var mw = $find(VV.MasterPage.MessageWindowID);
    if (mw !== null) {
        mw.displayConfirmMessage(title, messagedata, okfunction, cancelfunction);
    } else {
        var result = confirm(messagedata);

        //Call the appropriate function if it's been defined
        if (result && typeof (okfunction) === 'function') {
            okfunction();
        } else if (!result && typeof (cancelfunction) === 'function') {
            cancelfunction();
        }
    }
}
else {
    //Let this display the normal message since we don't want any work to happen if the client wasn't given a proper message to let them make an informed decision
    var mw = $find(VV.MasterPage.MessageWindowID);
    if (mw !== null) {
        mw.displayMessage(title, 'Message text parameter contains no value');
    } else {
        alert('Message text parameter contains no value');
    }
}
