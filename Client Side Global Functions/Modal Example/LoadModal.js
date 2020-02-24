//Examples to load the message and button area of the modal.
//This would be called after a web service that returns items from the server.  You would use those items
//to build the list of actions that could be taken.  Additionally, you are loading or configuring
//what form template functions should be called with each action and what paramters.
//Notice the parameters are escaped to use the single quotes.

$('<p class="usermessage">Text</p>').appendTo('#messagearea');
$('<button type="button" class="btn btn-action" onclick="VV.Form.Template.RunConfirm(\'Yes\');">Show Message</button>action information to prompt user inserted here.<br><br>').appendTo('#buttonArea');
$('<button type="button" class="btn btn-action" onclick="VV.Form.Template.RunConfirm(\'Yes\');">Show Message2</button>action information to prompt user inserted here.<br>').appendTo('#buttonArea');

$('#childDuplicateModal').modal({ backdrop: 'static', keyboard: false });
