/*
    Script Name:   RadioButtons
    Customer:      VisualVault
    Purpose:       The purpose of this function is to cause a series of checkboxes to act as radio buttons.
                    This function needs to be added to the focus event of the checkbox.
                    
    Parameters:    The following represent variables passed into the function:  
                    SelectedCheckbox - the item that was selected.
                    UnSelectedList - list of items that should be unselected.
                   
    Return Value:  The following represents the value being returned from this function:
                            
    Date of Dev:   
    Last Rev Date: 06/01/2017
    Revision Notes:
    06/01/2017 - Jason Hatch: Initial creation of the business process. 
*/

var fieldNameArray = [];

fieldNameArray = UnSelectedList.split(", ");

for (var x = 0; x < fieldNameArray.length; x++) {
    VV.Form.SetFieldValue(fieldNameArray[x], 'false');
}

VV.Form.SetFieldValue(SelectedCheckbox, 'true');
