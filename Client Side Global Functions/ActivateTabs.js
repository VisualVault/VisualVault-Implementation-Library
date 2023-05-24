/*
    Script Name:   ActivateTabs
    Customer:      VisualVault
    Purpose:       This function ensures buttons in containers with tab or menu style are always clickable, even in read-only mode.
    		USE:   Add the event as Form Event type.
    Parameters:    None
    Return Value:  None 
    Date of Dev:   07/28/2020
    Last Rev Date: 05/19/2022
    Revision Notes:
    07/28/2020 - Kendra Austin: Initial creation of the business process.
    05/19/2022 - Petosa Ayala Franco: Script updated to ES6. 
*/

const styleList = ['.styleMenu', '.styleTabButtons'];

styleList.forEach( style => {
    //Get the list of controls in this container. 
    const tabList = [...$(style).children()];

    //Iterate through each tab button in this style and make it active even in read only mode: 
    tabList.forEach( tab => {
        const tabName = $(tab).attr('vvfieldnamewrapper');
        $("[vvfieldname='" + tabName + "']").removeAttr('disabled').removeAttr('readonly');
    })
});