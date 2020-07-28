/*
    Script Name:   ActivateTabs
    Customer:      VisualVault
    Purpose:       This function takes in an array of tab button control names. It ensures they are always clickable, even in read-only mode.
    Parameters:    The following represent variables passed into the function:  

                   tabs - Array of tab button names

    Return Value:  None 
    Date of Dev:   07/28/2020
    Last Rev Date: 

    Revision Notes:
    07/28/2020 - Kendra Austin: Initial creation of the business process. 
*/

//Iterate through each tab button and make it active even in read only mode: 
for (var i = 0; i < tabs.length; i++) {
	$("[vvfieldname='" + tabs[i] + "']").removeAttr('disabled').removeAttr('readonly');
};
