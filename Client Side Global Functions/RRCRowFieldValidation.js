/*
    Script Name:   RRCRowFieldValidation
    Customer:      VisualVault
    Purpose:       Repeating Row Control-->RowSave Event Handler
    Parameters:    The following represent variables passed into the function:  
                   rrcName - Name of the RRC control

    Return Value:  The following represents the value being returned from this function:
                        event --> DOM Event Object
                        control --> DOM RRC Object
                        rowData --> JavaScript Object containing RRC Row Fields and Values

                        Example rowData object (field names are the RRC column names):

                        ColumnItemCode: "123"
                        ColumnItemPrice: "9000"
                        ColumnItemQuantity: "1"

    Prerequisites:  VisualVault Form Designer Build 20240124.1 or newer
                    VisualVault Form Viewer Build 20240124.1 or newer
    
    Date of Dev: 01/24/2024
    Last Rev Date: 01/24/2024

    Revision Notes:
    01/24/2024 - Tod:   Initial version
                        
*/

rrcInvoiceItems_onRowSave = function (event, control, rowData) {
    //Repeating Row Control - Row data validation script
    //This event is called when user saves a row.
    //Return true or false (true = allow save, false = block save)
    
    //Copy script below into the Form Designer Script Editor's RRC RowSave event
        
    return new Promise((resolve =>{
        //Each field in the row can be acessed using using the column name (not the field name).        
        
        var itemPrice = rowData['ColumnItemPrice'];
        if(itemPrice <= 0 || itemPrice > 1000 ){
            
            //display validation error message if price not between 0 & 1000
            var messageTitle = 'Field Validation'
            var message = 'Item price must be between 0 and 1,000.00.';
            
            //Copy DisplayMessagingv5 script from Github repo
            //https://github.com/VisualVault/VisualVault-Implementation-Library/blob/master/Client%20SideGlobal%20Functions/DisplayMessagingv5.js
            
            VV.Form.Global.DisplayMessagingv5(message,messageTitle);
            
            //return false to prevent row from saving
            resolve(false);
        }
        
        //return true if no field validation errors
        resolve(true);
    }))
};