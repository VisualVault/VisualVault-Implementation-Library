/*
    Script Name:   FormatButtonsAndTabs
    Customer:      VisualVault
    Purpose:       This function ensures buttons in containers with tab or menu style are always clickable, even in read-only mode.
				   It also hides the VV default close button, then finds all buttons labeled "Close" 
				   and formats them with red color and clickable even in read-only mode.

    Parameters:    None
    Return Value:  None 
    Date of Dev:   07/28/2020
    Last Rev Date: 
    Revision Notes:
    07/28/2020 - Kendra Austin: Initial creation of the business process. 
*/

//Hide VV's close button:  
$("[class='CloseContainer']").hide();

//Change color of VV Form close buttons and close button to work even in Read Only:
$("[value='Close']").css("background-color", "#D50000").css("color", "#FFF").removeAttr('disabled').removeAttr('readonly');

//Find all containers with these styles
var styleNames = ['.styleMenu', '.styleTabButtons'];

for (var x = 0; x < styleNames.length; x++) {
	//Get the list of controls in this type of container. 
	var tabList = $(styleNames[x]).children();

	//Iterate through each tab button in this style and make it active even in read only mode: 
	for (var i = 0; i < tabList.length; i++) {
		var tabName = $(tabList[i]).attr('vvfieldnamewrapper');
		$("[vvfieldname='" + tabName + "']").removeAttr('disabled').removeAttr('readonly');
	}
}

