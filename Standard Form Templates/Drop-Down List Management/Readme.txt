As you configure solutions in VisualVault, at times you may need to create lists of data that populate the Options and Value of a drop-down list.  When the Option and Value need to be different the mechanisms of manually adding items or using the Drop-Down Admin will not work.  In this case we suggest that you create a lookup dataset that can be used to house all of your drop down lists, then you would configure your drop-down lists on the form to use a query from a data source.  Your data source being this lookup dataset.  To configure this solution, you will do the following:

1. Create a form template and import the form template example found in this folder.
2. Create the data set for your list by filling in records against the released form template from step 1.
3. Create a query in Conntrol Panel-Enterprise Tools-Database Connections that acquires the data and orders in the way you want.  Use the query in this folder as an example.
4. Configure your drop-down list to use the query that you defined in the previous step.

Using the above steps, you can create any number of lists for drop-down lists and use them across your solution in VV.  The advantage of this configuration is you can add new values at any time or disable values simply by changing the status of a value you don't want to appear any more.  You can also conditionally show certain items in the list using an @Value parameter in your where clause.

The following is a description of each field found on the form template included in this example.
- List Name - This is the name you would give to the list of values that you will display in a drop-down list.  This is used in the WHERE cluse of the example query included in this folder.
- List Display Value - This is the human readable value that will be visible to the user.
- List Options Value - This is the option value that is behind the scenes for a drop down list.  This can be the same value as the List Display Value or it can be different.  It can be different if for example you want to display a human readable text to the user but store a number or code in VisualVault when that item is selected.
- Item Enabled - This allows you to indicate if the item is enabled or disabled.  Use this in your query to show only enabled items.
- Query Option - You can enter values into this field to control what items are visible when.  As an example if the form is in a certain state, show a, b and c.  If the form is in a different state show a, c and d.  You can use a statement like WHERE [Query Option] = @Value to measure the status and control what is shown as long as the status is in the Query Option.  You could also have a like in your query so Query Option could have multiple, complex values.
- Position - This is used to control the order of how the fields appear in the list if you want to control them differently than an alphabetic list.
- Help Text - If someone selects a certain value in the configured drop-down list, you can do a lookup query to populate a textbox on the screen that has help text.  This lets you dynamically configure help text.

