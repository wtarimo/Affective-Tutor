<script id="courseTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}> 
       <h3>${courseTitle}</h3>
       <p><strong>${courseNumber}</strong> : ${semester}</p>
       <p>${school} : ${pins}</p>
       <p class="ui-li-aside">Lectures: <strong>${lecture_count}</strong></p>
       </a>
       <a href="#deleteCourse" id1=${id} data-rel="popup" data-icon="delete" data-position-to="window" data-transition="flip">Delete Course</a>
    </li>
</script>

<script id="nowlectureTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}> 
       <h3>${lectureTitle}</h3>
       <p><strong>Time: On ${startTime} Duration:${duration}</strong></p>
       <p>${info}</p>
       <p class = "ui-li-aside now"><strong>On Now</strong></p>
       </a>
    </li>
</script>

<script id="anowlectureTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${lectureTitle}</h3>
       <p><strong>Time: On ${startTime} Duration:${duration}</strong></p>
       <p>${info}</p>
       <p class = "ui-li-aside now"><strong>On Now</strong></p>
       </a>
       <a href="#deleteLecture" id1=${id} data-rel="popup" data-icon="delete" data-position-to="window" data-transition="flip">Delete Lecture</a>
    </li>
</script>

<script id="passedlectureTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}> 
       <h3>${lectureTitle}</h3>
       <p><strong>Time: On ${startTime} Duration:${duration}</strong></p>
       <p>${info}</p>
       <p class = "ui-li-aside passed"><strong>Completed</strong></p>
       </a>
    </li>
</script>
<script id="apassedlectureTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}> 
       <h3>${lectureTitle}</h3>
       <p><strong>Time: On ${startTime} Duration:${duration}</strong></p>
       <p>${info}</p>
       <p class = "ui-li-aside passed"><strong>Completed</strong></p>
       </a>
       <a href="#deleteLecture" id1=${id} data-rel="popup" data-icon="delete" data-position-to="window" data-transition="flip">Delete Lecture</a>
    </li>
</script>

<script id="scheduledlectureTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${lectureTitle}</h3>
       <p><strong>Time: On ${startTime} Duration:${duration}</strong></p>
       <p>${info}</p>
       <p class = "ui-li-aside scheduled"><strong>Scheduled</strong></p>
       </a>
    </li>
</script>
<script id="ascheduledlectureTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${lectureTitle}</h3>
       <p><strong>Time: On ${startTime} Duration:${duration}</strong></p>
       <p>${info}</p>
       <p class = "ui-li-aside scheduled"><strong>Scheduled</strong></p>
       </a>
       <a href="#deleteLecture" id1=${id} data-rel="popup" data-icon="delete" data-position-to="window" data-transition="flip">Delete Lecture</a>
    </li>
</script>



<script id="ASiTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${qn}</h3>
       <p>Hints: <strong>${hints}</strong></p>
       <input type="text" name="answer" data-theme="c" id="answer" value=${answer} data-theme="a">
       <p class = "ui-li-aside now">Responses: <strong>${responses}</strong></p>
       </a>
       <a href="#" id1=${id1} id="submitiButton" data-rel="popup" data-role="button" data-icon="check" >Submit Answer</a>
    </li>
</script>
<script id="ISiTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${qn}</h3>
       <p>Your Answer: <strong>${answer}</strong>; Correct Answer: <strong>${correct_answer}</strong></p>
       <p>Summary: <strong>${summary}</strong></p>
       <p class = "ui-li-aside passed">Responses: <strong>${responses}</strong></p>
       </a>
    </li>
</script>
<script id="IAiTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${qn}</h3>
       <p>Correct Answer: <strong>${correct_answer}</strong></p>
       <p>Summary: <strong>${summary}</strong></p>
       <p class = "ui-li-aside passed">Responses: <strong>${responses}</strong></p>
       </a>
       <a href="#" id1=${id1} id="deleteiButton" data-rel="popup" data-role="button" data-icon="check" >Delete iQuestion</a>
    </li>
</script>
<script id="AAiTemplate" type="text/x-jquery-tmpl">  
    <li><a id=${id}>
       <h3>${qn}</h3>
       <p>Hints: <strong>${hints}</strong></p>
       <p>Correct Answer: <strong>${correct_answer}</strong></p>
       <p class = "ui-li-aside now">Responses: <strong>${responses}</strong></p>
       </a>
       <a href="#" id1=${id1} id="deactivateiButton" data-rel="popup" data-role="button" data-icon="check" >Collect Responses</a>
    </li>
</script>