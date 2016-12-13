var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require("request");
var Type = require('type-of-is');
var mysql = require("mysql");

var CRI_API_KEY = "O5Cj6Mp4bccSGJbfKHnHJZuDYSJ3";
var CRI_CAL_URL = "http://cricapi.com/api/matchCalendar";
var CRI_MLS_URL = "http://cricapi.com/api/matches";


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

app.post('/crick_cal/subscribe', function(req, res) {
	if (req.body.status == "REGISTERED"){
			adduser();
	}
	else{
		removeuser();
	}
	console.log(JSON.stringify(job));
	console.log(req.body.key2); 

	res.send(job);
})

app.post('/crick_scores/start', function(req, res) {
	if (req.body.status == "REGISTERED"){
			adduser();
	}
	else{
		removeuser();
	}
	var response = new def_response();
	res.send(response);
})


//CRICK_STUFF
function send_crick_objct(){
	this.apikey = CRI_API_KEY;
}

function update_calander(){
	var obj = new send_crick_objct() ;

	request({
	    url: CRI_CAL_URL,
	    method: "POST",
	    headers: {"content-type": "application/json","accept": "application/json"},
	    json: true,
	    body: obj
	    },
	    function (error, resp, body) {
	    	if (!error && resp.statusCode == 200) {
	    		do_sms(JSON.parse(JSON.stringify(body)));
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

//SMS_STUFF
function sms_mesage_obj(){
	this.message = null;//to be filled
	this.password = SMS_password;
	this.sourceAddress = SMS_source_add;
	//this.chargingAmount = "2.5";
	this.destinationAddresses = null; // to be filled
	this.applicationId =SMS_appID;
	this.version = SMS_appversion;
}

function send_sms(sms_mesage_obj){
	request({
	    url: SMS_URL_send,
	    method: "POST",
	    headers: {"content-type": "application/json","accept": "application/json"},
	    json: true,
	    body: sms_mesage_obj
	    },
	    function (error, resp, body) { 
	    	if (!error && resp.statusCode == 200) {
	    		var date = new Date()
	            console.log("Message sent on " + date );
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

function do_sms(ary){
	var carry = ary.data;
	var mesasge = "";
	for (i=0 ; i < carry.length; i++){
		//console.log(i);
		//console.log(carry[i].date);
		diff = get_date_deferance(carry[i].date) ;
		if(diff <= CAL_DayRange && diff >= 0){
			mesasge += carry[i].name; 
			mesasge += " | on: ";
			mesasge += carry[i].date;
			mesasge += "\n\n";
		}
	}

	var sms_obj = new sms_mesage_obj();
	sms_obj.message = mesasge;
	sms_obj.destinationAddresses = [];
	sql_get_numbers_and_send_sms(sms_obj);

}


//SQL STUFF

function sql_get_numbers_and_send_sms(sms_obj){
	var con = mysql.createConnection({
  		host: SQL_HOST,
  		user: SQL_USER,
  		password: SQL_PASSWORD,
  		database: SQL_DATABASE
		});
	con.connect(function(err){
	  	if(err){
	    	console.log('Error connecting to Db');
	    	return;
	  			}
	  	console.log('Connection established to DB');
				});

	//sql code goes herte
	con.query("SELECT * FROM " +SQL_CAL_USER_TABLE +" ;",function(err,rows){
  		if(err){console.log(err);}

  		//console.log('Data received from Db:');
  		if(rows.length != 0){
  			var numbers = []; 

  			for(i=0; i < rows.length;i++){
  				sms_obj.destinationAddresses.push(rows[i].uid);
  				}

			terminate_sql_connec(con);

			send_sms(sms_obj);


  			}
  		else{console.log("No Subscribers to send SMS");
  			terminate_sql_connec(con);}

		});
}


function terminate_sql_connec(con){
	con.end(function(err) {
		console.log("Connection terminated from DB");
  	// The connection is terminated gracefully
  	// Ensures all previously enqueued queries are still
  	// before sending a COM_QUIT packet to the MySQL server.
	});
}
//CREATE TABLE dialog_cricket_calandar
//(
//uid varchar(30),
//frequency varchar(30),
//timestmp varchar(30),
//appid varchar(255),
//version varchar(10)
//);






function doit(){

	update_calander();
}

//doit();

var server = app.listen(8081, function () {
   //var host = server.address().address
   var host = "localhost"
   var port = server.address().port
   
   console.log("listening at http://%s:%s", host, port)
})