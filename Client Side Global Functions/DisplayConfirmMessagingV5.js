/*
Script Name: DisplayConfirmMessaging
Customer: VisualVault
Purpose: The purpose of this function is to display a confirmation message modal.
	Parameters: The following represent variables passed into the function:
	Passed Parameters: messagedata, title, okfunction, cancelfunction
						messagedata - HTML formatted string with the detailed message.
						title - Title applied to the confirmation dialog box.
						okfunction - name of the function to call if the user selects OK.
						cancelfunction - name of the function to call if the user selects cancel.
Return Value: The following represents the value being returned from this function:
						@return {number} x raised to the n-th power.
Date of Dev:	06/01/2017
Last Rev Date:	06/01/2017
Revision Notes:
				06/01/2017 - Austin Noel: Initial creation of the business process. 
				07/15/2021 - Jon Brown:   Update to work with VV version 5.
*/

let confirmDialog = $(`<div id="dialog-confirm" title="${title}"></div>`)
	.hide()
	.append($(`<p>${messagedata}</p>`));
let dialogStyle =$('<style id="dialog-confirm-style">body { overflow: hidden; }</style>');

$('body').append(dialogStyle );
$('body').append(confirmDialog);

$('#dialog-confirm').dialog({
	//animation settings when opening the dialog. Remove to have no animation
    show: { effect: 'drop', direction: 'up', duration: 250}, 
	//animation settings when closing the dialog. Remove to have no animation
	hide: { effect: 'drop', direction: 'up', duration: 250},
	//buttons shown on modal
	buttons: [
		{
			text:"OK",
			click: function(){
				try{
					if(okfunction && typeof okfunction === 'function'){
						okfunction(); 
					}else if(okfunction && typeof okfunction === 'string'){
						eval(okfunction);
					}
				} catch (e){
					console.error('Could not evaluate okfunction:',e);
				}
				$(this).dialog('close');
			},
			class: 'k-button'
		},
		{
			text:"Cancel",
			click: function(){
				try{
					if(cancelfunction && typeof cancelfunction === 'function'){
						cancelfunction(); 
					}else if (cancelfunction && typeof cancelfunction === 'string'){
						eval(cancelfunction);
					}
				} catch (e){
					console.error('Could not evaluate cancelfunction:',e);
				}
				$(this).dialog('close');
			},
			class: 'k-button'			
		},
	],
	close: function() {
			$(this).dialog('close').remove();
			$(dialogStyle).remove();
	},
		open: function(event, ui) {
        $('.ui-dialog-titlebar-close')
            .addClass('k-button-icon k-button k-bare')
			.html('<span class="k-icon">&#10006;</span>')
			.css('position','absolute')
			.css('right', '.3em');
        $('.ui-dialog-content').css('padding', '.5em 1em');
		let overlay = $('ui-widget-overlay');
		overlay.css('position', 'fixed')
			.css('top', '0')
			.css('left', '0')
			.css('width', '100%')
			.css('height', '100%')
    },
	dialogClass: 'k-window',
	classes: {
		   'ui-dialog-titlebar' : 'k-window-titlebar',
		   'ui-dialog-content' : 'k-dialog-content',
		   'ui-dialog-buttonpane' : 'k-dialog-buttongroup',
	},
	resizable: false,
	height: "auto",
	width: 500,
	modal: true
});
