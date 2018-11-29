/*
    Script Name:   SetupReg
    Customer:      VisualVault
    Purpose:       The purpose of this function is to establish regular expressions that will be used as part of the validations.
                    
    Parameters:    The following represent variables passed into the function:  
                    No items passed in
                   
    Return Value:  The following represents the value being returned from this function:
                            
    Date of Dev:   
    Last Rev Date: 06/01/2011
    Revision Notes:
    06/01/2011 - Jason Hatch: Initial creation of the business process. 
*/

//This first PhoneReg is just for phones without extensions.  
//VV.Form.Global.PhoneReg = new RegExp('^(\\s?)\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$');
//This PhoneReg is for phones that have extensions.  Format is XXX-XXX-XXXX.  Needs to be x, ext or extension with any number of digits when entering the extensions.
//VV.Form.Global.PhoneReg = new RegExp('^(\\s?)([0-9]{3})[-]([0-9]{3})[-]([0-9]{4})(?:\\s*(?:#|x\\.?|ex\\.?|ext\\.?|extension)\\s*(\\d+))?$');
//This PhoneReg is for phones that have extensions.  Format is (XXX) XXX-XXXX.  Needs to be x, ext or extension with any number of digits when entering the extensions.
//VV.Form.Global.PhoneReg = new RegExp('^(\\s?)\\(([0-9]{3})\\)[ ]([0-9]{3})[-]([0-9]{4})?$');  
//This PhoneReg is for phones that have extensions.  Format is (XXX) XXX-XXXX.  Needs to be x, ext or extension with any number of digits when entering the extensions.
VV.Form.Global.PhoneReg = new RegExp('^(\\s?)\\(([0-9]{3})\\)[ ]([0-9]{3})[-]([0-9]{4})(?:\\s*(?:#|x\\.?|ex\\.?|ext\\.?|extension)\\s*(\\d+))?$');
VV.Form.Global.EmailReg = new RegExp('\\b[A-Za-z0-9._%+-]+\@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}\\b');
VV.Form.Global.URLReg = new RegExp('^([\\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$');
VV.Form.Global.BlankReg = new RegExp('\\w');
VV.Form.Global.ZipReg = new RegExp('^(\\s?)\\d{5}(-\\d{4})?$');
VV.Form.Global.DDSelectReg = new RegExp('^((?!Select).)*$');
VV.Form.Global.TimeReg = new RegExp('^([0-9]|0[0-9]|1[0-9]):[0-5][0-9] ([AP][M])$');
VV.Form.Global.PartnerReg = new RegExp('\\bpartnership', 'gi');
VV.Form.Global.CGASScore = new RegExp('\\s?[0-9]{3}');
VV.Form.Global.DoubleDigitCheck = new RegExp('\\s?[0-9]{2}');
VV.Form.Global.SSN = new RegExp('([0-9]{3})[-]([0-9]{2})[-]([0-9]{4})$');
VV.Form.Global.EIN = new RegExp('^([0-9]{2})[-]\\d{7}$');
VV.Form.Global.NPI = new RegExp('^\\d{10}$');
// Currency format must be '0.00' or '-0.00'
VV.Form.Global.Currency = new RegExp('^[+-]?([0-9]{1,3}([0-9]{3},)*[0-9]{3}|[0-9]+)(\.[0-9][0-9])?$');
// Percent check. Value can be 0 - 100 including decimals.
VV.Form.Global.Percent = new RegExp('^(100([\.][0]{1,})?$|[0-9]{1,2}([\.][0-9]{1,})?)$');
