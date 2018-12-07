//Pass in the date of birth and date where age should be calculated.  birthdate, dateatage
var birthDate = new Date(birthdate);

today_date = new Date(dateatage);
today_year = today_date.getFullYear();
today_month = today_date.getMonth();
today_day = today_date.getDate();
age = today_year - birthDate.getFullYear();

if ( today_month < birthDate.getMonth())
{
    age--;
}
if (((birthDate.getMonth()) == today_month) && (today_day < birthDate.getDate()))
{
    age--;
}
return age;
