var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require("request");
var Type = require('type-of-is');
var mysql = require("mysql");

var CRI_API_KEY = "O5Cj6Mp4bccSGJbfKHnHJZuDYSJ3";
var CRI_CAL_URL = "http://cricapi.com/api/matchCalendar";
var CRI_MLS_URL = "http://cricapi.com/api/matches";


var SMS_URL_send = "https://api.dialog.lk/sms/send";
var SMS_password = "";
var SMS_source_add = "77777777777";
var SMS_appID = "APP_031661";
var SMS_appversion = "1.0";

var CAL_DayRange = 7;

var SQL_HOST="localhost";
var SQL_USER="root";
var SQL_PASSWORD="password";
var SQL_DATABASE="dialog_crick";
var SQL_CAL_USER_TABLE = "dialog_cricket_calandar";

var SMS_USER_NUMBERS = []; 

app.use(bodyParser.json());


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

function get_date_deferance(date){

	var today = new Date();
	today = Date.parse(today);
	var day = "",month="" ,year="";
	var i = 0 ;
	while(date[i] != " "){
		day += date[i];
		i++;
	} 
	i++;
	while(date[i] != " "){
		month += date[i];
		i++;
	} 
	i++;
	while(i<date.length){
		year += date[i];
		i++
	}


	switch(month){
		case "January":
			month = 1;
			break;
		case "February":
			month = 2;
			break;
		case "March":
			month = 3;
			break;
		case "Aprial":
			month = 4;
			break;
		case "May":
			month = 5;
			break;
		case "June":
			month = 6;
			break;
		case "July":
			month = 7;
			break;
		case "August":
			month = 8;
			break;
		case "September":
			month = 9;
			break;
		case "October":
			month = 10;
			break;
		case "November":
			month = 11;
			break;
		case "December":
			month = 12;
			break;
		default:
			console.log("Erroe pahrsing date , month")
	}

	day = parseInt(day);
	year = parseInt(year);
	var d = new Date(year,month-1,day,0,0,0,0);
	d = Date.parse(d);

	var days = 1000*60*60*24;

	return (d - today)/days ;
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




var CronJob = require('cron').CronJob;
var job = new CronJob({
  cronTime: '00 30 16 * * 1', // last one 1-5
  onTick: function() {
    /*
     * Runs every weekday (Monday through Friday)
     * at 11:30:00 AM. It does not run on Saturday
     * or Sunday.
     */

    update_calander();
    console.info('cron job completed');
  },
  start: false,
  //timeZone: 'America/Los_Angeles'
});
job.start();



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