/*
    Script Name:   ActivateTabs
    Customer:      VisualVault
    Purpose:       This function ensures buttons in containers with tab or menu style are always clickable, even in read-only mode.
    		USE: Put this function in the onLoad and EventsEnd events of the template.
    Parameters:    None
    Return Value:  None 
    Date of Dev:   07/28/2020
    Last Rev Date: 

    Revision Notes:
    07/28/2020 - Kendra Austin: Initial creation of the business process. 
*/

var styleNames = ['.styleMenu', '.styleTabButtons'];;

for (var x = 0; x < styleNames.length; x++) {
	//Get the list of controls in this container. 
	var tabList = $(styleNames[x]).children();

	//Iterate through each tab button in this style and make it active even in read only mode: 
	for (var i = 0; i < tabList.length; i++) {
		var tabName = $(tabList[i]).attr('vvfieldnamewrapper');
		$("[vvfieldname='" + tabName + "']").removeAttr('disabled').removeAttr('readonly');
	}
}
