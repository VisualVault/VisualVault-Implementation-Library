//Following is an example for calling the CanUserCompleteWFTask global function

//Acquire the wfwaid from the button that is configured to complete the workflow task.
var $btn = $("[value=Seq5Reject]");
var taskId = $btn.attr('wfwaid');

//Make sure that the user selecting the button can complete the task.
VV.Form.Global.CanUserCompleteWFTask(taskId).then(function (resp) {
    if (!resp.error) {
        if (resp.result) {
            //User can complete the task so take actions to update the form and provide a message.
            VV.Form.SetFieldValue('Status', 'Region Review');

            var message = 'This request has been returned to the Regional Staff';
            VV.Form.Global.DisplayMessaging(message);

            //click Seq5Reject button to complete wf task
            var button = $("[value=Seq5Reject]")

            if (button) {
                button.trigger("click");
            }
        }
        else {
            VV.Form.HideLoadingPanel();
            VV.Form.Global.DisplayMessaging('You are not assigned to complete this workflow task.');
        }
    }
    else {
        VV.Form.HideLoadingPanel();
        VV.Form.Global.DisplayMessaging('An error occurred while verifying user assignment to workflow task.');
    }
});
