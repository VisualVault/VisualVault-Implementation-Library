//Pass in value of PassedControlValue
if (typeof VV.Form.Global.EmailReg === 'undefined') {
  VV.Form.Global.SetupReg();
}

return VV.Form.Global.TimeReg.test(PassedControlValue); // true or false
