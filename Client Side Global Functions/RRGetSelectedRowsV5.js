// Pass in 'control' parameter from click event to this function as 'gridControl' parameter.
// Select the dataIds from all the currently-selected rows and return them as an array
var selectedRows = gridControl.selectedRows;
var dataIdList = selectedRows.map(row => row['dataId']);
return dataIdList;
