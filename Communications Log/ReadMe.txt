Communications Log Lincoln:
- Includes an upload attachments button. 
- Only offers email as a communication type. 

Communications Log OLS:
- Includes voicemail as a communication type. 
- Does not include the upload attachments button.
- Does include a resend communication button that tracks when and how many times the email was resent. 

Communication Send Digest and Communication Send Immediately Queries: 
- Note that these queries operate on UTC time, while the [Scheduled Date] field is in the customer's time zone. 
- This means that if a customer is likely to pre-schedule comm logs that should not be sent until a certain time, 
the corresponding web service will need to be updated to handle this discrepancy.
