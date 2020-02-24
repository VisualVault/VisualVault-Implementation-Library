//CreateModal script.

//example of displaying the payment modal
//$('#childDuplicateModal').modal('show');

//include bootstrap script bundle (VV does not automatically load this bundle within the form viewer)
//the version number is meaningless, only used to force download of the script file when version is changed
var script = document.createElement('script');
script.src = '/bundles/bootstrapjs?v=FBul99mpojQQrPqNoqXHNBuItkZ_0pqoo9DoBnPB5pQ1';
document.head.appendChild(script);

var style = document.createElement('style');
style.innerHTML = '.close { vertical-align:middle;}';  //You can put css styles into this section.

document.head.appendChild(style);

//create modal dom elements using bootstrap modal classes.  ID of this element will be used to close or launch the modal.
var modalDiv = document.createElement("div");
modalDiv.setAttribute('class', 'modal fade');
modalDiv.setAttribute('id', 'childDuplicateModal');
modalDiv.setAttribute('tabindex', '-1');
modalDiv.setAttribute('role', 'dialog');
modalDiv.setAttribute('aria-labelledby', 'Potential duplicate Child(ren) found');
modalDiv.setAttribute('aria-hidden', 'true');
document.body.appendChild(modalDiv);

var dialogDiv = document.createElement("div");
dialogDiv.setAttribute('class', 'modal-dialog');
dialogDiv.setAttribute('role', 'document');
modalDiv.appendChild(dialogDiv);

var contentDiv = document.createElement("div");
contentDiv.setAttribute('class', 'modal-content');
dialogDiv.appendChild(contentDiv);

//insert form here

var headerDiv = document.createElement("div");
headerDiv.setAttribute('class', 'modal-header');
contentDiv.appendChild(headerDiv);

//Element of the header to show the purpose of the modal.
var modalTitle = document.createElement("h5");
modalTitle.setAttribute('class', 'modal-title');
modalTitle.setAttribute('id', 'modalTitle');
modalTitle.innerHTML += "Potential duplicate Child(ren) found";
headerDiv.appendChild(modalTitle);

//The following is the section to show a close X on the modal.  Cancel is present and fulfills the same function.
//var modalCloseButton = document.createElement("button");
//modalCloseButton.setAttribute('class', 'close');
//modalCloseButton.setAttribute('data-dismiss', 'modal');
//modalCloseButton.setAttribute('aria-label', 'Close');

//var modalCloseButtonSpan = document.createElement("span");
//modalCloseButtonSpan.setAttribute('aria-hidden', 'true');
//modalCloseButtonSpan.innerHTML += "&times;";
//modalCloseButton.appendChild(modalCloseButtonSpan);

//headerDiv.appendChild(modalCloseButton);

var modalBodyDiv = document.createElement("div");
modalBodyDiv.setAttribute('class', 'modal-body');
contentDiv.appendChild(modalBodyDiv);

//The following loads 2 target sections for the modal to show messages and actions to the user.
var bodyContent = document.createElement("div");
bodyContent.innerHTML =
    '<div id="messagearea"></div>' +
    '<div id="buttonArea"></div>';
modalBodyDiv.appendChild(bodyContent);


var modalFooterDiv = document.createElement("div");
modalFooterDiv.setAttribute('class', 'modal-footer');
contentDiv.appendChild(modalFooterDiv);

//The following is the cancel button.  Calling a VV script to clean the modal and close it.
var modalCancelButton = document.createElement("button");
modalCancelButton.setAttribute('type', 'button');
modalCancelButton.setAttribute('class', 'btn btn-secondary');
modalCancelButton.setAttribute('onclick', 'VV.Form.Template.CancelModal()');
modalCancelButton.innerHTML += "Cancel";

modalFooterDiv.appendChild(modalCancelButton);

//The following is the "OK" button for the screen.  This can call other scripts and take other actions or can have specific actions configured if the other options do not apply.
var modalSubmitButton = document.createElement("button");
modalSubmitButton.setAttribute('type', 'button');
modalSubmitButton.setAttribute('class', 'btn btn-primary');
modalSubmitButton.setAttribute('onclick', 'VV.Form.Template.RunConfirm();');
modalSubmitButton.innerHTML += "Create Child";

modalFooterDiv.appendChild(modalSubmitButton);

modalFooterDiv.appendChild(modalCancelButton);
