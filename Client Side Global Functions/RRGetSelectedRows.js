/*
Script Name: RRGetSelectedRows
Purpose: Get information about rows that are currently selected in a repeating row control
Parameters: gridControl - pass in the control parameter from the RRC click event: VV.Form.Global.RRGetSelectedRows(control)
Return Value: An array of form revisionIds, representing the selected rows.

Date of Dev: 04/15/2020
Last Rev Dte:

Revision Notes:
    04/15/2020 - Kendra Austin: Initial creation. 
*/

var grid = gridControl.data('kendoGrid');
// Search DOM tree with jQuery .find
var selectedRows = grid.table.find('input.selectable-row:checked');
var dataIdList = selectedRows.map(function (idx, row) { return $(row).data('dataid'); }).toArray();
return dataIdList;
