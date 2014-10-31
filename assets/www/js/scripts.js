function compareDates(a,b) {
    // Compare two dates (could be of any type supported by the convert
    // function above) and returns:
    //  -1 : if a < b
    //   0 : if a = b
    //   1 : if a > b
    // NaN : if a or b is an illegal date
    // NOTE: The code inside isFinite does an assignment (=).
    return (
        isFinite(a=this.convert(a).valueOf()) &&
        isFinite(b=this.convert(b).valueOf()) ?
        (a>b)-(a<b) :
        NaN
    );
}
function dateInRange(d,start,end) {
    // Checks if date in d is between dates in start and end.
    // Returns a boolean or NaN:
    //    true  : if d is between start and end (inclusive)
    //    false : if d is before start or after end
    //    NaN   : if one or more of the dates is illegal.
    // NOTE: The code inside isFinite does an assignment (=).
   return (
        isFinite(d=this.convert(d).valueOf()) &&
        isFinite(start=this.convert(start).valueOf()) &&
        isFinite(end=this.convert(end).valueOf()) ?
        start <= d && d <= end :
        NaN
    );
}
function timeConverter(timeStr) {
    timeStr = timeStr.split(" ");
    var AMPM = timeStr[1];
    var hours =  Number(timeStr[0].split(":")[0]);
    var minutes = Number(timeStr[0].split(":")[1]);
    if(AMPM == "PM" && hours<12) hours = hours+12;
    if(AMPM == "AM" && hours==12) hours = hours-12;
    var sHours = hours.toString();
    var sMinutes = minutes.toString();
    if(hours<10) sHours = "0" + sHours;
    if(minutes<10) sMinutes = "0" + sMinutes;
    return (sHours + ":" + sMinutes);
}
function showPageLoading() {
  $.mobile.loading("show", {
    text: "Loading ...",
    textVisible: "true",
    theme: "b",
    textonly: "true",
    html: "<span style='text-align: center;' class='ui-bar ui-shadow ui-overlay-d ui-corner-all'>"+
    "<div style='position: relative; left: 0; top: 0;'><img src='img/loading.gif' style='position: relative; top: 0; left: 0;'/>"+
    "<img src='img/app-icon.gif' style='position: absolute; top: 41px; left: 41px;'/>"+
    "</div><h2 class='blink'>Loading ...</h2></span>"
  });
}
function hidePageLoading() { $.mobile.loading("hide"); }

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}