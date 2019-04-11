/*******************Function Body - Start********************/
/*****************************************************************************************************************/

/***formHeight is the desired height for the form to force scrolling***/
var formHeight = 900,
    /***pnlButtonBar is the section of the page between the top tabs and form with buttons, pager, and space***/
    pnlButtonBar = $('div[id$="_pnlButtonBar"]'),
    /***pnlSpace***/
    pnlSpace = pnlButtonBar.find('>div:not([id])'),
    /***formDiv holds all the containers***/
    //formDiv = $('div[id$="_divPreFormViewerPanel"] div[id$="_divPreFormViewer"]'), /*this selector is too specific and DOES NOT work on upper page tab changes, popup windows (fillin + relate), upload, RRC edit*/
    formDiv = $('div[id$="divPreFormViewer"]'),
    /***formWidth is the width of the form***/
    formWidth = formDiv.outerWidth(),
    /***formCntrs is an array of all containers***/
    formCntrs = formDiv.find('div[vvfftype="103"]'),
    /***formBtns is an array of all page button elements (including tab buttons)***/
    formBtns = formCntrs.find('div[vvfftype="17"] input[vvfieldtype="formbutton"]'),
    /***formHdrs is an array of all header containers (name starts with _Header_)***/
    formHdrs = formCntrs.filter('[vvfieldnamewrapper^="_Header_"]'),
    /***formTabs is the container for the Tab buttons (name equals _Tab_1)***/
    formTabs = formCntrs.filter('[vvfieldnamewrapper="_Tab_1"]'),
    /***tabBtns is an array of tab button elements***/
    tabBtns = formTabs.find('div[vvfftype="17"] input[vvfieldtype="formbutton"]'),
    /***formBody is the container for the Body (name equals _Body_1)***/
    formBody = formCntrs.filter('[vvfieldnamewrapper="_Body_1"]'),
    /***formAdminSC is the container for Admin Save Container (name equals AdminSaveContainer)***/
    formAdminSC = formCntrs.filter('[vvfieldnamewrapper="AdminSaveContainer"]'),
    /***formFtr is the container for the Footer (name equals _Footer_1)***/
    formFtr = formCntrs.filter('[vvfieldnamewrapper="_Footer_1"]'),
    /***formFtrHeight is the height of the Footer***/
    formFtrHeight = formFtr.height();

/*******************Form - Style*******************/
formDiv.css({
    height: formHeight + 'px',
    minHeight: formHeight + 'px',
    overflow: 'hidden auto',
    marginBottom: 0
});

/*******************Buttons - Style*******************/
formBtns.css({ background: '#428bca', border: 'solid 1px darkgrey', color: 'white' });
//make all button text more readable if form is readonly
if(formBtns.attr('readonly') == 'readonly') {
    formBtns.css({ color: 'lightgrey' });
}

/*******************Tab Buttons - Style*******************/
tabBtns.css({ borderRadius: '8px 2px 0 0', borderLeft: '1.5px solid black', borderTop: '1px solid black', boxShadow: '1px 0 darkgrey', opacity: 0.75 }); //, color: 'white'
//make all button text more readable if form is readonly
//if(tabBtns.attr('readonly') == 'readonly') {
//    tabBtns.css({ color: 'lightgrey' });
//}

/*******************Tab Buttons - Focus Event*******************/
tabBtns.focus(function () {
    tabBtns.css({ opacity: 0.75, borderColor: 'black darkgrey darkgrey black', borderWidth: '1px 1px 1px 1.5px' });
    $(this).css({ opacity: 1, borderColor: 'black', borderWidth: '1.5px', outline: 'none' });
    window.$selectedTab = $(this).parent().attr('id');
});

/*******************Tab Buttons - Selection*******************/
if(window.$selectedTab) {
    /***Select previously selected tab***/
    var $selTab = $('#' + window.$selectedTab).find('input');
    $selTab.css({ opacity: 1, borderColor: 'black', borderWidth: '1.5px', outline: 'none' });
} else {
    /***Put focus on 1st tab***/
    $(tabBtns[0]).css({ opacity: 1, borderColor: 'black', borderWidth: '1.5px', outline: 'none' });
    window.$selectedTab = $(tabBtns[0]).parent().attr('id');
}

/*******************************************************************************
Best practice is to position from top to bottom (Header(s), then Tabs, then Footer)
*******************************************************************************/

/*******************Pre-Form Space - Style*******************/
pnlButtonBar.height(45);
pnlSpace.css({ transform: 'translateY(-35px)' });

/*******************Header Container(s) - Position & Style*******************/
if (formHdrs.length > 0) {
    formHdrs.css({ position: 'sticky', width: '100%', zIndex: 1000, background: 'white' });

    /***1st Header***/
    $(formHdrs[0]).css({ top: 0 });
    /***2nd Header***/
    if (formHdrs[1]) {
        $(formHdrs[1]).css({ top: $(formHdrs[0]).height() });
    }
}

/*******************Tab Container - Position & Style*******************/
if (formTabs.length > 0) {
    formTabs.css({ position: 'sticky', top: ($(formHdrs[0]).height() + $(formHdrs[1]).height()) + 'px', width: '100%', zIndex: 1000, background: 'white' });
}

/*******************Footer Container - Relocate and Style*******************/
/***only do this if the Footer is still in the container list***/
if (!formCntrs.last().is(formFtr)) {
    /***Relocate Footer from the container list to beneath the form***/
    formFtr.remove().insertAfter(formDiv);
    /***Apply style to Footer***/
    formFtr.css({ position: 'sticky', top: (formHeight - formFtrHeight) + 'px', width: formWidth + 'px', zIndex: 1000, background: 'white', margin: '0px auto 10px', border: '1px solid rgb(192, 192, 192)', borderTop: 'none' });
}

/*****************************************************************************************************************/
/*******************Function Body - End********************/




//Form State Blur Function:

//var formStateValue = $(control).val();
///***Only do the following when Form State = 1***/
//if (formStateValue == '1') {
//    /***Find all tab buttons***/
//    var tabBtns = $('div[vvfftype="103"][vvfieldnamewrapper="_Tab_1"] div[vvfftype="17"] input[vvfieldtype="formbutton"]');
//
//    /***Click and focus on the first tab button***/
//    $(tabBtns[0]).click().focus();
//}
