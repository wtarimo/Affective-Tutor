
function doGet(e) {
  var app = UiApp.createApplication();
  app.add(display5MinuteSummary());
  app.addTimer(app.createServerHandler("update") , 15000);
  return app;
}

function update(e){
  var app = UiApp.getActiveApplication();
  app.remove(0);
  app.add(display5MinuteSummary());
  app.addTimer(app.createServerHandler("update") , 15000);
  return app;
}

function display5MinuteSummary() {
  var id = "0ArUcWfcXw69_dGFfaWRCSDNlblFYMC1UODhOWDVBM1E";
  var sheet  = SpreadsheetApp.openById(id);
  var data = sheet.getDataRange().getValues();
  
  
  counts = {'Engaged':[], 'Bored':[], 'Confused':[]};
  
  var now = new Date();
  //Logger.log(now);
  var currentTime = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
  //var currentTime = 10*3600 + 50*60 + 0;
 
  var all_ids = {};
  var active_ids = {};
  //Logger.log(Object.keys(all_ids).length);
  for (var i = 1; i < data.length; i++) {
    var time = data[i][0].getHours()*3600 + data[i][0].getMinutes()*60 + data[i][0].getSeconds();
    all_ids[data[i][3]]=true;
    if (currentTime-time <= 300) {
      if (counts[data[i][1]].lastIndexOf(data[i][3])==-1) {
        counts[data[i][1]].push(data[i][3]);
        active_ids[data[i][3]]=true;
      }
    }
  }
  //Logger.log(counts);
  //Logger.log(Object.keys(all_ids).length);
  var data2 = Charts.newDataTable()
     .addColumn(Charts.ColumnType.STRING, "Feeling")
     .addColumn(Charts.ColumnType.NUMBER, "Count")
     .addRow(["Engaged", counts['Engaged'].length])
     .addRow(["Confused", counts['Confused'].length])
     .addRow(["Bored", counts['Bored'].length])
     .addRow(["UNKNOWN", Object.keys(all_ids).length-Object.keys(active_ids).length])
  
     .build();
  //Logger.log(Object.keys(all_ids).length-Object.keys(active_ids).length);
  
  var chart = Charts.newPieChart()
     .setDataTable(data2)
     .setTitle('Summary from the last 5 minutes')
     .setColors(["green","red","yellow","white"])
     .setBackgroundColor("gray")
     .build();
  
  return chart;
  
  // Save the chart to our Document List  
  //var file = DocsList.createFile(chart);  
  //file.rename("Income Chart");  
  //file.addToFolder(DocsList.getFolder("Output"));
  
  //var page = SitesApp.getActivePage();  
  //page.addHostedAttachment(chart, "Income Chart");  
};