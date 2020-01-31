/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {
  MongoClient.connect(CONNECTION_STRING, function(err, client) {
    if (err) throw err;
    var dbo = client.db("issueTracker");
    var issueList = dbo.collection("issueTracker");

    app
      .route("/api/issues/:project")

      .get(function(req, res) {
        var project = req.params.project;
        let query = req.query;

        let searchObj = Object.assign({ project: project }, query);

        issueList.find(searchObj, function(err, cb) {
          cb.toArray().then(items => {
            res.send(items);
          });
        });
      })

      .post(function(req, res) {
        var project = req.params.project;
        let newEntry = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to,
          status_text: req.body.status_text,
          created_on: new Date().toISOString(),
          updated_on: new Date().toISOString(),
          open: "true",
          project: project
        };
        if (
          newEntry.issue_title == undefined ||
          newEntry.issue_text == undefined ||
          newEntry.created_by == undefined
        ) {
          return res.send("missing required fields");
        }

        issueList.insertOne(newEntry, function(err, cb) {
          delete cb.ops[0].project;
          res.json(cb.ops[0]);
        });
      })

      .put(function(req, res) {
        var project = req.params.project;

        let newEntry = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to,
          status_text: req.body.status_text,
          updated_on: new Date().toISOString(),
          open: req.body.open == "false" ? "false" : "true"
        };

        function checkEmpty(obj) {
          Object.keys(obj).forEach(function(key) {
            if (obj[key] == undefined) delete obj[key];
          });
        }

        checkEmpty(newEntry);

        issueList.updateOne(
          { _id: ObjectId(req.body._id) },
          {
            $set: newEntry
          },
          function(err, cb) {
            if (Object.keys(newEntry).length == 2) {
              return res.send("no updated field sent");
            }
            if (cb.result.n == 0) {
              return res.send("could not update " + req.body._id);
            }
            res.send("succesfully updated");
          }
        );
      })

      .delete(function(req, res) {
        var project = req.params.project;

        if (!ObjectId.isValid(req.body._id)) {
          return res.send("_id error");
        }

        issueList.deleteOne({ _id: ObjectId(req.body._id) }, function(err, cb) {
          if (cb.result.n == 0) {
            return res.send("could not delete " + req.body._id);
          }

          res.send("deleted " + req.body._id);
        });
      });

    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res
        .status(404)
        .type("text")
        .send("Not Found");
    });
  });
};
