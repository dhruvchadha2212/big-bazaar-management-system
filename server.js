//prerequisites
var express = require("express");
var app = express();
var server = require("http").createServer(app).listen(3000);
var io = require("socket.io")(server);
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({extended: false});
var mysql = require("mysql");
app.use("/assets", express.static("static_files"));

//creating a mysql connection
var connection = mysql.createConnection({
	host: 'localhost',
	user	: 'root',
	password: 'root',
	database: 'bigbazaar'
});

//connecting to sql using connection object
connection.connect(function(err) {
	if(err) throw err;
});

//routing
app.get("/", function(req, res) {
	res.sendFile(__dirname + "/dbms.html");
});

//what happens on connection to localhost:3000
io.on("connection", function(socket) {
	socket.emit("start");
	//function template to emit event after a query is run
	function emitAfterSearch(str, emitEvent) {
		connection.query(str, function(err, rows) {
			if(err) throw err;
			socket.emit(emitEvent, rows);
		});
	}
	//handling client emitted events
	function clientEventsHandler(clientEvent, str, emitEvent) {
		socket.on(clientEvent, function(s) {
			if(s) {
				emitAfterSearch(str + s + "';", emitEvent);
			}
			else {
				emitAfterSearch(str, emitEvent);
			}	
		});
	}
	//function to perform a simple query
	function qry(str) {
		connection.query(str, function(err, rows) {
			if(err) throw err;
		});
	}
	
	var str = "select * from products where pname = '";
	clientEventsHandler("seek_prod", str, "prod_info");
	
	str = "select * from customer where cid = '";
	clientEventsHandler("check_cust", str, "cust_info");
	str = "select amount from ewallet where cid = '";
	clientEventsHandler("check_cust", str, "show_wallet");
	
	str = "select * from customer;";
	clientEventsHandler("generate_cust", str, "cust_generate");
	
	str = "select * from products;";
	clientEventsHandler("getAllProducts", str, "displayProducts");
	
	str = "select count(*) from orders;";
	clientEventsHandler("getNewOrderId", str, "newOrderId");
	
	str = "select count(*) from orders;";
	clientEventsHandler("getNewOrderId", str, "newOrderId");

	str = "select * from products where pid = '";
	clientEventsHandler("checkprod", str, "prod_details");

	str = "select pid, pname, quantity, threshold from products where (quantity < threshold);";
	clientEventsHandler("showWarnings", str, "giveWarnings");
	
	str = "select * from employee where empid = '";
	clientEventsHandler("checkEmp", str, "emp_details");
	
	socket.on("fromWallet", function(id, amount) {
		str = "update ewallet set amount = amount - " + amount + " where cid = " + id + ";";
		qry(str);
	});
	
	socket.on("addproduct", function(row) {
		var str = "select * from products;";
		var flag = 0;
		var left = parseInt(row[3]);
		var add = parseInt(row[5]);
		if(!add) add = 0;
		connection.query(str, function(err, rows) {
			for(i = 0; i < rows.length; i++) {
				if(rows[i].pid == row[0]) flag = 1;
			}
			if(flag) {
				str = "update products set quantity = "+ (left + add) +" where pid = " + row[0] + ";";
				qry(str);
			}
			else {
				str = "insert into products values(" + row[0] + ",'" + row[1] + "'," + row[2] + ","+row[5]+","+row[4]+");";
				qry(str);
			}
		});
	});

	//on final billing
	socket.on("bill", function(items, customerid, employeeid, newOrderId, custarr) {
		str = "select * from customer where cid = " + customerid + ";";
		connection.query(str, function(err, rows) {
			if(err) throw err;
			if(!rows.length) {
				var s = "insert into customer values("+custarr[0]+",'"+custarr[1]+"','"+custarr[2]+"',"+custarr[3]+");";
				qry(s);
			}
		});
		var sum = 0;
		newOrderId = parseInt(newOrderId);
		for(i = 0; i < items.length; i++) {
			var q = "insert into place values(" + customerid + "," + newOrderId + "," + items[i].pid + "," + items[i].quantity + ");"
			qry(q);
			
			sum+=(items[i].cost * items[i].quantity);
		}
		var d = new Date();
		var dat = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
		str = "insert into orders values("+ newOrderId + "," + sum + ",'"+ dat +"');";
		qry(str);
		str = "insert into bills values("+ employeeid + "," + newOrderId + ");";
		qry(str);
	});
	
	socket.on("update_emp", function(row) {
		str = "delete from employee where empid = " + row[0] + ";";
		qry(str);
		str = "insert into employee values(" + row[0] + ",'" + row[1] + "'," + row[2] + ", "+ row[3] + ");";
		qry(str);
	});
	socket.on("addnew_emp", function(row) {
		str = "insert into employee values(" + row[0] + ",'" + row[1] + "'," + row[2] + ","+row[3]+");";
		qry(str);
	});
	
	str = "select * from supplier where supid = '";
	clientEventsHandler("checksup", str, "sup_details");
	socket.on("addupdatesup", function(row, val) {
		if(val == "Add") {
			str = "insert into supplier values('"+row[0]+"','"+row[1]+"','"+row[2]+"','"+row[3]+"','"+row[4]+"');"
			qry(str);
		}
		else {
			str = "update supplier set supname = '"+row[1]+"', address = '"+row[2]+"', contact ='"+row[3]+"', blacklisted = '"+row[4]+"' where supid = "+row[0]+";";
			qry(str);
		}
	});
});

