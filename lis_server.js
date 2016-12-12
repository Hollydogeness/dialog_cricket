var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require("request");
var Type = require('type-of-is');
var mysql = require("mysql");

var SQL_HOST="localhost";
var SQL_USER="root";
var SQL_PASSWORD="password";
var SQL_DATABASE="dialog_crick";
var SQL_CAL_USER_TABLE = "dialog_cricket_calandar";


app.use(bodyParser.json());



app.post('/crick_cal/subscribe', function(req, res) {
	if (req.body.status == "REGISTERED"){
			sql_insert(req.body);
	}
	else{
		sql_delete(req.body);
	}

	var resp_ob = new repond_obj();
	res.send(resp_ob);
})

function repond_obj(){
	this.statusCode = "S1000";
	this.statusDetail = "Success";
}

//SQL STUFF
function sql_insert(obj){
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
	con.query("SELECT * FROM " +SQL_CAL_USER_TABLE+ " WHERE uid ='"+obj.subscriberId +"';",function(err,rows){
  		if(err){console.log(err);}

  		//console.log('Data received from Db:');
  		//console.log(rows);
  		var date = new Date();
  		if(rows.length == 0){
  			colomns = " (uid,frequency,timestmp,appid,version) ";
  			data =  "VALUES ('"+obj.subscriberId+"','"+obj.frequency+"','"+obj.timestmp+"','"+obj.appid+"','"+obj.version+"');";
			con.query("INSERT INTO "+SQL_CAL_USER_TABLE+colomns+data , function(err,res){
  			if(err){console.log(err);}

  			console.log('Insert ID: '+ obj.subscriberId + " on "+ date);
			});

			
			terminate_sql_connec(con);

  			}
  		else{console.log("User : "+obj.subscriberId+" Already registered " + "on " +date);
  			terminate_sql_connec(con);}

		});
	//done sql code

}

function sql_delete(obj){
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
	con.query("SELECT * FROM " +SQL_CAL_USER_TABLE+ " WHERE uid ='"+obj.subscriberId +"';",function(err,rows){
  		if(err){console.log(err);}

  		var date = new Date();
  		//console.log('Data received from Db:');
  		//console.log(rows);
  		if(rows.length != 0){
			con.query("DELETE FROM "+SQL_CAL_USER_TABLE+" WHERE uid = '"+ obj.subscriberId +"' ;" , function(err,res){
  			
  			if(err){console.log(err);}

  			console.log("Deleted ID: "+ obj.subscriberId +" on "+ date );
			});

			
			terminate_sql_connec(con);

  			}
  		else{console.log("User : "+obj.subscriberId+" Not found , Couldn't delete! on " + date);
  			terminate_sql_connec(con);}

		});
	//done sql code

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


//var cron = require('node-cron');
//var cronJob = cron.job("00 30 11 * * 1", function(){ //'00 30 11 * * 1-5' - Runs every weekday (Monday through Friday) at 11:30:00 AM. It does not run on Saturday or Sunday.
    // perform operation e.g. GET request http.get() etc.
//    console.info('cron job completed');
//}); 
//cronJob.start();



function dummy(){
	this.subscriberId = "tel:94771122336";
	this.frequency = "Daily";
	this.timestmp = "201609238912039";
	this.appid  = "app0011";
	this.version = "1.0";
}

function doit(){
	var obj = new dummy();
  	//console.log(SMS_USER_NUMBERS);
	//sql_get_numbers();
  	//console.log(SMS_USER_NUMBERS);
	sql_insert(obj);
	sql_delete(obj);

}

doit();

var server = app.listen(8080, function () {
   //var host = server.address().address
   var host = "localhost"
   var port = server.address().port
   
   console.log("listening at http://%s:%s", host, port)
})