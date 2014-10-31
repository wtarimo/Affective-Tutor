
var AT = function() {
  var messagesTimer; var messagesTimer1; var messagesTimer2; var messagesTimer3;
  var messagesTimer4; var overviewTimer; var courseTimer; var currentUser;
  var currentCourse; var currentLecture; var iQuestion;
  var iTimer; var confusedTimer; var boredTimer; var onFocus = false; var summaryTimer;
  var expanded = []; var post; var names = {};
  

  return {
    saveFeedback: function(choice,n) {
      var Feedback = Parse.Object.extend("Feedback");
      var feedback = new Feedback();
      var now = new Date();
      var date = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds() + 
      (now.getMonth()+1)*2592000 + now.getDate()*86400;
       
      feedback.set({
        userId: Parse.User.current().id,
        lectureId: localStorage['lectureId'],
        choice: choice,
        date: date,
      });

      feedback.save(null, {
        success: function(feedback) {
          var lecture = AT.currentLecture;
          lecture.fetch({
            success: function(lecture) {
              var feedbacks = lecture.get('feedbacks');
              feedbacks[Parse.User.current().getUsername()] = feedback.get('choice');
              lecture.set('feedbacks', feedbacks);
              lecture.save(null, {
                success: function(lecture) {
                  AT.refreshPosts(n);
                },
                error: function(lecture,error) {
                  AT.alert('Failed to update feedbacks. Error '+error.code +": "+ error.message);
                }
              });
            },
            error: function(lecture, error) {
              AT.alert("Error while fetching lecture: " + error.code + " " + error.message);
            }
          });
        },
        error: function(feedback,error) {
            AT.alert('Feedback save failed. Error '+error.code +": "+ error.message);
        }
      });
    },

    init: function() {
	  	if (Parse.User.current()) {
        Parse.User.current().fetch();
        if (Parse.User.current().get('firstName')!=undefined) {
  		    $.mobile.changePage('#welcomePage', {
  	        transition: 'flip',
  	        reverse: true
  	      });
        } else {
        $.mobile.changePage('#loginPage', { transition: 'flip', reverse: true }); }
	  	} else {
	  		$.mobile.changePage('#loginPage', { transition: 'flip', reverse: true }); }
	  },

    checkAccount: function() {
      Parse.User.current().fetch();
      if (Parse.User.current().get('firstName')==undefined) {
        $('#updateAccount').popup();
        $('#updateAccount').popup("open",{positionTo:'window'});
      }
      else if (!Parse.User.current().get('emailVerified')) {
        $('#verifyEmail').popup();
        $('#verifyEmail').popup("open",{positionTo:'window'});
      }
    },

    setEmail: function(email){
      if (!email) AT.alert("Please enter your school email first!");
      else {
        Parse.User.current().set('email',email);
        Parse.User.current().save(null, {
          success: function(user) {
            AT.currentUser = Parse.User.current();
            $('#verifyEmail').popup("close");
            AT.alert("Success: Please respond to the email now!");
          },
          error: function(user, error) {
            AT.alert("Error " + error.code + " " + error.message);
          }
      });
      }
    },

    updateAccount: function(FN,LN,email1,email2){
      if (!email1) AT.alert("Please enter your school email first!");
      else if (!email2) AT.alert("Please repeat your school email!");
      else if (email1!=email2) AT.alert("The two emails don't match!");
      else if (!FN) AT.alert("Please enter your first name!");
      else if (LN=="") AT.alert("Please enter your last name!");
      else {
        Parse.User.current().set('email',email1);
        Parse.User.current().set('firstName',FN);
        Parse.User.current().set('lastName',LN);
        Parse.User.current().save(null, {
          success: function(user) {
            AT.currentUser = Parse.User.current();
            $('#updateAccount').popup("close");
            AT.alert("Success: You need to verify your email, check your email!");
          },
          error: function(user, error) {
            AT.alert("Error " + error.code + " " + error.message);
          }
      });
      }
    },

    alert: function(msg,time){
      $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
      .css({ display: "block", 
        opacity: 0.90, 
        position: "fixed",
        padding: "7px",
        "text-align": "center",
        width: "270px",
        left: ($(window).width() - 284)/2,
        top: $(window).height()/2 })
      .appendTo( $.mobile.pageContainer ).delay(time||2500)
      .fadeOut( 500, function(){ $(this).remove(); });
    },

    ATactive: function() {
      var appHidden;
      if (typeof document.hidden !== "undefined") { appHidden = document.hidden;
      } else if (typeof document.mozHidden !== "undefined") { appHidden = document.mozHidden;
      } else if (typeof document.msHidden !== "undefined") { appHidden = document.msHidden;
      } else if (typeof document.webkitHidden !== "undefined") { appHidden = document.webkitHidden; }
      return (AT.onFocus && !appHidden);
    },

    showReminder: function(item,hello){
      if (!AT.ATactive()) { window.alert("Affective Tutor-Assistant needs your attention!"); }
      if (Parse.User.current().get('firstName')) { $(hello).html("Hello, "+Parse.User.current().get('firstName')); }
      else { $(hello).html("Hello, "+Parse.User.current().getUsername()); }
      $(item).popup('open');
    },

    submitAnswer: function(answer,id) {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(id, {
          success: function(iQn) {
            var type = iQn.get('type');
            if (type=='Numeric' && !validator.isFloat(answer)) {
              hidePageLoading();
              AT.alert("Answer needs to be numeric");
            }
            else {
              var responses = iQn.get('responses');
              responses[Parse.User.current().getUsername()] = validator.trim(answer);
              iQn.set('responses',responses);
              iQn.save(null, {
                success: function(qn) {
                  AT.alert('Submitted');
                  AT.refreshiPanel();
                  if (localStorage['lectureInactive']!="true") {
                    clearInterval(AT.iTimer);
                    AT.iTimer=setInterval(function(){AT.refreshiPanel();},15000); }
                },
                error: function(qn,error) {
                  AT.alert('Submission failed. Error '+error.code +": "+ error.message);
                }
              });
              hidePageLoading();
            }
          },
          
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

    exitiResponder: function() {
      $.mobile.changePage('#'+localStorage['previousPage'], {
        transition: 'flip',
        reverse: true
      });
    },

    autogrowTextarea: function(textarea){
      textarea.style.cssText = 'height:' + Math.round(textarea.scrollHeight/30)*30 + 'px';
    },

    sleep: function(time) {
      var start = new Date().getTime();
      time = time*1000;
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > time){
          break;
        }
      }
    },

    refreshiPanel: function() {
      var iQuestion = Parse.Object.extend("iQuestion");
      var query = new Parse.Query(iQuestion);
      query.equalTo("lectureId", localStorage['lectureId']);
      query.descending('createdAt');
      showPageLoading();
      query.find({
          success: function(qns) {
            $('#iQuestions').empty();
            $('#iQuestions').append("<li id='divider' data-role='list-divider'>iResponder Questions: "+qns.length+"</li>");
            for (var i = 0; i < qns.length; i++) { 
              var qn = qns[i];
              var answer = qn.get('responses')[Parse.User.current().getUsername()];
              if (answer) 
                if (qn.get('answers').indexOf(answer.toLowerCase()) != -1) yourAnswer = "Correct!";
                else yourAnswer = "Incorrect!";
              if (qn.get('active') && Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
                if (qn.get('type')=="Yes/No" || qn.get('type')=="Yes-No") { var temp = $("#ASiTemplateYN"); }
                else if (qn.get('type')=="True-False") { var temp = $("#ASiTemplateTF"); }
                else if (qn.get('type')=="A-B") { var temp = $("#ASiTemplateA-B"); }
                else if (qn.get('type')=="A-C") { var temp = $("#ASiTemplateA-C"); }
                else if (qn.get('type')=="A-D") { var temp = $("#ASiTemplateA-D"); }
                else if (qn.get('type')=="A-E") { var temp = $("#ASiTemplateA-E"); }
                else { var temp = $("#ASiTemplate"); }
              }
              else if (qn.get('active') && Parse.User.current().get('courses')[AT.currentCourse.id]=="admin") {
                var temp = $("#AAiTemplate"); }
              else if (qn.get('active') && Parse.User.current().get('courses')[AT.currentCourse.id]=="admin") {
                var temp = $("#AAiTemplate"); }
              else if (!qn.get('active') && qn.get('include')=="No" && Parse.User.current().get('courses')[AT.currentCourse.id]=="admin") {
                var temp = $("#IAiTemplateG"); }
              else if (!qn.get('active') && Parse.User.current().get('courses')[AT.currentCourse.id]=="admin") {
                var temp = $("#IAiTemplate"); }
              else if (!qn.get('active') && qn.get('include')=="No") {
                var temp = $("#ISiTemplateG"); }
              
              else if (answer && qn.get('answers').indexOf(answer.toLowerCase()) != -1) { var temp = $("#ISiTemplateC"); }
              else if (answer) { var temp = $("#ISiTemplateI"); }
              else  { var temp = $("#ISiTemplateN"); }
              var cAnswer = "Not Set";;
              if (!qn.get('showAnswer')) {
                if (qn.get('answer')) {
                  if (Object.keys(qn.get('responses')).indexOf(Parse.User.current().getUsername())!=-1)
                    cAnswer = qn.get('answer')
                  else
                    cAnswer = "Set: Hidden";
                }
              }
              else { cAnswer = qn.get('answer') || "Not Set"; }              
              
              temp.template("qnTemplate");
              $.tmpl("qnTemplate",{
                id: qn.id,
                qn: (qns.length-i)+".  "+qn.get('question'),
                hints: qn.get('hints') || "None",
                correct_answer: cAnswer,
                correct: qn.get('results')[2],
                incorrect: qn.get('results')[3],
                notAnswered: qn.get('results')[4],
                percent: qn.get('results')[5],
                responses: Object.keys(qn.get('responses')).length,
                answer: (qn.get('responses')[Parse.User.current().getUsername()] || "").split(' ').join('_'),
                id1: qn.id,
              }).appendTo("#iQuestions");
            }
            $('#iQuestions').listview('refresh');
            var els = document.getElementsByTagName('textarea');
            for(i=0 ; i<els.length ; i++){
              els[i].addEventListener('keydown', function(){ setTimeout(AT.autogrowTextarea, 0, this); });
            }
          },
          error: function(qn, error) {
            hidePageLoading();
            AT.alert('Failed to fetch qns. Error '+error.code +": "+ error.message);
          }
        });
      hidePageLoading();
    },

    downloadGrades: function() {
      var data = [];
      var keys = ["Student Name", "Average"];

      var str;
      var orderedData = [];
      
      for(var i = 0; i < data.length; i++) {
          orderedData.push(data[i].join(','));
      }    

      str = keys.join(',') + '\r\n' + orderedData.join('\r\n');
      var uri = 'data:application/csv;charset=UTF-8,' + encodeURI(str);
      var link = document.createElement("a");
      link.setAttribute("href", uri);
      link.setAttribute("download", "classGrades.csv");

      link.click();
    },

	  refreshCourses: function() {
      var currentUser = Parse.User.current();
      currentUser.fetch();
      showPageLoading();
      $('#recentCourses').empty();
      var userCourses = currentUser.get('courses');
      var keys = Object.keys(userCourses);
      $('#recentCourses').append("<li data-role='list-divider'>Courses You're Enrolled In: "+keys.length+"</li>");
    	var Course = Parse.Object.extend("Course");
      var query = new Parse.Query(Course);
      query.containedIn('ID',keys);
      query.find({
        success: function(courses) {
          $('#onGoingLectures').empty();
          var n =0;
          for (var i = 0; i < courses.length; i++) { 
            var course = courses[i];
            var p = "";
            var CourseData = [];
            var temp = $("#scourseTemplate");
            if (userCourses[course.id]=='admin') {
              temp = $("#acourseTemplate");
              p = " Course PINS: Instructor: "+course.get('codes')[0]+" TA: "+course.get('codes')[1]+" Student: "+course.get('codes')[2];
            }
            else if (userCourses[course.id]=='ta') {
              temp = $("#acourseTemplate");
              p = " Students PIN: "+course.get('codes')[2];
            }
            var classAvg = '_';
            var yourScore = '_';
            if (course.get('studentPercents'))
              var yourScore = course.get('studentPercents')[Parse.User.current().getUsername()];
            if (course.get('classAvg'))
              classAvg = course.get('classAvg');
            CourseData.push({
              id: course.id,
              courseTitle: course.get('title'),
              courseNumber: course.get('code'),
              semester: course.get('semester'),
              school: course.get('school'),
              pins: p,
              yourScore: yourScore || '_',
              classScore: classAvg || '_',
              lecture_count: course.get('lectureCount'),
              id1: course.id,
            });
            temp.template("courseTemplate");
            $.tmpl("courseTemplate",CourseData).appendTo("#recentCourses");
            $('#recentCourses').listview('refresh');

            var Lecture = Parse.Object.extend("Lecture");
            var query = new Parse.Query(Lecture);
            query.equalTo("course", course.id);
            query.descending('createdAt');
            query.find({
              success: function(lectures) {
                for (var j = 0; j < lectures.length; j++) { 
                  var lecture = lectures[j];
                  var now = new Date();
                  var nownow = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds() + 
                  (now.getMonth()+1)*2592000 + now.getDate()*86400;

                  if (nownow <= lecture.get('endTime') && nownow >= lecture.get('startTime')){
                    $('#rDivider').remove();
                    n+=1;
                    var temp = $("#anowlectureTemplate");
                    if (userCourses[course.id]=='student') temp = $("#nowlectureTemplate");
                    temp.template("lectureTemplate");
                    $('#onGoingLectures').prepend("<li id='rDivider' data-theme='c' style='color:green' data-role='list-divider'> On-going Lectures:"+n+"</li>");
                    $('#onGoingLectures').replace
                    $.tmpl("lectureTemplate",{
                      id: lecture.id,
                      lectureTitle: lecture.get('title'),
                      startTime: lecture.get('date')+" at "+lecture.get('time'),
                      duration: lecture.get('duration'),
                      yourScore: 0,
                      classScore:0,
                      info: lecture.get('info'),
                      id1: lecture.id,
                    }).appendTo("#onGoingLectures");
                    if ($('#onGoingLectures').children().length>0) {
                      var currentUser = Parse.User.current();
                      AT.currentCourse = course;
                      $('#Cwelcome-heading').html(course.get('title'));
                      localStorage['courseOwner'] = course.get('owner').id==currentUser.id;
                      localStorage['lectures'] = course.get('lectures');
                      localStorage['lectureCount'] = course.get('lectureCount');
                      $('#onGoingLectures').listview('refresh');
                    }
                  }
                }
                hidePageLoading();
              },
              error: function(lecture, error) {
                hidePageLoading();
                AT.alert('Failed to fetch lectures. Error '+error.code +": "+ error.message);
              }
            });
          }
          hidePageLoading();
          $('#recentCourses').listview('refresh');
        },
        error: function(course, error) {
          AT.alert('Course query failed. Error '+error.code +": "+ error.message);
        }
      });
	  },


    refreshLectures: function() {
      showPageLoading();
      $('#recentLectures').empty();
      $('#recentLectures').append("<li id='divider' data-role='list-divider'>Lectures for this Course: 0</li>");
      if (localStorage['lectures'] != "") {
        var Lecture = Parse.Object.extend("Lecture");
        var query = new Parse.Query(Lecture);
        query.equalTo("course", AT.currentCourse.id);
        query.descending('createdAt');
        query.find({
          success: function(lectures) {
            $('#recentLectures').empty();
            $('#recentLectures').append("<li id='divider' data-role='list-divider'>Lectures for this Course: " + 
            lectures.length+"</li>");
            for (var i = 0; i < lectures.length; i++) { 
              var lecture = lectures[i];

              var now = new Date();
              var nownow = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds() + 
              (now.getMonth()+1)*2592000 + now.getDate()*86400;

              if (nownow > lecture.get('endTime') && Parse.User.current().get('courses')[lecture.get('course')]!='student') {
                var temp = $("#apassedlectureTemplate"); }
              else if (nownow > lecture.get('endTime')) {
                var temp = $("#passedlectureTemplate"); }
              else if (nownow <= lecture.get('endTime') && nownow >= lecture.get('startTime') && Parse.User.current().get('courses')[lecture.get('course')]!='student') {
                var temp = $("#anowlectureTemplate"); }
              else if (nownow <= lecture.get('endTime') && nownow >= lecture.get('startTime')){
                var temp = $("#nowlectureTemplate"); }
              else if (nownow < lecture.get('startTime') && Parse.User.current().get('courses')[lecture.get('course')]!='student') {
                var temp = $("#ascheduledlectureTemplate"); }
              else { var temp = $("#scheduledlectureTemplate"); }

              var results = lecture.get('results');
              var classScore = "_";
              var yourScore = "_";
              if (results && results.length>0) {
                classScore = parseInt(results[0]/(results[2]*results[3])*100);
              }
              if (Parse.User.current().get('courses')[lecture.get('course')]=='student' && lecture.get('correctRecords')) {
                var correct = lecture.get('correctRecords')[Parse.User.current().getUsername()];
                //var incorrect = lecture.get('incorrectRecords')[Parse.User.current().getUsername()];
                if (correct)
                  yourScore = parseInt(correct/results[3]*100);
              }
              temp.template("lectureTemplate");
              $.tmpl("lectureTemplate",{
                id: lecture.id,
                lectureTitle: (lectures.length-i)+".  "+lecture.get('title'),
                startTime: lecture.get('date')+" at "+lecture.get('time'),
                duration: lecture.get('duration').slice(0,-3),
                info: lecture.get('info'),
                yourScore: yourScore,
                classScore:classScore,
                id1: lecture.id,
              }).appendTo("#recentLectures");
            }
            $('#recentLectures').listview('refresh');
          },
          error: function(lecture, error) {
            hidePageLoading();
            AT.alert('Failed to fetch lectures. Error '+error.code +": "+ error.message);
          }
        });
      }
      $('#recentLectures').listview('refresh');
      hidePageLoading();
    },

    getCourseResults: function() {
      showPageLoading();
      if (localStorage['lectures'] != "") {
        var Lecture = Parse.Object.extend("Lecture");
        var query = new Parse.Query(Lecture);
        var classPercents = [];
        var studentPercents ={};
        query.equalTo("course", AT.currentCourse.id);
        query.descending('createdAt');
        query.find({
          success: function(lectures) {
            for (var i = 0; i < lectures.length; i++) { 
              var lecture = lectures[i];

              var results = lecture.get('results');

              var students = Object.keys(lecture.get('feedbacks'));
              if (results && results.length>0)
                classPercents.push(parseInt(results[0]/(results[2]*results[3])*100));
              var records = lecture.get('correctRecords');
              if (records) {
                for (var s = students.length - 1; s >= 0; s--) {
                  var correct = records[students[s]];
                  if (correct)
                    if (studentPercents[students[s]])
                      studentPercents[students[s]].push(parseInt(correct/results[3]*100));
                    else
                      studentPercents[students[s]]=[parseInt(correct/results[3]*100)];
                  else
                    if (studentPercents[students[s]])
                      studentPercents[students[s]].push(0);
                    else
                      studentPercents[students[s]]=[0];
                  //var incorrect = lecture.get('incorrectRecords')[Parse.User.current().getUsername()];

                };
              }

            }
            var classAvg = parseInt(classPercents.reduce(function(a, b) { return a + b })/classPercents.length);
            for (var name in studentPercents) {
              studentPercents[name] = parseInt(studentPercents[name].reduce(function(a, b) { return a + b })/studentPercents[name].length);
            }
            AT.currentCourse.fetch();
            var Course = Parse.Object.extend("Course");
            var query = new Parse.Query(Course);
            
            query.get(localStorage['courseId'], {
              success: function(course) {
                course.set('classAvg',classAvg);
                course.set('studentPercents',studentPercents);
                course.save(null, {
                  success: function(course) {
                    hidePageLoading();
                    AT.currentCourse = course;
                  },
                  error: function(course, error) {
                    hidePageLoading();
                    AT.alert('Failed to update course. Error '+error.code +": "+ error.message);
                  }
                });
              },
              error: function(lecture,error) {
                AT.alert('Failed to retrieve course. Error '+error.code +": "+ error.message);
              }
            });
          },
          error: function(lecture, error) {
            hidePageLoading();
            AT.alert('Failed to fetch lectures. Error '+error.code +": "+ error.message);
          }
        });
      }
      hidePageLoading();
    },


    showGrades: function() {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        query.equalTo("lectureId", localStorage['lectureId']);
        query.ascending('createdAt');
        showPageLoading();
        $('#gradesTitle').html(AT.currentLecture.get('title'));

        var data = [];
        var keys = ['#','Student Name'];
        var lecture = AT.currentLecture;
        query.find({
            success: function(qns) {
              var table = "<table data-role='table' align='center' id='gradesTable' data-mode='reflow' class='ui-body-d ui-shadow table-stripe ui-responsive table-stroke'>"+
              "<thead class='ui-bar-d'><tr><th data-priority='1'>#</th><th data-priority='persist'>Student Name</th>";
              usernames = [];

              for (var j = 0; j<qns.length; j++) {
                usernames = usernames.concat(Object.keys(qns[j].get('responses'))).filter(onlyUnique);
                if (qns[j].get('include')=='Yes')
                  table+="<th data-priority='"+(j+2)+"'>Qn#"+(j+1)+"</th>";
                keys.push("Qn#"+(j+1));
              }


              keys.push('%C');
              table+="<th data-priority='"+(qns.length+2)+"'><abbr style='color:green' title='Percentage Correct'>%C</abbr></th></tr></thead><tbody>";
              for (var u = 0; u<usernames.length; u++) {
                userData = [u+1,AT.names[usernames[u]]];
                count = 0;
                totalQns = 0;
                table+="<tr><th>"+(u+1)+"</th><td>"+AT.names[usernames[u]]+"</td>";
                for (var i = 0; i<qns.length; i++) {
                  var iQn = qns[i];
                  if (iQn.get('include')=='Yes') {
                    totalQns+=1;
                    var found = false;
                    var summary = JSON.parse(iQn.get('summary'));
                    for (var answer in summary) {
                      var names = summary[answer].split(':::');
                      if (names.indexOf(usernames[u])!=-1) {
                        found = true;
                        if (iQn.get('answers').indexOf(answer)!=-1) {
                          table+="<td style='font-weight:bold' class='now'>C</td>";
                          userData.push('C');
                          count+=1;
                        }
                        else { 
                          table+="<td style='font-weight:bold' class='passed'>I</td>";
                          userData.push('I');
                        }
                        break;
                      }
                    }
                    if (!found) {
                      table+="<td style='font-weight:bold'>-</td>";
                      userData.push('-');
                    }
                  }
                }
                table+="<td class='now'>"+parseInt(count*100/totalQns)+"%</td></tr>";
                userData.push(parseInt(count*100/totalQns));
                data.push(userData);
              }
              table+="</tbody></table>";
              AT.data = data;
              AT.keys = keys;

              // console.log(table);
              $('#gradesTable').html(table);
              $('#gradesTable').table();

              $('#downloadGrades').bind('click', function(event, data) {
                event.stopImmediatePropagation();
                showPageLoading();

                var str;
                var orderedData = [];
                
                for(var i = 0; i < AT.data.length; i++) {
                    orderedData.push(AT.data[i].join(','));
                }    

                str = AT.keys.join(',') + '\r\n' + orderedData.join('\r\n');
                var uri = 'data:application/csv;charset=UTF-8,' + encodeURI(str);
                var link = document.createElement("a");
                link.setAttribute("href", uri);
                link.setAttribute("download", AT.currentLecture.get('title')+" -Grades.csv");

                link.click();
                hidePageLoading();
              });
            },
            error: function(qn, error) {
              hidePageLoading();
              AT.alert('Failed to fetch qns. Error '+error.code +": "+ error.message);
            }
          });
        hidePageLoading(); 
      }
    },

    getNames: function() {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        query.equalTo("lectureId", localStorage['lectureId']);
        query.ascending('createdAt');
        
        var lecture = AT.currentLecture;
        query.find({
            success: function(qns) {
              usernames = [];
              for (var j = 0; j<qns.length; j++) {
                usernames = usernames.concat(Object.keys(qns[j].get('responses'))).filter(onlyUnique);
              }
              AT.names = {};
              for (var i = usernames.length - 1; i >= 0; i--) {
                var User = Parse.Object.extend("User");
                var query = new Parse.Query(User);
                query.select("username", "firstName", "lastName");
                query.equalTo('username',usernames[i]);
                query.first({
                  success: function(object) {
                    if (object.get('lastName')==undefined)
                      AT.names[object.get('username')] = object.get('firstName');
                    else
                      AT.names[object.get('username')] = object.get('firstName')+" "+object.get('lastName');
                  },
                  error: function(error) {
                    alert("Error: " + error.code + " " + error.message);
                  }
                });   
              };
            },
            error: function(qn, error) {
              AT.alert('Failed to fetch qns. Error '+error.code +": "+ error.message);
            }
          });
      }
    },

    refreshPosts: function(n) {
      localStorage['inputText']=$(localStorage['textarea']).val();
      if ($.mobile.activePage.attr('id')=='engagedPage' || $.mobile.activePage.attr('id')=='engagedMessages' ||
        $.mobile.activePage.attr('id')=='boredPage' || $.mobile.activePage.attr('id')=='confusedPage' ||
        $.mobile.activePage.attr('id')=='ta-portalPage') {
        
        var timers = [AT.messagesTimer, AT.messagesTimer1, AT.messagesTimer2, AT.messagesTimer3, AT.messagesTimer4];
        if (n) var timer = timers[parseInt(n)];
        else var timer = timers[0];

        var lecture = AT.currentLecture;
        lecture.fetch({
            success: function(lecture) {
              AT.currentLecture = lecture;
              var counts = {'Engaged':0,'Bored':0,'Confused':0};
              var feedbacks = lecture.get('feedbacks');
              for (var key in feedbacks) { counts[feedbacks[key]]+=1; }
              $("#engagedCount"+n).html(counts['Engaged']);
              localStorage['boredCount'] = counts['Bored'];
              $("#boredCount"+n).html(counts['Bored']);
              localStorage['engagedCount'] = counts['Engaged'];
              $("#confusedCount"+n).html(counts['Confused']);
              localStorage['confusedCount'] = counts['Confused'];

            },
            error: function(lecture, error) {
              AT.alert("Fetching current lecture failed: " + error.code + " " + error.message);
            }
        });

        var Post = Parse.Object.extend("Post");
        var query = new Parse.Query(Post);
        query.equalTo("lectureId", localStorage['lectureId']);
        query.descending('createdAt');
        query.find({
          success: function(posts) {
            var set = $("#postsCollapsibleSet"+n); 
            set.empty();

            for (var p=0, j=posts.length; p < j; p++) {
              var post = posts[p];
              if (post.get('type')=='unresolved' && post.get('user')==Parse.User.current().getUsername()) {
                if (localStorage[post.id]) {
                  if (post.get('responses').length > localStorage[post.id] && Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
                    var size = post.get('responses').length;
                    localStorage[post.id] = size;
                    if (post.get('responses')[size-1].split('|||')[1]!=Parse.User.current().getUsername()) {
                      localStorage['postId']=post.id;
                      if (Parse.User.current().get('firstName'))
                        window.alert(Parse.User.current().get('firstName')+", There is a new response to a question you submitted!");
                      else
                        window.alert(Parse.User.current().getUsername()+", There is a new response to a question you submitted!");
                      $.mobile.changePage('#engagedMessages', {
                        transition: 'flip',
                        reverse: true
                      });
                      setTimeout(function(){$('#collapsible_'+localStorage['postId']).trigger('expand');},1000)
                    }
                  }
                }
                else
                  localStorage[post.id] = post.get('responses').length;
              }
              if (n) {
                if (post.get('type')=='unresolved' && (post.get('user')==Parse.User.current().getUsername() ||
                 Parse.User.current().get('courses')[AT.currentCourse.id]!="student")) {
                  var collapsible = $("<div class='collapsible' data-role='collapsible' data-theme='a' data-collapsed-icon='question' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+"<span style='float:right;' class='button-span'> <input type='button' value='Options' id="+post.id+
                  " data-mini='true' onclick='AT.postOptions(event,this.id,"+n+"); return false' data-inline='true'/>"+
                  "</span><span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }
                else if (post.get('type')=='unresolved') {
                  var collapsible = $("<div data-role='collapsible' class='collapsible' data-theme='a' data-collapsed-icon='question' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+
                  "</span><span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }
                else if (post.get('type')=='anonymous' && (post.get('user')==Parse.User.current().getUsername() ||
                 Parse.User.current().get('courses')[AT.currentCourse.id]!="student")) {
                  var collapsible = $("<div class='collapsible' data-role='collapsible' data-theme='c' data-collapsed-icon='anonymous' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+"<span style='float:right;' class='button-span'> <input type='button' value='Options' id="+post.id+
                  " data-mini='true' onclick='AT.postOptions(event,this.id,"+n+"); return false' data-inline='true'/>"+
                  "</span><span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }
                else if (post.get('type')=='anonymous') {
                  var collapsible = $("<div data-role='collapsible' class='collapsible' data-theme='c' data-collapsed-icon='anonymous' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+
                  "</span><span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }

                else if (post.get('type')=='resolved' && (post.get('user')==Parse.User.current().getUsername() ||
                  Parse.User.current().get('courses')[AT.currentCourse.id]!="student")) {
                  var collapsible = $("<div data-role='collapsible' class='collapsible' data-theme='b' data-collapsed-icon='check' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+"<span style='float:right;' class='button-span'> <input type='button' value='Options' id="+post.id+
                  " data-mini='true' onclick='AT.postOptions(event,this.id,"+n+"); return false' data-inline='true'/>"+
                  "</span><span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }
                else if (post.get('type')=='resolved') {
                  var collapsible = $("<div data-role='collapsible' class='collapsible' data-theme='b' data-collapsed-icon='check' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+"<span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }
                else if (post.get('user')==Parse.User.current().getUsername() || Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
                  var collapsible = $("<div data-role='collapsible' class='collapsible' data-theme='e' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+"<span style='float:right;' class='button-span'> <input type='button' value='Options' id="+post.id+
                  " data-mini='true' onclick='AT.postOptions(event,this.id,"+n+"); return false' data-inline='true'/>"+
                  "</span><span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }
                else {
                  var collapsible = $("<div data-role='collapsible' class='collapsible' data-theme='e' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u'></div>");
                  collapsible.append("<h2>"+post.get('post')+"<span class='ui-btn-up-c' title='Responses' style='float:right;'>"+post.get('responses').length+"</span></h2>");
                }

                collapsible.attr('id','collapsible_'+post.id);
                var list = $("<ul data-role='listview'></ul>");
                //list.attr('id','listview_'+post.id);

                for (var i=0, l=post.get('responses').length; i < l; i++) {
                  var response = post.get('responses')[i].split('|||');
                  if (post.get('type')=='anonymous' && Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
                    if (response[3]=='student')
                      list.append("<li><text style='font-size:10px'>"+response[0]+": </text><strong>student</strong>: "+response[2]+"</li>");
                    else
                      list.append("<li><text style='font-size:10px'>"+response[0]+": </text><strong>TA/Instr.</strong>: <text style='color:blue'>"+response[2]+"</text></li>");
                  }
                  else {
                    if (response[3]=='student')
                      list.append("<li><text style='font-size:10px'>"+response[0]+": </text><strong>"+response[1]+
                      "</strong>: "+response[2]+"</li>");
                    else
                      list.append("<li><text style='font-size:10px'>"+response[0]+": </text><strong>"+response[1]+
                      "</strong>: <text style='color:blue'>"+response[2]+"</text></li>");
                  }
                }
                if (n!='3') {
                  var text = $("<fieldset class='ui-grid-a'><div class='ui-block-a main'><input type='text' data-clear-btn='true' value='' placeholder='New Response' data-theme='c'></div><div class='ui-block-b side'><button id="+
                    post.id+" data-icon='check' data-iconpos='notext' onclick='AT.submitResponse(event,this.id,"+n+"); return false'"+
                    " data-theme='b'>Submit Response</button></div></fieldset>");
                  text.children()[0].firstChild.id = 'textarea_'+post.id;
                  text.children()[0].firstChild.name = 'textarea_'+post.id;
                  list.append(text); }
                collapsible.append(list);
                set.append(collapsible);
              }
              set.trigger('create');

              $(":input[name^='textarea_']").keypress(function(event) {
                if (event.keyCode == '13') {
                  event.stopImmediatePropagation();
                  event.preventDefault();
                  AT.submitResponse(event,this.id.split('_')[1],localStorage['n']);
                }
              });
            }
            if (AT.expanded) {
              if (AT.expanded.length>0) {
                var id = AT.expanded[0].split('_')[1];
                $('#collapsible_'+id).trigger('expand');
                $(localStorage['textarea']).val(localStorage['inputText']);
                $(localStorage['textarea']).focus();
              }
            }
            
            $(":input[name^='textarea_']").on('click', function(event) {
              event.stopImmediatePropagation();
              event.preventDefault();
              localStorage['textarea']='#'+$(this).attr('id');
            });
        
            
            $("div:jqmData(role='collapsible')").bind('expand', function () {
              AT.expanded = [$(this).attr('id')];
            }).bind('collapse', function () {
              if (AT.expanded && AT.expanded.length>0 && $(this).attr('id')==AT.expanded[0])
                AT.expanded = [];
            });
          },
          error: function(qn, error) {
            AT.alert('Failed to fetch posts. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

    refreshOverview: function() {
      $("#chartContainer").height($("body").height()-(45+$("#header4").height()+$("#footer4").height()));
      var counts = {'Engaged':0,'Bored':0,'Confused':0};
      var allColors = ["green","#D7DF01","red"];
      var colors = [];
    
      
      AT.currentLecture.fetch({
        success: function(lecture) {
          AT.currentLecture = lecture;
          var feedbacks = lecture.get('feedbacks');
          for (var key in feedbacks) {
            counts[feedbacks[key]]+=1; }
          counts = [counts['Engaged'],counts['Bored'],counts['Confused']];
          if (localStorage['lectureInactive']=="true") {
            if (counts[0]+counts[1]+counts[2] == 0) {
              var text = "No Feedbacks have been recorded"; }
            else {
              var text = "Latest feedbacks recorded"; }
          }
          else {
            $("#overviewContent").append("<img id='overviewLogo' src='img/app-icon.gif' style='position: absolute; z-index:1000; top: "+$("#chartContainer").height()/2+"px; left: "+($("#chartContainer").width()/2-30)+"px;'/>");
            if (counts[0]+counts[1]+counts[2] == 0) {
              var text = "No Feedbacks recorded, "+timeConverter(new Date().toLocaleTimeString()); }
            else {
              var text = "Latest Feedbacks at "+timeConverter(new Date().toLocaleTimeString()); }
          }
          var data = [];
          var labels = ["ENGAGED","BORED","CONFUSED"];
          for (var i=0, l=counts.length; i < l; i++) {
            if (counts[i]) {
              data.push({y: counts[i], indexLabel: labels[i]+": "+counts[i]});
              colors.push(allColors[i]);
            }
          }
          CanvasJS.addColorSet("affectColors",colors);

          var chart = new CanvasJS.Chart("chartContainer", {
            colorSet: "affectColors",
            backgroundColor: "rgb(249,249,249)",
            width: $("#chartContainer").width(),
            height: $("#chartContainer").height(),
            indexLabelLineColor: "black",
            zoomEnabled:true,
              title: {
                fontSize: 18,
                padding: 10,
                backgroundColor: "#FFFFE0",
                borderThickness: 1,
                cornerRadius: 5,
                fontWeight: "bold",
                text: text },
              data: [{
               type: "doughnut",
               startAngle: 270,
                indexLabelFontColor: "black",
                indexLabelPlacement: "inside",
                indexLabelFontSize: 14,
                indexLabelLineColor: "white",
                indexLabelFontWeight: "bold",
               dataPoints: data}]
           });
            $('#overviewLogo').remove();
            chart.render();
        },
        error: function(lecture, error) {
          AT.alert("Failed to fetch current Lecture: " + error.code + " " + error.message);
        }
      });
  
      var Post = Parse.Object.extend("Post");
        var query = new Parse.Query(Post);
        query.equalTo("lectureId", localStorage['lectureId']);
        query.find({
          success: function(posts) {
            $('#postsCount').html(posts.length);
          },
          error: function(qn, error) {
            AT.alert('Failed to fetch posts. Error '+error.code +": "+ error.message);
          }
        });
    },

    launchLecture: function(id) {
      var Lecture = Parse.Object.extend("Lecture");
      var query = new Parse.Query(Lecture);
      showPageLoading();
      query.get(id, {
        success: function(lecture) {
          var now = new Date();
          var currentTime = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds() + 
          (now.getMonth()+1)*2592000 + now.getDate()*86400;
          if (currentTime < lecture.get('startTime') || currentTime > lecture.get('endTime')) {
            localStorage['lectureInactive'] = true; }
          else { localStorage['lectureInactive'] = false; }
          
          $('#Lwelcome-heading').html(lecture.get('title'));
          localStorage['lectureId'] = lecture.id;
          AT.currentLecture = lecture;
          hidePageLoading();
          if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
            $.mobile.changePage('#engagedPage', {
              transition: 'flip',
              reverse: true
            });
          }
          else {
            $.mobile.changePage('#overviewPage', {
              transition: 'flip',
              reverse: true
            });
          }
        },
        error: function(lecture, error) {
          hidePageLoading();
          AT.alert('Lecture query failed. Error '+error.code +": "+ error.message);
        }
      });
    },

    launchCourse: function(id,navigate) {
      var currentUser = Parse.User.current();
      var Course = Parse.Object.extend("Course");
      var query = new Parse.Query(Course);
      showPageLoading();
      query.get(id, {
        success: function(course) {
          AT.currentCourse = course;
          $('#Cwelcome-heading').html(course.get('title'));
          localStorage['courseOwner'] = course.get('owner').id==currentUser.id;
          localStorage['lectures'] = course.get('lectures');
          localStorage['lectureCount'] = course.get('lectureCount');
          hidePageLoading();
          if (navigate) {
            $.mobile.changePage('#coursePage', {
              transition: 'flip',
              reverse: true
            });
          }
        },
        error: function(course, error) {
          hidePageLoading();
          AT.alert('Course query failed. Error '+error.code +": "+ error.message);
        }
      });
    },

    createPost: function(event,n) {
      event.stopImmediatePropagation();
      event.preventDefault();
      if ($('#post'+n).val()=="")
        AT.alert("Enter post title/text!");
      else if (!$("input[name*=PostRadios"+n+"]:checked").val())
        AT.alert("Select a post type!");
      else {
        var post = Parse.Object.extend("Post");
        var post = new post();
        showPageLoading();
        post.set({
          post: $('#post'+n).val(),
          type: $("input[name*=PostRadios"+n+"]:checked").val(),
          lectureId: localStorage['lectureId'],
          responses: [],
          user: Parse.User.current().getUsername(),
        });

        post.save(null, {
          success: function(post) {
            AT.refreshPosts(n);
            $("#popupCreatePost"+n).popup("close");
            hidePageLoading();
            AT.alert("Success: Post Created!");
            if (post.get('type')=='unresolved' && Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
              AT.alert("All set: I'll notify you when someone responds!",5000);
              setTimeout(function(){
                $.mobile.changePage('#engagedPage', {
                  transition: 'flip',
                  reverse: true
                });
              },4000)
            }
          },
          error: function(qn, error) {
            hidePageLoading();
            AT.alert('Failed to create Post. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

    submitResponse: function(event,id,n) {
      event.stopImmediatePropagation();
      event.preventDefault();

      var timers = [AT.messagesTimer, AT.messagesTimer1, AT.messagesTimer2, AT.messagesTimer3, AT.messagesTimer4];
      if (n) var timer = timers[parseInt(n)];
      else var timer = timers[0];

      var post = Parse.Object.extend("Post");
      var query = new Parse.Query(post);
      showPageLoading();
      query.get(id, {
        success: function(post) {
          if ($('#textarea_'+id).val()) {
            if (Parse.User.current().get('courses')[AT.currentCourse.id]=='student')
              post.add('responses',timeConverter(new Date().toLocaleTimeString())+"|||"+
          Parse.User.current().getUsername()+"|||"+$('#textarea_'+id).val()+"|||student");
            else 
              post.add('responses',timeConverter(new Date().toLocaleTimeString())+"|||"+
          Parse.User.current().getUsername()+"|||"+$('#textarea_'+id).val()+"|||other");
            post.save(null, {
              success: function(post) {
                $(localStorage['textarea']).val("");
                AT.refreshPosts(n);
                for (var i=0; i < parseInt(n); i++) {
                  clearInterval(timer);
                }
                timer=setInterval(function(){AT.refreshPosts(n);},10000);
                setTimeout(function(){$('#collapsible_'+id).trigger('expand');},500)
              },
              error: function(qn,error) {
                AT.alert('Action failed. Error '+error.code +": "+ error.message);
              }
            });
          }
          else {AT.alert("Please enter a response!"); }
          hidePageLoading();
        },
        error: function(qn,error) {
          hidePageLoading();
          AT.alert('Failed to retrieve Question. Error '+error.code +": "+ error.message);
        }
      });
    },

    toggleResolved: function(state,n) {
      var post = AT.post;
      if (post.get('user')==Parse.User.current().getUsername() || Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        if (state=='Yes') post.set('type','resolved');
        else post.set('type','unresolved');
        post.save(null, {
          success: function(post) {
            AT.refreshPosts(n);
            AT.post = post;
          },
          error: function(qn,error) {
            AT.alert('Action failed. Error '+error.code +": "+ error.message);
          }
        });
        hidePageLoading();
      }
    },

    postOptions: function(event,id,n) {
      event.stopImmediatePropagation();
      event.preventDefault();
      $('#postOptions'+n).popup();
      $('#postOptions'+n).popup('open');

      var post = Parse.Object.extend("Post");
      var query = new Parse.Query(post);
      showPageLoading();
      query.get(id, {
        success: function(post) {
          AT.post = post;
          $('#resolvedSlider'+n).slider('enable');
          if (post.get('type')=='resolved') $('#resolvedSlider'+n).val('Yes').slider("refresh");
          else if (post.get('type')=='unresolved') $('#resolvedSlider'+n).val('No').slider("refresh");
          else {
            $('#resolvedSlider'+n).slider('disable');
          }
          hidePageLoading();
        },
        error: function(qn,error) {
          hidePageLoading();
          AT.alert('Failed to retrieve Question. Error '+error.code +": "+ error.message);
        }
      });
    },

    editPost: function(n) {
      setTimeout(function(){$('#popupEditPost'+n).popup('open');},1000)
      
      var post = AT.post;
      if (post.get('user')==Parse.User.current().getUsername() || Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
     
        $("input[type='radio']").checkboxradio();
        $('#post0'+n).val(post.get('post'));
        if (post.get('type')=='general')
          $('#radioGeneral0'+n).trigger('click');
        else
          $('#radioQuestion0'+n).trigger('click');
        $("input[type='radio']").checkboxradio("refresh");
        
        $('#editPost0'+n).bind('click', function(event1, data) {
          event1.stopImmediatePropagation();
          event1.preventDefault();
          showPageLoading();
          post.set({
            post: validator.trim($('#post0'+n).val()),
            type: $("input[name*=PostRadios0"+n+"]:checked").val(),
          });
          post.save(null, {
            success: function(post) {
              AT.refreshPosts(n);
              AT.post = post;
              $('#popupEditPost'+n).popup('close');
              hidePageLoading();
            },

            error: function(iQn, error) {
              hidePageLoading();
              AT.alert('Failed to save post. Error '+error.code +": "+ error.message);
            }
          });
        });  
      }
    },

    deletePost: function(n) {
      var post = AT.post;
      showPageLoading();
      if (post.get('user')==Parse.User.current().getUsername() || Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        post.destroy({
          success: function(post) {
            AT.refreshPosts(n);
            AT.post = '';
            $('#postOptions'+n).popup('close');
            hidePageLoading();
          },
          error: function(post, error) {
            hidePageLoading();
            AT.alert('Failed to delete post. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

    iDelete: function() {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]=="admin") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            iQn.destroy(null, {
              success: function(qn) {
                hidePageLoading();
              },
              error: function(qn,error) {
                hidePageLoading();
                AT.alert('Deletion failed. Error '+error.code +": "+ error.message);
              }
            });
            AT.refreshiPanel();
            $("#iQuestionOptions").popup('close');
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

    showSummaries: function() {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(qn) {
            $("#summaryPopup").popup();
            var responses = qn.get('responses');
            if (qn.get('type')=="Numeric" && qn.get('answer'))
              var correctAnswer = String(Number(qn.get('answer')).toFixed(2));
            else if (qn.get('answer')) 
              var correctAnswer = qn.get('answer').toLowerCase();
            var counts = {};
            for (var key in responses) {
              var response = responses[key].split('\n').join(' ');
              if (qn.get('type')=="Numeric") {
                var entry = String(Number(validator.trim(response)).toFixed(2));
              }
              else {
                var entry = validator.trim(response).toLowerCase();
              }
              if (counts[entry]) counts[entry].push(key);
              else counts[entry] = [key];
            }
            var sorted_counts = [];
            for (var answer in counts) {
              sorted_counts.push([answer, counts[answer].length]); }
            sorted_counts.sort(function(a, b) {return a[1] - b[1]});
            sorted_counts.reverse();
            counts2={};
            for (var i=0, l=sorted_counts.length; i < l; i++) {
              counts2[String(sorted_counts[i][0])]=counts[sorted_counts[i][0]].join(':::'); }
            qn.set('summary',JSON.stringify(counts2));
            var answers = qn.get('answers');
            if (correctAnswer && answers.indexOf(correctAnswer)==-1) {
              answers.push(correctAnswer);
              qn.set('answers',answers); 
            }
            qn.save(null, {
              success: function(qn) {
                AT.refreshiPanel();
                setTimeout(function(){$("#summaryPopup").popup('open',{transition: "flip", positionTo:"#iHeader"});},1000)
              },
              error: function(qn,error) {
                AT.alert('Saving summary failed. Error '+error.code +": "+ error.message);
              }
            });
            AT.refreshiPanel();
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
      }
      else setTimeout(function(){$("#summaryPopup").popup('open',{transition: "flip", positionTo:"#iHeader"});},1000)
    },

    toggleLock: function(action) {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            if (action=="Off") iQn.set('active',false);
            else iQn.set('active',true);
            iQn.save(null, {
              success: function(qn) {
                AT.showSummaries();
                setTimeout(function(){AT.getResults();},1000)
                setTimeout(function(){AT.refreshiPanel();},2000)
              },
              error: function(qn,error) {
                AT.alert('Submission failed. Error '+error.code +": "+ error.message);
              }
            });
            AT.refreshiPanel();
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
        AT.refreshiPanel();
      }
    },

    toggleSave: function(action) {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            if (action=="No") iQn.set('include',"No");
            else iQn.set('include',"Yes");
            iQn.save(null, {
              success: function(qn) {
              },
              error: function(qn,error) {
                AT.alert('Submission failed. Error '+error.code +": "+ error.message);
              }
            });
            AT.refreshiPanel();
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
        AT.refreshiPanel();
      }
    },

    toggleAnswer: function(action) {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            if (action=="Off") iQn.set('showAnswer',false);
            else iQn.set('showAnswer',true);
            iQn.save(null, {
              success: function(qn) {
                AT.refreshiPanel();
              },
              error: function(qn,error) {
                AT.alert('Submission failed. Error '+error.code +": "+ error.message);
              }
            });
            AT.refreshiPanel();
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
        AT.refreshiPanel();
      }
    },

    toggleResponse: function(event,value,action) {
      event.stopImmediatePropagation();
      event.preventDefault();
      AT.value = value;
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            var answers = iQn.get('answers');
            AT.value = AT.value.split('||').join(' ').toLowerCase();
            
            if (action==0) {
              answers.splice(answers.indexOf(AT.value),1);
              if (AT.value==iQn.get('answer'))
                iQn.set('answer','');
            }

            else if (answers.indexOf(AT.value)==-1) {
              answers.push(AT.value);
            }
            iQn.set('answers',answers);
            iQn.save(null, {
              success: function(qn) {
                setTimeout(function(){AT.getResults();},1000)
                setTimeout(function(){AT.refreshiPanel();},2000)
                $('#summaryResponses').click();
              },
              error: function(qn,error) {
                AT.alert('Action failed. Error '+error.code +": "+ error.message);
              }
            });
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

    getcurrentLecture: function() {
      var Lecture = Parse.Object.extend("Lecture");
      var query = new Parse.Query(Lecture);
      
      query.get(localStorage[lectureId], {
        success: function(lecture) {
          AT.currentLecture = lecture;
          return lecture;
        },
        error: function(lecture,error) {
          AT.alert('Failed to retrieve lecture. Error '+error.code +": "+ error.message);
        }
      });
    },

    getResults: function() {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        query.equalTo("lectureId", localStorage['lectureId']);
        query.descending('createdAt');
        showPageLoading();
        AT.currentLecture.fetch();
        var correctRecords = {};
        var incorrectRecords = {};
        var correctCount = 0;
        var incorrectCount = 0;
        var qnCount = 0;
        var lecture = AT.currentLecture;
        query.find({
            success: function(qns) {
              var present = Object.keys(lecture.get('feedbacks')).length;
              for (var i = qns.length - 1; i >= 0; i--) {
                var iQn = qns[i];

                if (iQn.get('include')=='Yes') {
                  qnCount +=1;
                  var answered = Object.keys(iQn.get('responses')).length;
                  var summary = JSON.parse(iQn.get('summary'));
                  var correct = 0;
                  for (var answer in summary) {
                    response = [answer, summary[answer].split(':::')];
                    if (iQn.get('answers').indexOf(response[0])!=-1) {
                      correct+=response[1].length;
                      correctCount+=response[1].length;
                    }
                    else incorrectCount+=response[1].length;

                    var names = summary[answer].split(':::');
                    for (var name in names) {
                      if (iQn.get('answers').indexOf(answer)!=-1) {
                        if (correctRecords[names[name]]) correctRecords[names[name]]+=1;
                        else correctRecords[names[name]]=1;
                      }
                      else {
                        if (incorrectRecords[names[name]]) incorrectRecords[names[name]]+=1;
                        else incorrectRecords[names[name]]=1;
                      }
                    }
                  }
                  var incorrect = answered - correct;
                  var notAnswered = present - answered;
                  iQn.set('results',[present,answered,correct,incorrect,notAnswered,parseInt(correct/present*100)]);
                  iQn.save(null, {
                    success: function(qn) {
                    },
                    error: function(qn,error) {
                      AT.alert('Failed to save results. Error '+error.code +": "+ error.message);
                    }
                  });
                }
              };
              if (qnCount>0) {
                var Lecture = Parse.Object.extend("Lecture");
                var query = new Parse.Query(Lecture);
                
                query.get(localStorage['lectureId'], {
                  success: function(lecture) {
                    AT.currentLecture = lecture;
                    lecture.set('correctRecords',correctRecords);
                    lecture.set('incorrectRecords',incorrectRecords);
                    lecture.set('results',[correctCount,incorrectCount,present,qnCount]);
                    lecture.save(null, {
                      success: function(lecture1) {
                        AT.currentLecture = lecture1;
                      },
                      error: function(lecture1,error) {
                        AT.alert('Failed to update lecture. Error '+error.code +": "+ error.message);
                      }
                    });
                  },
                  error: function(lecture,error) {
                    AT.alert('Failed to retrieve lecture. Error '+error.code +": "+ error.message);
                  }
                });
              }
            },
            error: function(qn, error) {
              hidePageLoading();
              AT.alert('Failed to fetch qns. Error '+error.code +": "+ error.message);
            }
          });
        hidePageLoading(); 
      }
    },

    showHideAnswer: function(field,Button) {
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        field = $(field);
        if (field.attr('type')=="password") {
          field.attr('type','text');
          $(Button).buttonMarkup({ icon: "hide" });
        }
        else {
          field.attr('type','password');
          $(Button).buttonMarkup({ icon: "show" });
        }
      }
    },

    iEdit: function() {
      $('#editIPopup').popup();
      if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student") {
        $('#iQuestionOptions').popup('close');
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        setTimeout(function(){$("#editIPopup").popup('open',{transition: "flip"});},1000)
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            $("input[type='radio']").checkboxradio();
            hidePageLoading();
            AT.iQuestion = iQn;
            $('#question11').val(iQn.get('question'));
            $('#radio'+iQn.get('type')+'11').trigger('click');
            $("input[type='radio']").checkboxradio("refresh");
            $('#answer11').val(iQn.get('answer'));
            $('#hints11').val(iQn.get('hints'));
            $('#saveSwitch11').val(iQn.get('include'));
            $('#saveSwitch11').slider('refresh');
            $('#editiQuestion').bind('click', function(event1, data) {
              iQn = AT.iQuestion;
              event1.stopImmediatePropagation();
              event1.preventDefault();
              showPageLoading();
              iQn.set({
                question: validator.trim($('#question11').val()),
                type: $("#answerRadio11 :radio:checked").val(),
                answer: validator.trim($('#answer11').val()),
                include: $('#saveSwitch11').val(),
                hints: validator.trim($('#hints11').val()),
              });
              iQn.save(null, {
                success: function(iQn) {
                  AT.refreshiPanel();
                  AT.iQuestion = iQn;
                  hidePageLoading();
                  $('#answer11').val('');
                  $('#hints11').val('');
                  $('#radio'+iQn.get('type')+'11').attr("checked",false).checkboxradio("refresh");
                  $("input[type='radio']").checkboxradio("refresh");
                  $("#editIPopup").popup("close");
                },

                error: function(iQn, error) {
                  hidePageLoading();
                  AT.alert('Failed to create iQuestion. Error '+error.code +": "+ error.message);
                }
              });
            });
            AT.refreshiPanel();
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });
      }
    },

  };
}();


$(document).ready(function() { AT.init(); });


window.onfocus = function () { AT.onFocus = true; }; 
window.onblur = function () { AT.onFocus = false; }; 



















$(document).on('click','#createiQuestion', function(event, data) {
    event.stopImmediatePropagation();
    event.preventDefault();
    var iQuestion = Parse.Object.extend("iQuestion");
    var qn = new iQuestion();
    showPageLoading();
    qn.set({
      question: validator.trim($('#question').val()),
      type: $("input[name*=answer-radios]:checked").val(),
      active: true,
      showAnswer: false,
      responses: {},
      answer: validator.trim($('#answer').val()),
      answers: [],
      results: [],
      include: $('#saveSwitch').val(),
      hints: validator.trim($('#hints').val()),
      lectureId: localStorage['lectureId'],
    });

    qn.set('type',$("input[name*=answer-radios]:checked").val());
    qn.save(null, {
      success: function(qn) {
        AT.refreshiPanel();
        hidePageLoading();
        $("#newIPopup").popup("close");
      },
      error: function(qn, error) {
        hidePageLoading();
        AT.alert('Failed to create iQuestion. Error '+error.code +": "+ error.message);
      } });
    event.preventDefault();
  });

$(document).on('pagebeforeshow','#iResponderPage', function(event,data) {
  if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
    $("#newiQuestionButton").hide(); }
  else { $("#newiQuestionButton").show(); }
	AT.refreshiPanel();
  localStorage['previousPage']=data.prevPage.attr("id");
});

$(document).on('pageshow','#iResponderPage', function() {
  if (localStorage['lectureInactive']!="true") {
    clearInterval(AT.iTimer);
    AT.iTimer=setInterval(function(){AT.refreshiPanel();},15000); }
  
  $('#iQuestions').on('click', 'a', function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    AT.iQuestionId = $(this).attr('id');
    if ($(this).attr('data-rel')=="popup") {
      $('#iQuestionOptions').popup();
      if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
        AT.submitAnswer($(this).parent().get(0).childNodes[0].childNodes[0].childNodes[0].childNodes[6].value,$(this).attr('id1'));
      }
      else { 
        $('#iQuestionOptions').popup('open');
        var iQuestion = Parse.Object.extend("iQuestion");
        var query = new Parse.Query(iQuestion);
        showPageLoading();
        query.get(AT.iQuestionId, {
          success: function(iQn) {
            if (iQn.get('active')) $('#lockSlider').val('On').slider("refresh");
            else $('#lockSlider').val('Off').slider("refresh");
            if (iQn.get('showAnswer')) $('#answerSlider').val('On').slider("refresh");
            else $('#answerSlider').val('Off').slider("refresh");
            if (iQn.get('include')=='Yes') $('#saveSlider').val('Yes').slider("refresh");
            else $('#saveSlider').val('No').slider("refresh");
            hidePageLoading();
          },
          error: function(qn,error) {
            hidePageLoading();
            AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
          }
        });}}
    else { AT.showSummaries(); }
  });

  $('#iQuestions').on('click', 'textarea', function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    clearInterval(AT.iTimer);
  });

  $('#iQuestions').on('click', 'select', function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    clearInterval(AT.iTimer);
  });
});

$(document).on('pagehide','#iResponderPage', function() {
    clearInterval(AT.iTimer);
});


$(document).on('click','#summaryChart', function(event, data) {
  event.stopImmediatePropagation();
  event.preventDefault();
  var iQuestion = Parse.Object.extend("iQuestion");
  var query = new Parse.Query(iQuestion);
  query.get(AT.iQuestionId, {
    success: function(iQn) {
      if (AT.mark) {
        $('#summaryResponses').click();
      }
      else {
        if (!iQn.get('summary')) { 
          $("#summaryPopup").popup('close');
          AT.alert("No Response Summaries"); }
        else if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student" && iQn.get('active')) {
          $("#summaryPopup").popup('close');
          AT.alert("No Response Summaries");
        }
        else {
          var summary = JSON.parse(iQn.get('summary'));
          var data = [];
          var summaryColors = ["#369EAD","#7F6084","#A2D1CF","#C8B631","#6DBCEB","#52514E","#4F81BC","#A064A1","#F79647","#9BBB58"];
          var i = 0;
          for (var answer in summary) {
            if (iQn.get('showAnswer')) {
              if (iQn.get('answers').indexOf(answer)!=-1) { summaryColors[i]="green"; }}
            data.push({y: summary[answer].split(':::').length, indexLabel: answer+": "+summary[answer].split(':::').length});
            i+=1;
            if (i>=10) break;
          }

          CanvasJS.addColorSet("summaryColors", summaryColors); 
          $("#summaryList").empty();
          $("#summaryChartContainer").empty();
          var chart = new CanvasJS.Chart("summaryChartContainer", {
            colorSet: "summaryColors",
            backgroundColor: "#2E2E2E",
            width: $("#summaryChartContainer").width(),
            indexLabelLineColor: "white",
            zoomEnabled:true,
              title: {
                fontSize: 18,
                padding: 10,
                backgroundColor: "#FFFFE0",
                borderThickness: 1,
                cornerRadius: 5,
                fontWeight: "bold",
                text: iQn.get('question'), },
              data: [{
               type: "doughnut",
               startAngle: 270,
               indexLabelFontColor: "white",
               indexLabelPlacement: "inside",
               indexLabelFontSize: 13,
               indexLabelFontWeight: "bold",
                indexLabelLineColor: "white",
               dataPoints: data}]
           });

          chart.render();
          
          if (localStorage['lectureInactive']!="true" && iQn.get('active')) {
            clearInterval(AT.summaryTimer);
            AT.summaryTimer=setInterval(function() {
              clearInterval(AT.summaryTimer);
              $('#summaryChart').click();
            },10000);
          }
        }
      }
    },
    error: function(qn,error) {
      AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
    }
  });
});

$(document).on('click','#summaryResponses', function(event, data) {
  event.stopImmediatePropagation();
  var iQuestion = Parse.Object.extend("iQuestion");
  var query = new Parse.Query(iQuestion);
  showPageLoading();
  query.get(AT.iQuestionId, {
    success: function(iQn) {
      $("#summaryChartContainer").empty();
      $("#summaryList").empty();
      if (!iQn.get('summary')) { 
        hidePageLoading();
        $("#summaryPopup").popup('close');
        AT.alert("No Response Summaries"); }
      else if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student" && iQn.get('active')) {
        hidePageLoading();
        $("#summaryPopup").popup('close');
        AT.alert("No Response Summaries");
      }
      
      else {
        var summary = JSON.parse(iQn.get('summary'));
        $('#summaryList').append("<li id='divider' data-role='list-divider'>" + iQn.get('question')+"</li>");
        $('#summaryList').append("<li id='divider' data-role='list-divider'>Total Responses: " + 
              Object.keys(iQn.get('responses')).length+"</li>");
        for (var answer in summary) {
          var record = [answer,summary[answer].split(':::').length];
          if (Parse.User.current().get('courses')[AT.currentCourse.id]!="student" && AT.mark) {
            if (iQn.get('answers').indexOf(record[0].toLowerCase())!=-1) {
              $('#summaryList').append("<li><a href='#' style='color:green'>"+record[0]+"<span class='ui-li-count'>"+
                record[1]+"</span></a><a href='#' id="+record[0].split(' ').join('||')+
                " class='ui-icon-nodisc' onclick='AT.toggleResponse(event,this.id,0); return false' data-role='button' data-iconshadow='false' data-icon='correct'>Set As Incorrect</a></li>"); 
            }
            else { 
              $('#summaryList').append("<li><a href='#'>"+record[0]+"<span class='ui-li-count'>"+record[1]+"</span></a><a href='#' class='ui-icon-nodisc' id="+record[0].split(' ').join('||')+
                " data-role='button' onclick='AT.toggleResponse(event,this.id,1); return false' data-iconshadow='false' data-icon='incorrect'>Set As Correct</a></li>"); 
            } }
          else {
            if (iQn.get('answers').indexOf(record[0].toLowerCase())!=-1 && iQn.get('showAnswer')) {
              $('#summaryList').append("<li style='color:green'>"+record[0]+"<span class='ui-li-count'>"+record[1]+"</span></li>");
            }
            else { 
              $('#summaryList').append("<li>"+record[0]+"<span class='ui-li-count'>"+record[1]+"</span></a></li>"); 
            }
          }
          
        }
        $('#summaryList').listview('refresh');
        hidePageLoading();
      }
    },
    error: function(qn,error) {
      hidePageLoading();
      AT.alert('Failed to retrieve iQuestion. Error '+error.code +": "+ error.message);
    }
  });
  event.preventDefault();
});

$(document).on("popupbeforeposition", "#summaryPopup",function( event, ui ) {
    $("#summaryList").empty();
    $("#summaryChartContainer").empty();
});

$(document).on("popupafterclose", "#iQuestionOptions",function( event, ui ) {
  AT.refreshiPanel();
});

$(document).on("popupafteropen", "#summaryPopup",function( event, ui ) {
    $("#summaryChart").click();
});

$(document).on("popupafterclose", "#summaryPopup",function( event, ui ) {
    clearInterval(AT.summaryTimer);
    if (AT.mark) {
      AT.mark=false;
      //AT.getResults();
      AT.getCourseResults();
    }
});

$(document).on("popupafteropen", "#newIPopup",function( event, ui ) {
    $("#question").val("New Question Stated at "+new Date().toLocaleTimeString());
});

$(document).on("popupbeforeposition", "#popupCreateLecture",function( event, ui ) {
    $('#lectureTime').val(AT.currentCourse.get('lectureTime'));
    $('#lectureDuration').val(AT.currentCourse.get('lectureDuration'));
    $('#lectureDate').val(new Date().format("m/dd/yyyy"));
});

$(document).on("popupafterclose", "#confusedPopup",function( event, ui ) {
  if (localStorage['lectureInactive']!="true") {
    clearInterval(AT.confusedTimer);
    AT.confusedTimer=setInterval(function() {
      clearInterval(AT.confusedTimer);
      AT.showReminder('#confusedPopup','#confusedHello');
    },120000);
  }
});

$(document).on("popupafterclose", "#boredPopup",function( event, ui ) {
  if (localStorage['lectureInactive']!="true") {
    clearInterval(AT.boredTimer);
    AT.boredTimer=setInterval(function() {
      clearInterval(AT.boredTimer);
      AT.showReminder('#boredPopup','#boredHello');
    },120000);
  }
});























$(document).on('click','#loginButton', function(event, data) {
    event.stopImmediatePropagation();
    event.preventDefault();
    if ($('#username').val() == "") {
      AT.alert("Please enter a username");
    }
    else if ($('#password').val() == "") {
      AT.alert("Password missing! Please re-enter!");
    }
    else {
      showPageLoading();
      Parse.User.logIn($('#username').val(), $('#password').val(), {
      success: function(user) {
        localStorage['userName'] = Parse.User.current().getUsername();
        currentUser = Parse.User.current();
        AT.currentUser = Parse.User.current();
        hidePageLoading();
        $.mobile.changePage('#welcomePage', {
            transition: 'flip',
            reverse: true
         });
      },
      error: function(user, error) {
        hidePageLoading();
        AT.alert("Error " + error.code + " " + error.message);
      }
    });
  }
});


$(document).on('click','#signupButton', function(event, data) {
  	event.stopImmediatePropagation();
    if ($('#email1').val() != $('#email2').val()) {
    	AT.alert("Emails don't match! "+$('#email1').val()+"  and  "+$('#email2').val()); }
    else if ($('#password1').val() != $('#password2').val()) {
    	AT.alert("Passwords don't match! Please re-enter!"); }
    else if ($('#username1').val() == "") {
    	AT.alert("Username missing! Please re-enter!"); }
    else if ($('#firstName').val() == "") {
      AT.alert("First Name missing! Please re-enter!"); }
    else if ($('#lastName').val() == "") {
      AT.alert("Last Name missing! Please re-enter!"); }
    else {
      showPageLoading();
    	var user = new Parse.User();
    	user.set("username", $('#username1').val());
    	user.set("password", $('#password1').val());
      user.set("firstName", $('#firstName').val());
      user.set("lastName", $('#lastName').val());
    	user.set("email", $('#email1').val());
    	user.set("courses", {});
    	user.signUp(null, {
		  success: function(user) {
		    AT.currentUser = Parse.User.current();
        localStorage['userName'] = Parse.User.current().getUsername();
        AT.alert("You need to verify your account, please check verification email sent to you!");
        hidePageLoading();
        $.mobile.changePage('#welcomePage', {
            transition: 'flip',
            reverse: true
         });
		  },
		  error: function(user, error) {
        hidePageLoading();
		    AT.alert("Error " + error.code + " " + error.message);
		  }
		});
	}
    event.preventDefault();
  });


$(document).on('click','#logoutButton', function(event, data) {
	event.stopImmediatePropagation();
  showPageLoading();
  Parse.User.logOut();
  setTimeout(function(){AT.init();},1000)
  localStorage['userName'] = "";
  hidePageLoading();
});

$(document).on('click','#resetButton', function(event, data) {
  event.stopImmediatePropagation();
  if ($('#rEmail').val() == "") {
    AT.alert("Please enter a valid email address!"); }
  else {
    showPageLoading();
    Parse.User.requestPasswordReset($('#rEmail').val(), {
      success: function() {
        AT.init();
        hidePageLoading();
        $("#resetSuccessPopup").popup('open');
      },
      error: function(error) {
        hidePageLoading();
        AT.alert("Error " + error.code + " " + error.message);
      }
    });
  }
  event.preventDefault();
});


$(document).on('click','#createLectureButton', function(event, data) {
  event.stopImmediatePropagation();
  var Lecture = Parse.Object.extend("Lecture");
  var lecture = new Lecture();
  if ($('#lectureTitle').val() == "") {
    AT.alert("Title missing! Please re-enter!"); }
  else if ($('#lectureDate').val() == "") {
    AT.alert("Please pick a date!"); }
  else if ($('#lectureTime').val() == "") {
    AT.alert("Please pick a start time!"); }
  else if ($('#lectureDuration').val() == "") {
    AT.alert("Please pick duration!"); }
  else {
    var date =  $('#lectureDate').val().split("/");
    var time = timeConverter($('#lectureTime').val()).split(":");
    var dur = $('#lectureDuration').val().split(" ")[2].split(":");
    var duration = parseInt(dur[0])*3600 + parseInt(dur[1])*60;
    var startTime = parseInt(time[0])*3600 + parseInt(time[1])*60 + 
    parseInt(date[0])*2592000 + parseInt(date[1])*86400;
    var endTime = startTime + duration;

    showPageLoading();
    lecture.set({
      title: $('#lectureTitle').val(),
      date : $('#lectureDate').val(),
      time : timeConverter($('#lectureTime').val()),
      startTime: startTime,
      endTime: endTime,
      duration: $('#lectureDuration').val().split(" ")[2],
      info: $('#lectureInfo').val(),
      course: AT.currentCourse.id,
      messages: [],
      feedbacks: {},
    });

    lecture.save(null, {
      success: function(lecture) {
        var course1 = AT.currentCourse;
        var lectures = course1.get('lectures');
        lectures.push(lecture.id);
        var count = course1.get('lectureCount')+1;
        course1.set('lectures',lectures);
        course1.set('lectureCount',count);
        course1.save(null, {
          success: function(course) {
            localStorage['lectures'] = course.get('lectures');
            localStorage['lectureCount'] = course.get('lectureCount');
            AT.currentCourse = course;
            localStorage['courseId'] = course.id;
            AT.refreshLectures();
            hidePageLoading();
            $('#popupCreateLecture').popup( "close" );
          },
          error: function(user,error) {
            hidePageLoading();
            AT.alert('Failed update lectures for course. Error '+error.code +": "+ error.message);
          }
        });
      },
      error: function(course, error) {
        hidePageLoading();
        AT.alert('Failed to create new lecture. Error '+error.code +": "+ error.message);
      }
    });
  }
  event.preventDefault();
});

$(document).on('click','#createCourseButton', function(event, data) {
  	event.stopImmediatePropagation();
  	var Course = Parse.Object.extend("Course");
  	var course = new Course();
  	var currentUser = Parse.User.current();
    if ($('#courseTitle').val() == "") {
      AT.alert("Title missing! Please re-enter!"); }
    else if ($('#courseNumber').val() == "") {
      AT.alert("Please enter course number/code!"); }
    else if ($('#lectureTime1').val() == "") {
      AT.alert("Please pick a start time!"); }
    else if ($('#lectureDuration1').val() == "") {
      AT.alert("Please pick duration!"); }
    else if ($('#semester').val() == "") {
      AT.alert("Please enter a semester name!"); }
    else if ($('#school').val() == "") {
      AT.alert("Please enter a school name!"); }
    else {

      showPageLoading();
    	course.set({
        ID: "",
    		title: $('#courseTitle').val(),
    		code: $('#courseNumber').val(),
    		semester: $('#semester').val(),
    		school: $('#school').val(),
        lectureTime: $('#lectureTime1').val(),
        lectureDuration: $('#lectureDuration1').val(),
    		owner: currentUser,
    		lectures: new Array(),
    		lectureCount: 0,
    		codes: [Math.floor(Math.random()*9000000) + 1000000, 
        Math.floor(Math.random()*9000000) + 1000000, 
        Math.floor(Math.random()*9000000) + 1000000],
    	});

    	course.save(null, {
    		success: function(course) {
          course.set('ID',course.id);
          course.save(null, {
            success: function(course) {
              var courses = currentUser.get('courses');
              courses[course.id] = "admin";
              currentUser.set("courses", courses);
              currentUser.save(null, {
                success: function(user) {
                  AT.refreshCourses();
                  hidePageLoading();
                  $('#popupCreateClass').popup( "close" );
                },
                error: function(user,error) {
                  hidePageLoading();
                  AT.alert('Failed to save courses. Error '+error.code +": "+ error.message);
                }
              });
            },

            error: function(course, error) {
              hidePageLoading();
              AT.alert('Failed to create new object. Error '+error.code +": "+ error.message);
            }
          });
    		},

    		error: function(course, error) {
          hidePageLoading();
    			AT.alert('Failed to create new object. Error '+error.code +": "+ error.message);
    		}
    	});
    }
    event.preventDefault();
  });

$(document).on('click','#addCourseButton', function(event, data) {
    event.stopImmediatePropagation();
    var Course = Parse.Object.extend("Course");
    var query = new Parse.Query(Course);
    var pin = parseInt($('#pin').val());
    var currentUser = Parse.User.current();
    query.equalTo("codes",pin);
    showPageLoading();
    query.first({
      success: function(course) {
        if (course) {
          var courses = currentUser.get('courses');
          var type = ['admin','ta','student'][course.get('codes').indexOf(pin)];
          courses[course.id] = type;
          currentUser.set("courses", courses);
          currentUser.save(null, {
            success: function(user) {
              AT.refreshCourses();
              hidePageLoading();
              $('#popupCreateClass').popup( "close" );
            },
            error: function(user,error) {
              hidePageLoading();
              AT.alert('Failed to save courses. Error '+error.code +": "+ error.message);
            }
          });
        }
        else {
          hidePageLoading();
          AT.alert("There is no course associated with that PIN");
        }
      },
      error: function(error) {
        hidePageLoading();
        AT.alert("Query Error on course: " + error.code + " " + error.message);
      }
    });
    event.preventDefault();
  });


$(document).on('pagebeforeshow','#engagedPage', function() {
  if (localStorage['lectureInactive']!="true") {
    AT.saveFeedback("Engaged",""); }
  else AT.refreshPosts('');
});

$(document).on('pagebeforeshow','#boredPage', function() {
  if (localStorage['lectureInactive']!="true") {
    AT.saveFeedback("Bored","1"); }
  else AT.refreshPosts('1');
  localStorage['n']='1';
});

$(document).on('pagebeforeshow','#confusedPage', function() {
  if (localStorage['lectureInactive']!="true") {
    AT.saveFeedback("Confused","2"); }
  else AT.refreshPosts('2');
  localStorage['n']='2';
});

$(document).on('pagebeforeshow','#ta-portalPage', function() {
  AT.refreshPosts('4');
  localStorage['n']='4';
});

$(document).on('pagebeforeshow','#welcomePage', function() {
  if (Parse.User.current().get('firstName')) {
    $('#welcome-heading').html("Welcome, "+Parse.User.current().get('firstName')+"!"); }
  else if (Parse.User.current().getUsername()) {
    $('#welcome-heading').html("Welcome, "+Parse.User.current().getUsername()+"!"); }
  else { $('#welcome-heading').html("Welcome, "+localStorage['userName']+"!"); }
  AT.refreshCourses();
});

$(document).on('pagebeforeshow','#coursePage', function(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
  if (Parse.User.current().get('courses')[AT.currentCourse.id]=="student") {
    $('#newLectureButton').hide(); }
  else { $('#newLectureButton').show(); }
  var course = AT.currentCourse;
  var currentUser = Parse.User.current();
  showPageLoading();
  course.fetch({
    success: function(course) {
      AT.currentCourse = course;
      localStorage['courseId'] = course.id;
      $('#Cwelcome-heading').html(course.get('title'));
      localStorage['courseOwner'] = course.get('owner').id==currentUser.id;
      localStorage['lectures'] = course.get('lectures');
      localStorage['lectureCount'] = course.get('lectureCount');
      hidePageLoading();
      AT.refreshLectures();
    },
    error: function(course, error) {
      hidePageLoading();
      AT.alert('Course query failed. Error '+error.code +": "+ error.message);
    }
  });
});

$(document).on('pageshow','#welcomePage', function() {

  $('#onGoingLectures').on('click', 'a', function (event) { 
    AT.launchLecture($(this).attr('id'));
  });

  $('#recentCourses').on('click', 'a', function (event) {
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
    if ($(this).attr('data-rel')=="popup") {
      var id = $(this).attr('id1');
      var currentUser = Parse.User.current();
      if (currentUser.get('courses')[id]=="admin") {
        $('#deleteCourse2').popup("open");
      }
      else {
        $('#deleteCourse').popup("open");
      }
      
      $('#deleteCourseButton').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        var currentUser = Parse.User.current();
        var courses = currentUser.get('courses');
        delete courses[id];
        currentUser.set("courses", courses);
        showPageLoading();
        currentUser.save(null, {
          success: function(user) {
            AT.refreshCourses();
            $('#deleteCourse').popup( "close" );
            $('#deleteCourse2').popup( "close" );
            hidePageLoading();
          },
          error: function(user,error) {
            hidePageLoading();
            AT.alert('Failed to delete course. Error '+error.code +": "+ error.message);
          }
        });
        event1.preventDefault();
      });

      $('#editCourseButton').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        event1.preventDefault();
        $('#deleteCourse2').popup( "close" );
        var query = new Parse.Query("Course");
        query.get(id, {
          success: function(course) {
            AT.currentCourse = course;
            localStorage['courseId'] = course.id;
            $('#popupCreateClass').popup("open");
            $('#courseTitle').val(course.get('title'));
            $('#courseNumber').val(course.get('code'));
            $('#createCourseButton').attr("id","editCourseButton");
            $('#semester').val(course.get('semester'));
            $('#school').val(course.get('school'));
            $('#lectureTime1').val(course.get('lectureTime'));
            $('#lectureDuration1').val(course.get('lectureDuration'));
            $('#editCourseButton').bind('click', function(event2, data) {
              course = AT.currentCourse;
              event2.stopImmediatePropagation();
              event2.preventDefault();
              showPageLoading();
              course.set({
                title: $('#courseTitle').val(),
                code: $('#courseNumber').val(),
                semester: $('#semester').val(),
                school: $('#school').val(),
                lectureTime: $('#lectureTime1').val(),
                lectureDuration: $('#lectureDuration1').val(),
              });

              course.save(null, {
                success: function(course) {
                  $('#courseTitle').val("");
                  $('#courseNumber').val("");
                  $('#semester').val("");
                  $('#school').val("");
                  $('#lectureTime1').val("");
                  $('#lectureDuration1').val("");
                  $('#popupCreateClass').popup("close");
                  $('#editCourseButton').attr("id","createCourseButton");
                  AT.refreshCourses();
                  hidePageLoading();
                },

                error: function(course, error) {
                  hidePageLoading();
                  AT.alert('Failed to update course. Error '+error.code +": "+ error.message);
                }
              });
            });
          },
          error: function(object, error) {
            hidePageLoading();
            AT.alert('Failed to retreave course. Error '+error.code +": "+ error.message);
          }
        });
      });


      $('#deleteCourseButton3').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        showPageLoading();
        var query = new Parse.Query("Course");
        query.get(id, {
          success: function(course) {
            course.destroy({
              success: function(course) {
                var query = new Parse.Query("Lecture");
                query.equalTo("course", id);
                query.find({
                  success: function(lectures) {
                    for (var i = 0; i < lectures.length; i++) { 
                      lectures[i].destroy({
                        success: function(lecture) {
                        },
                        error: function(lecture, error) {
                          hidePageLoading();
                          AT.alert('Failed to delete lecture. Error '+error.code +": "+ error.message);
                        }
                      });
                    }
                    $('#deleteCourse2').popup("close");
                    $('#deleteCourseButton').click();
                    hidePageLoading();
                  },
                  error: function(error) {
                    hidePageLoading();
                    AT.alert('Failed to retreave lectures. Error '+error.code +": "+ error.message);
                  }
                });
              },
              error: function(myObject, error) {
                hidePageLoading();
                AT.alert('Failed to delete course. Error '+error.code +": "+ error.message);
              }
            });
          },
          error: function(object, error) {
            hidePageLoading();
            AT.alert('Failed to retreave course. Error '+error.code +": "+ error.message);
          }
        });
        event1.preventDefault();
      });
    }

    else { AT.launchCourse($(this).attr('id'),true); }
  });
  AT.checkAccount();
});

$(document).on('pageshow','#coursePage', function(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  clearInterval(AT.courseTimer);
	AT.courseTimer=setInterval(function(){AT.refreshCourses();},60000);
  $('#recentLectures,#onGoingLectures').on('click', 'a', function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    if ($(this).attr('data-rel')=="popup") {
      localStorage['lectureId'] = $(this).attr('id1')||$(this).attr('id');
      AT.getNames();
      $('#deleteLecture').popup("open");

      $('#showGradesButton').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        event1.preventDefault();

        var Lecture = Parse.Object.extend("Lecture");
        var query = new Parse.Query(Lecture);
        showPageLoading();
        query.get(localStorage['lectureId'], {
          success: function(lecture) {
            hidePageLoading();
            AT.currentLecture = lecture;
            $.mobile.changePage('#gradesPage', {
              transition: 'flip',
              reverse: true
            });
            AT.showGrades();
          },
          error: function(lecture, error) {
            hidePageLoading();
            AT.alert('Lecture query failed. Error '+error.code +": "+ error.message);
          }
        });
        
      });

      $('#deleteLectureButton').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        event1.preventDefault();
        var Lecture = Parse.Object.extend("Lecture");
        var query = new Parse.Query(Lecture);
        showPageLoading();
        query.get(localStorage['lectureId'], {
          success: function(lecture) {
            lecture.destroy({
              success: function(lecture) {
                var course = AT.currentCourse;
                var lectures = course.get('lectures');
                var lectureCount = course.get('lectureCount');
                lectures.splice(lectures.indexOf(localStorage['lectureId']),1);
                course.set("lectures", lectures);
                course.set('lectureCount',lectureCount-1);
                course.save(null, {
                  success: function(course) {
                    AT.currentCourse = course;
                    localStorage['courseId'] = course.id;
                    localStorage['lectures'] = course.get('lectures');
                    localStorage['lectureCount'] = course.get('lectureCount');
                    $('#deleteLecture').popup( "close" );
                    hidePageLoading();
                    AT.refreshLectures();
                  },
                  error: function(user,error) {
                    hidePageLoading();
                    AT.alert('Failed to update lectures for current course. Error '+error.code +": "+ error.message);
                  }
                });
              },
              error: function(lecture,error) {
                hidePageLoading();
                AT.alert('Failed to delete lecture. Error '+error.code +": "+ error.message);
              }
            });
          },
          error: function(lecture, error) {
            hidePageLoading();
            AT.alert('Lecture query failed. Error '+error.code +": "+ error.message);
          }
        });
      });

      $('#editLectureButton').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        event1.preventDefault();
        showPageLoading();
        $("#deleteLecture").popup("close");
        var Lecture = Parse.Object.extend("Lecture");
        var query = new Parse.Query(Lecture);
        $("#popupEditLecture").popup();
        query.get(localStorage['lectureId'], {
          success: function(lecture) {
            AT.currentLecture = lecture;
            $('#lectureTitle11').val(lecture.get("title"));
            $('#lectureTime11').val(lecture.get('time'));
            $('#lectureDuration11').val(lecture.get('duration'));
            $('#lectureInfo11').val(lecture.get('info'));
            setTimeout(function(){$("#popupEditLecture").popup('open',{transition: "flip"});},1000)
            $('#lectureDate11').val(lecture.get('date'));
            hidePageLoading();
            $('#editLecture').bind('click', function(event1, data) {
              lecture = AT.currentLecture;
              event1.stopImmediatePropagation();
              event1.preventDefault();
              showPageLoading();
              var date =  $('#lectureDate11').val().split("/");
              var time = timeConverter($('#lectureTime11').val()).split(":");
              var dur = $('#lectureDuration11').val().split(":");
              if ($('#lectureDuration11').val()!=AT.currentLecture.get('duration')) {
                var dur = $('#lectureDuration11').val().split(" ")[2].split(":");
              }

              var duration = parseInt(dur[0])*3600 + parseInt(dur[1])*60;
              var startTime = parseInt(time[0])*3600 + parseInt(time[1])*60 + 
              parseInt(date[0])*2592000 + parseInt(date[1])*86400;
              var endTime = startTime + duration;
              lecture.set({
                title: $('#lectureTitle11').val(),
                date : $('#lectureDate11').val(),
                time : timeConverter($('#lectureTime11').val()),
                startTime: startTime,
                endTime: endTime,
                duration: $('#lectureDuration11').val().split(" ")[2],
                info: $('#lectureInfo11').val(),
              });

              lecture.save(null, {
                success: function(lecture) {
                  AT.currentLecture = lecture;
                  AT.refreshLectures();
                  hidePageLoading();
                  $('#lectureInfo11').val('');
                  $('#popupEditLecture').popup( "close" );
                },
                error: function(course, error) {
                  hidePageLoading();
                  AT.alert('Failed to create new lecture. Error '+error.code +": "+ error.message);
                }
              });
            });
          },
          error: function(lecture, error) {
            hidePageLoading();
            AT.alert('Lecture query failed. Error '+error.code +": "+ error.message);
          }
        });
      });
      
    }
    else { AT.launchLecture($(this).attr('id')); } 
  });
});

$(document).on('pageshow','#boredPage', function() {
  if (localStorage['lectureInactive']!="true") {
    clearInterval(AT.messagesTimer1);
    AT.messagesTimer1=setInterval(function(){AT.refreshPosts("1");},10000);
    clearInterval(AT.boredTimer);
    AT.boredTimer=setInterval(function() { 
      clearInterval(AT.boredTimer);
      AT.showReminder('#boredPopup','#boredHello');
    },120000);
  }
  $("#postsCollapsibleSet1").height($("body").height()-(40+$("#header1").height()+$("#footer1").height()+$("#messageInput1").height()));
  $("#postsCollapsibleSet1").scrollTop($("#postsCollapsibleSet1")[0].scrollHeight);
});

$(document).on('pageshow','#engagedPage', function(event) {
  event.stopImmediatePropagation();
  event.preventDefault();
  clearInterval(AT.boredTimer); clearInterval(AT.confusedTimer);
  localStorage['n']='';
  //AT.refreshPosts("");
  if (localStorage['lectureInactive']=="true") {
    AT.alert("This lecture is either scheduled or completed!");
  }
  else {
    clearInterval(AT.messagesTimer);
    AT.messagesTimer=setInterval(function(){AT.refreshPosts("");},30000);
  }
  $("#engagedContent").height($("body").height()-(45+$("#header3").height()+$("#footer3").height()));
});

$(document).on('pageshow','#overviewPage', function(event) {
  event.stopImmediatePropagation();
  event.preventDefault();
  AT.refreshOverview();
  if (localStorage['lectureInactive']=="true") {
    AT.alert("This lecture is either scheduled or completed!");
  }
  else {
    clearInterval(AT.overviewTimer);
    AT.overviewTimer=setInterval(function(){AT.refreshOverview()},30000);
  }
});

$(document).on('pageshow','#confusedPage', function() {
  AT.refreshPosts("2");
  if (localStorage['lectureInactive']!="true") {
    clearInterval(AT.confusedTimer);
    AT.confusedTimer=setInterval(function() {
      clearInterval(AT.confusedTimer);
      AT.showReminder('#confusedPopup','#confusedHello');
    },120000);
    clearInterval(AT.messagesTimer2);
    AT.messagesTimer2=setInterval(function(){AT.refreshPosts("2");},10000);
  }
  $("#postsCollapsibleSet2").height($("body").height()-(40+$("#header2").height()+$("#footer2").height()+$("#messageInput2").height()));
  $("#postsCollapsibleSet2").scrollTop($("#postsCollapsibleSet2")[0].scrollHeight);
});

$(document).on('pageshow','#engagedMessages', function() {
  AT.refreshPosts("3");
  $("#postsCollapsibleSet3").scrollTop($("#postsCollapsibleSet3")[0].scrollHeight);
   $("#postsCollapsibleSet3").height($("body").height()-(40+$("#header5").height()+$("#footer5").height()));
  clearInterval(AT.messagesTimer3);
  if (localStorage['lectureInactive']!="true") {
    AT.messagesTimer3=setInterval(function(){AT.refreshPosts("3");},10000);
  }
});

$(document).on('pageshow','#ta-portalPage', function() {
  $("#postsCollapsibleSet4").scrollTop($("#postsCollapsibleSet4")[0].scrollHeight);
  clearInterval(AT.messagesTimer4);
   if (localStorage['lectureInactive']!="true") {
    AT.messagesTimer4=setInterval(function(){AT.refreshPosts("4");},10000);
  }
});

$(document).on('pagehide','#ta-portalPage', function() {
  	clearInterval(AT.messagesTimer4);
});

$(document).on('pagehide','#boredPage', function() {
    clearInterval(AT.messagesTimer1); clearInterval(AT.boredTimer);
});

$(document).on('pagehide','#confusedPage', function() {
    clearInterval(AT.messagesTimer2); clearInterval(AT.confusedTimer);
});

$(document).on('pagehide','#engagedMessages', function() {
    clearInterval(AT.messagesTimer3);
});

$(document).on('pagehide','#engagedPage', function() {
    clearInterval(AT.messagesTimer);
});

$(document).on('pagehide','#overviewPage', function() {
    clearInterval(AT.overviewTimer);
});

$(document).on('pagehide','#coursePage', function() {
    clearInterval(AT.courseTimer);
});