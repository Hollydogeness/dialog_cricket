var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require("request");
var Type = require('type-of-is');
var mysql = require("mysql");
var firebase = require("firebase");

 var config = {
    apiKey: "AIzaSyBA8lQbl3_yJxHLpiGvYkCxqwL38Yo_e-I",
    authDomain: "dialogcrick.firebaseapp.com",
    databaseURL: "https://dialogcrick.firebaseio.com",
    storageBucket: "dialogcrick.appspot.com",
    messagingSenderId: "36577793363"
  };
  firebase.initializeApp(config);
var database = firebase.database();


var CRI_API_KEY = "O5Cj6Mp4bccSGJbfKHnHJZuDYSJ3";
var CRI_MLS_URL = "http://cricapi.com/api/matches";
var CRI_SCR_URL = "http://cricapi.com/api/cricketScore";
var CRI_CAL_URL = "http://cricapi.com/api/matchCalendar";


var USSD_URL_send = "http://localhost:7000/ussd/send";
var USSD_password = "pass";
var USSD_appID = "APP_000001";
var USSD_appversion = "1.0";

var CAL_DayRange = 7;

var SQL_HOST="localhost";
var SQL_USER="root";
var SQL_PASSWORD="password";
var SQL_DATABASE="dialog_crick";
var SQL_CAL_USER_TABLE = "dialog_cricket_calandar";

app.use(bodyParser.json());

function def_response(){
	this.statusCode = "S1000";
	this.statusDetail = "Success";
}

app.post('/crick_scores/start', function(req, res) {
	if (req.body.ussdOperation == "mo-init"){
			//console.log(req.body);
			start_sending_match_list(req.body.sourceAddress,req.body.sessionId);
	}
	else if(req.body.ussdOperation == "mo-cont"){
		//console.log(req.body);
		start_sending_scores(req.body.message,req.body.sourceAddress,req.body.sessionId);
	}
	
	var response = new def_response();
	res.send(response);
})


function send_crick_objct(){
	this.apikey = CRI_API_KEY;
}

function start_sending_match_list(destination,sesid){
	var obj = new send_crick_objct() ;

	request({
	    url: CRI_MLS_URL,
	    method: "POST",
	    headers: {"content-type": "application/json","accept": "application/json"},
	    json: true,
	    body: obj
	    },
	    function (error, resp, body) {
	    	if (!error && resp.statusCode == 200) {
	    		get_match_list(JSON.parse(JSON.stringify(body)),destination,sesid);
	  
	            //console.log(body)
	        	}
	        else {
	        	var date = new Date();
	            console.log(date+" error: " + error)
	            //console.log(date+" response.statusCode: " + resp.statusCode)
	            //console.log(date+" response.statusText: " + resp.statusText)
	        	}
	    	}
	    );
}


function get_match_list(ary,destination,sesid){
	var carry = ary.matches;
	var u_ids = [];
	var mesasge = "Pick a Match to get current Score:\n";
	var ex = 1;
	for (i=0 ; i < carry.length; i++){
		if(carry[i].matchStarted){
			u_ids.push(carry[i].unique_id);
			mesasge += (ex)+". ";
			mesasge += carry[i]['team-1'] + " VS " + carry[i]['team-2']; 
			mesasge += "\n";
			ex++;
		}
	}
	mesasge += (ex)+". ";
	mesasge += "Exit"; 

	if(sesid !== undefined){
  		database.ref('/sessions/' + sesid).set({
    		unique_ids: u_ids,
    	
  		});
  		var date = new Date()
  		console.log("Session |" +sesid+ "| initiated On " +date);
  		send_USSD(mesasge,sesid,"mt-cont",destination);
  	}
}


function USSD_obj(msg,seid,op,num){
	this.applicationId = USSD_appID;
	this.password = USSD_password;
	this.message = msg;
	this.sessionId = seid;
	this.ussdOperation = op;
	this.destinationAddress = num;
}

function send_USSD(msg,seid,op,num){
	var ussd_object = new USSD_obj(msg,seid,op,num);
	request({
	    url: USSD_URL_send,
	    method: "POST",
	    headers: {"content-type": "application/json","accept": "application/json"},
	    json: true,
	    body: ussd_object
	    },
	    function (error, resp, body) { 
	    	if (!error && resp.statusCode == 200) {
	    		var date = new Date()
	            console.log("USSD sent to session |"+ seid+ "| on " + date );
	            if(op){

	            }
	            //console.log(body)

	        	}
	        else {
	        	var date = new Date()
	            console.log(date + " error: " + error)
	            //console.log(date + " response.statusCode: " + resp.statusCode)
	            //console.log(date + " response.statusText: " + resp.statusText)
	        	}
	    	}
	    );
}

function start_sending_scores(msg,destination,sesid){
	database.ref('/sessions/' + sesid).once('value').then(function(snapshot) {
		var sessions = snapshot.val().unique_ids;

		var choice = parseInt(msg)-1;
		if(choice >= sessions.length || choice == NaN){ send_USSD('Done',sesid,'mt-fin',destination);terminate_session(sesid,'Done');}
		else{send_match_scores(destination,sesid,sessions[choice]);};
		//console.log(choice);

		//console.log(sessions);
	});
}


function send_crick_score_objct(uid){
	this.unique_id = uid;
	this.apikey = CRI_API_KEY;

}

function send_match_scores(destination,sesid,matchid){
	var obj = new send_crick_score_objct(matchid);

	request({
	    url: CRI_SCR_URL,
	    method: "POST",
	    headers: {"content-type": "application/json","accept": "application/json"},
	    json: true,
	    body: obj
	    },
	    function (error, resp, body) {
	    	if (!error && resp.statusCode == 200) {
	            var message = body.score;
	            if(body['innings-requirement'] != undefined){message+="\n | Innings-requirement : "+ body['innings-requirement']}
	            message += "\n | Match Type : " + body.type + "\n";
	            send_USSD(message,sesid,'mt-fin',destination);
	            terminate_session(sesid,message);
	            
	        	}
	        else {
	        	var date = new Date();
	            console.log(date+" error: " + error)
	            //console.log(date+" response.statusCode: " + resp.statusCode)
	            //console.log(date+" response.statusText: " + resp.statusText)
	        	}
	    	}
	    );

}

function terminate_session(sesid,msg){
	database.ref('/sessions/' + sesid).remove();
	var date = new Date()
  	console.log("Session |" +sesid+ "| Ended " + "with message : |"+ msg +"| On " +date);

}


//start_sending_scores('20',12,'1234');
//start_sending_match_list(1,'123');

var server = app.listen(8081, function () {
   //var host = server.address().address
   var host = "localhost"
   var port = server.address().port
   
   console.log("listening at http://%s:%s", host, port)
})