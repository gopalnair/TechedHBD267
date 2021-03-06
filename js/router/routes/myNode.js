/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0, dot-notation:0 */
"use strict";
var express = require("express");

module.exports = function() {
	var app = express.Router();

	//Hello Router
	app.get("/", function(req, res) {
		res.send("Hello World Node.js");
	});

	//Simple Database Select - In-line Callbacks
	app.get("/example1", function(req, res) {
		var client = req.db;
		client.prepare(
			"select SESSION_USER from \"DUMMY\" ",
			function(err, statement) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				}
				statement.exec([],
					function(err, results) {
						if (err) {
							res.type("text/plain").status(500).send("ERROR: " + err.toString());
							return;
						} else {
							var result = JSON.stringify({
								Objects: results
							});
							res.type("application/json").status(200).send(result);
						}
					});
			});
	});

	//Call Stored Procedure and return as Excel
	app.get("/products", function(req, res) {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		//(client, Schema, Procedure, callback)
		hdbext.loadProcedure(client, null, "build_products", function(err, sp) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err.toString());
				return;
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp({}, function(err, parameters, results) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
				}
				var out = [];
				for (var i = 0; i < results.length; i++) {
					out.push([results[i]["PRODUCTID"], results[i]["CATEGORY"], results[i]["PRICE"]]);
				}
				var excel = require("node-xlsx");
				var excelOut = excel.build([{
					name: "Products",
					data: out
				}]);
				res.header("Content-Disposition", "attachment; filename=Excel.xlsx");
				res.type("application/vnd.ms-excel").status(200).send(excelOut);
			});
		});

	});

	return app;
};