/**
 * aim:
 *   capture user details and their bookings
 *
 * usage:
 *   1. Publish > Deploy as web app 
 *      - enter Project Version name and click 'Save New Version' 
 *      - set security level and enable service: execute as 'me' and access 'anyone', even anonymously
 *   2. Copy the 'Current web app URL' and post this in your form/script action
 *
 * docs:
 *   https://developers.google.com/apps-script/guides/web
 *   https://developers.google.com/apps-script/guides/support/best-practices
 *
 * credit:
 *   adapted from https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
 */

function doGet(e) { return App.respond(e, {method: "get"}) }
function doPost(e) { return App.respond(e, {method: "post"}) }

var META = {
  NOW: undefined // useful to test time related logic
, sheets: {
    Mon: {
      headerRow: 4
    }
  , Tue: {
      headerRow: 4
    }
  , Wed: {
      headerRow: 4
    }
  , Thu: {
      headerRow: 4
    }
  , Fri: {
      headerRow: 4
    }
  , Sat: {
      headerRow: 4
    }
  , Sun: {
      headerRow: 4
    }
  }
};

var Tools = {
  lock: LockService
, content: ContentService
, sheet: SpreadsheetApp
, json: JSON
};

var Sheet = (function(service, config) {
  var sheet = service.getActiveSpreadsheet();
  
  var cache = {};
  function factory(name) {
    if (!cache[name]) {
      cache[name] = new Sheet(name);
    }
    return cache[name];
  }
  
  function Sheet(name) {
    this.sheet = sheet.getSheetByName(name);
    this.headerRow = config[name].headerRow;
    
    this.cache = {};
  }
  Sheet.prototype.insert = function(data) {
    var header = this.header();
    var nextRow = this.sheet.getLastRow() + 1;

    var row = [];
    for (var i in header) {
      var value = data[header[i]];
      if (typeof value === "undefined") { value = ""; }
      row.push(value);
    }

    this.sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    
    var result = {};
    result.ok = true;
    return result;
  };
  Sheet.prototype.header = function () {
    var key = "header";
    if (!this.cache[key]) {
      this.cache[key] = this.values()[this.headerRow - 1];
    }
    return this.cache[key];
  }
  Sheet.prototype.values = function () {
    var key = "values";
    if (!this.cache[key]) {
      this.cache[key] = this.sheet.getDataRange().getValues();
    }
    return this.cache[key];
  }


  return factory;
})(Tools.sheet, META.sheets);

var App = (function(tools, meta, sheet) {
  var actions = {};
  var app = {};

  app.actions = actions; // expose actions to unit test
  
  var respond = function (e) {
    var response = tools.content.createTextOutput()
      .setMimeType(tools.content.MimeType.JSON);
    var responseBody;

    try {
      var result;
      
      var action = actions[e.parameter.action || e.parameter.Action];
      if (action) {
        result = action(e);
      }
      
      if (result) {
        responseBody = tools.json.stringify({"status": result.status, "body": result.body});
      } else {
        responseBody = tools.json.stringify({"status": "400 Bad Request"});
      }
    } catch(e) {
      responseBody = tools.json.stringify({"status":"500 Internal Server Error", "body": e});
    }
    
    return response.setContent(responseBody);
  }
  app.respond = function (e, options) {
    var result;
    
    // shortly after my original solution Google announced the LockService[1]
    // this prevents concurrent access overwritting data
    // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
    // we want a public lock, one that locks for all invocations
    var lock = tools.lock.getPublicLock();
    lock.waitLock(30*1000); // wait 30 seconds before conceding defeat.
    
    try {
      result = respond(e);
    } finally {
      lock.releaseLock();
    }
    
    return result;
  }
  
  /**
   *  POST ?action=create...
   */
  actions.create = function (e) {
    var data = e.parameter;
    var day = data["session[date]"];
    var time = data["session[time]"];
    data[time] = "v"; // ticked - Sue's convention
    data.booked_at || (data.booked_at = new Date);
    
    sheet(day).insert(data);

    var result = {};    
    result.status = "200 OK";
    result.body = {
      "message": "Your booking has been accepted.",
      "booking": data,
    };
    
    return result;
  };
  
  return app;
})(Tools, META, Sheet);


function testActionCreateBooking() {
  var result = App.actions.create({
    "parameters": {
      "action": ["create"],

      "name": ["aoeu"],
      "contact": ["aoeu"],

      "session[time]": ["14","16"],
      "session[date]": ["Sun"],
    },
    "parameter": {
      "action": "create",

      "name": "aoeu",
      "contact": "aoeu",

      "session[time]": "14",
      "session[date]": "Sun",
    },    
  });

  
  var breakpoint = {};
}
