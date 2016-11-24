//prerequisites
var socket = io();
var bill_form = document.getElementById("bill_details");
var cart = document.getElementById("cart");
var checkCust = document.getElementById("check");
var generateCust = document.getElementById("generate");
var addbutton = document.getElementById("add");
var addprodform = document.getElementById("addprodform");
var tableOfWarnings = document.getElementById("tableofwarnings");
var employeeform = document.getElementById("employeeform");
var supplierform = document.getElementById("supplierform");
var adminform = document.getElementById("adminform");
var modal = document.getElementById("id01");
var items = [];
var stat = "loggedout";
var pw = "1234";

function validatefield(target) {
	if(!target.value.replace(/ /g,'').length) {
		alert("Please fill '" + target.placeholder + "' field.");
		return 0;
	}
	return 1;
}

function validateform(frm) {
	var fields = frm.querySelectorAll("input");
	var flag = 1;
	for(i = 0; i < fields.length; i++) {
		if(!fields[i].value.replace(/ /g,'').length && fields[i].type == "text") {
			flag = 0;
			alert("Please fill '" + fields[i].placeholder + "' field.")
		}
	}
	return flag;
}

function clearform(frm) {
	var fields = frm.querySelectorAll("input");
	for(i = 0; i < fields.length; i++) {
		if(fields[i].type == "text") {
			fields[i].value = "";
		}
	}
}

socket.on("start", function(){
	window.scrollTo(0,0);
});

document.getElementById("neworder").onclick = function() {
	window.scrollTo(0, document.getElementById("neworder_page").offsetTop);
	socket.emit("getAllProducts");
	socket.emit("getNewOrderId");
	document.getElementById("billsheet").style.display = "none";
	while(items.length) {
		items.pop();
	}
	document.getElementById("totalorder").textContent = "0";
	document.getElementById("billsubmit").style.display = "initial";
}
document.getElementById("getwarnings").onclick = function() {
	window.scrollTo(0, document.getElementById("warnings_page").offsetTop);
	socket.emit("showWarnings");
}
document.getElementById("h_employee").onclick = function() {
	if(stat == "loggedin") {
		window.scrollTo(0, document.getElementById("employee_page").offsetTop);
	}
	else {
		alert("Please login as admin first");
	}
}
document.getElementById("h_supplier").onclick = function() {
	if(stat == "loggedin") {
		window.scrollTo(0, document.getElementById("supplier_page").offsetTop);
	}
	else {
		alert("Please login as admin first");
	}
}
document.getElementById("h_products").onclick = function() {
	if(stat == "loggedin") {
		window.scrollTo(0, document.getElementById("product_page").offsetTop);
	}
	else {
		alert("Please login as admin first");
	}
}
document.getElementById("back").onclick = function() {
	window.scrollTo(0,0);
};
socket.on("newOrderId", function(rows) {
	document.getElementById("orderId").textContent = (rows[0]["count(*)"] + 1);
});
socket.on("displayProducts", function(rows) {
	var prodops = document.getElementById("prod_options");
	while(prodops.childNodes.length > 2) {
		prodops.removeChild(prodops.childNodes[2]);
	}
	prodops.childNodes[1].selected = "true";
	for(i = 0; i < rows.length; i++) {
		var textNode = document.createTextNode(rows[i].pname);
		var node = document.createElement("option");
		node.appendChild(textNode);
		node.value = rows[i].pname;
		prodops.appendChild(node);
	}
});
socket.on("prod_info", function(prod) {
		flag = false;
		for(i = 0; i < items.length; i++) {
			if(items[i].pid === prod[0].pid) {
				items[i].quantity++;
				flag = true;
			}
		}
		var total = document.getElementById("totalorder");
		total.textContent = parseInt(total.textContent) + parseInt(prod[0].cost);
		if(!flag) {
			items.push({pid: prod[0].pid, pname: prod[0].pname, cost: prod[0].cost, quantity: 1});
		}
		var prop = ["pid", "pname", "cost"], node = [];
		var tuple = document.createElement("tr");
		for( i = 0; i < 3; i++) {
			node.push(document.createElement("td"));
			node[i].appendChild(document.createTextNode(prod[0][prop[i]]));
			tuple.appendChild(node[i]);
		}
		cart.appendChild(tuple);
		var scr = document.getElementById("tablescroll");
		scr.scrollTop = scr.scrollHeight;
});
socket.on("cust_info", function(customers) {
	if(!customers.length)
		alert("not found");
	else {
		var prop = ["firstname", "lastname", "contact"];
		for(i = 0; i < 3; i++) {
			bill_form["cust_" + prop[i]].value = customers[0][prop[i]];
		}		
	};
});

socket.on("show_wallet", function(rows) {
	if(rows.length) {
		bill_form.cust_wallet.value = rows[0].amount;
	}
	else {
		bill_form.cust_wallet.value = "No e-wallet";
	}
});

socket.on("cust_generate", function(customers) {
	bill_form.cust_id.value = customers.length + 1;
	bill_form.cust_wallet.value = "0";
});

socket.on("prod_details", function(rows) {
	if(rows.length) {
		addprodform.prod_pname.value = rows[0].pname;
		addprodform.prod_cost.value = rows[0].cost;
		addprodform.prod_quantity.value = rows[0].quantity;
		addprodform.prod_threshold.value = rows[0].threshold;
		document.getElementById("prodsubmit").value = "Update";
	}
	else {
		addprodform.prod_quantity.value = 0;
		addprodform.prod_pname.value = "";
		addprodform.prod_cost.value = "";
		addprodform.prod_threshold.value = "";
		document.getElementById("prodsubmit").value = "Add";
	}
});

socket.on("sup_details", function(rows) {
	if(rows.length) {
		supplierform.submitsup.value = "Update";
		supplierform.sup_name.value = rows[0].supname;
		supplierform.sup_address.value = rows[0].address;
		supplierform.sup_contact.value = rows[0].contact;
		supplierform.sup_blacklisted.value = rows[0].blacklisted;
	}
	else {
		supplierform.submitsup.value = "Add";
		supplierform.sup_name.value = "";
		supplierform.sup_address.value = "";
		supplierform.sup_contact.value = "";
		supplierform.sup_blacklisted.value = "";
	}
});
socket.on("emp_details", function(rows) {
	if(rows.length){
		employeeform.emp_empname.value = rows[0].empname;
		employeeform.emp_salary.value = rows[0].salary;
		employeeform.emp_contact.value = rows[0].contact;
		document.getElementById("empsubmit").value = "Update";
	}
	else {
		employeeform.emp_empname.value = "";
		employeeform.emp_salary.value = "";
		employeeform.emp_contact.value = "";
		document.getElementById("empsubmit").value = "Add";
	}
});

checkCust.addEventListener("click", function(e) {
	e.preventDefault();
	if(validatefield(bill_form.cust_id)) {
		socket.emit("check_cust", bill_form.cust_id.value);
	}
});

generateCust.addEventListener("click", function(e) {
	e.preventDefault();
	socket.emit("generate_cust");
});

addbutton.addEventListener("click", function(e) {
	e.preventDefault();
	if(bill_form.prod_name.value == "Select product") {
		console.log("Please choose atleast 1 product");
	}
	else {
		socket.emit("seek_prod", bill_form.prod_name.value);
	}
});
bill_form.addEventListener("submit", function(e) {
	e.preventDefault();
	if(bill_form.usefromwallet.value == "") {
		bill_form.usefromwallet.value = 0;
	}
	if(validateform(bill_form)) {
		var b = bill_form;
		var custarr = [b.cust_id.value, b.cust_firstname.value, b.cust_lastname.value, b.cust_contact.value];
		socket.emit("bill", items, bill_form.cust_id.value, bill_form.emp_id.value, document.getElementById("orderId").textContent, custarr);
		
		document.getElementById("customername").textContent = "Name: "+ b.cust_firstname.value + " " + b.cust_lastname.value;
		var d = new Date();
		var dat = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(); 
		document.getElementById("todaydate").textContent = dat;
		
		clearform(bill_form);
		document.getElementById("billsheet").style.display = "initial";
		
		while(cart.childNodes.length > 2) {
			cart.removeChild(cart.childNodes[2]);
		}		
		var billitems = document.getElementById("billitems");
		while(billitems.childNodes.length > 2) {
			billitems.removeChild(billitems.childNodes[2]);
		}
		for(i = 0; i < items.length; i++) {
			var node = document.createElement("tr");
			var node1 = document.createElement("td");
			node1.appendChild(document.createTextNode(items[i].pid));
			var node2 = document.createElement("td");
			node2.appendChild(document.createTextNode(items[i].pname));
			var node3 = document.createElement("td");
			node3.appendChild(document.createTextNode(items[i].cost));
			var node4 = document.createElement("td");
			node4.appendChild(document.createTextNode(items[i].quantity));
			node.appendChild(node1);
			node.appendChild(node2);
			node.appendChild(node3);
			node.appendChild(node4);
			billitems.appendChild(node);
		}
		document.getElementById("billsubmit").style.display = "none";
	}
});
addprodform.addEventListener("submit", function(e) {
	e.preventDefault();
	if(validateform(addprodform)) {
		var row = [addprodform.prod_pid.value,addprodform.prod_pname.value, addprodform.prod_cost.value, addprodform.prod_quantity.value, addprodform.prod_threshold.value, addprodform.prod_toadd.value];
		socket.emit("addproduct", row);
		clearform(addprodform);
	}
});
document.getElementById("checkProd").addEventListener("click", function(e) {
	e.preventDefault();
	if(validatefield(addprodform.prod_pid)) {
		socket.emit("checkprod", addprodform.prod_pid.value);
	}
	
});
socket.on("giveWarnings", function(rows) {
	var prop = ["pid","pname","quantity","threshold"];
	while(tableOfWarnings.childNodes.length > 2) {
		tableOfWarnings.removeChild(tableOfWarnings.childNodes[2]);
	}
	for(i = 0; i < rows.length; i++) {
		var tablerow = document.createElement("tr");
		for(j = 0; j < 4; j++) {
			var textNode = document.createTextNode(rows[i][prop[j]]);
			var node = document.createElement("td");
			node.appendChild(textNode);
			tablerow.appendChild(node);
		}
		tableOfWarnings.appendChild(tablerow);
	}
});
document.getElementById("checkEmployee").addEventListener("click", function() {
	if(validatefield(employeeform.emp_empid)) {
		socket.emit("checkEmp", employeeform.emp_empid.value);
	}
});

document.getElementById("usewallet").addEventListener("click", function() {
	if(validatefield(bill_form.usefromwallet)) {
		socket.emit("fromWallet", bill_form.cust_id.value, bill_form.usefromwallet.value);
		var total = document.getElementById("totalorder");
		totalorder.textContent = parseInt(totalorder.textContent) - parseInt(bill_form.usefromwallet.value);
	}	
});

employeeform.addEventListener("submit", function(e) {
	e.preventDefault();
	if(validateform(employeeform)) {
		var row = [employeeform.emp_empid.value, employeeform.emp_empname.value, employeeform.emp_salary.value, employeeform.emp_contact.value];
		if(document.getElementById("empsubmit").value === "Update") {
			socket.emit("update_emp", row);
		}
		else socket.emit("addnew_emp", row);
		clearform(employeeform);
	}
});

document.getElementById("checkSupplier").addEventListener("click", function() {
	if(validatefield(supplierform.sup_id)) {
		socket.emit("checksup", supplierform.sup_id.value);
	}
});

document.getElementById("status").onclick = function(e) {
	if(e.target.textContent == "LOG IN") {
		modal.style.display = "initial";
	}
	else {
		stat = "loggedout";
		e.target.textContent = "LOG IN"
	}
};

adminform.onsubmit = function(e) {
	e.preventDefault();
	if(adminform.pass.value == pw) {
		modal.style.display = "none";
		document.getElementById("status").textContent = "LOG OUT";
		stat = "loggedin";
	}
	else {
		alert("Wrong password, try again...");
	}
}

supplierform.onsubmit = function(e) {
	e.preventDefault();
	if(validateform(supplierform)) {
		socket.emit("addupdatesup", [supplierform.sup_id.value, supplierform.sup_name.value, supplierform.sup_address.value, supplierform.sup_contact.value, supplierform.sup_blacklisted.value], supplierform.submitsup.value);
		clearform(supplierform);
	}
}
