/*
    Script Name:   DisplayMessaging
    Customer:      VisualVault
    Purpose:       The purpose of this function is to display a VisualVault skinned alert message.
    Parameters:    The following represent variables passed into the function:  
                   Passed Parameters:  messagedata,title
                   messagedata - HTML formatted string with the detailed message.
                   title - Title applied to the confirmation dialog box.
                   
    Return Value:  The following represents the value being returned from this function:
                            
    Date of Dev:   
    Last Rev Date: 06/01/2017
    Revision Notes:
    06/01/2017 - Tod Olsen: Initial creation of the business process. 
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
        mw.displayMessage(title, messagedata);
    } else {
        alert(messagedata);
    }
}
else {
    var mw = $find(VV.MasterPage.MessageWindowID);
    if (mw !== null) {
        mw.displayMessage(title, 'Message text parameter contains no value');
    } else {
        alert('Message text parameter contains no value');
    }
}
