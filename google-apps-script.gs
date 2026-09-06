/**
 * GOOGLE APPS SCRIPT BACKEND
 * Class Attendance & Gradebook Live Sync Web App
 *
 * INSTRUCTIONS:
 * 1. Open your Google Sheet (containing Master_List, Attendance, and Grades tabs).
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code with this script.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Execute as: "Me", Who has access: "Anyone".
 * 7. Copy the generated Web App URL and paste it into your app.js or dashboard settings!
 */

function doGet(e) {
  var action = e.parameter.action || "get_all";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "get_master") {
    return ContentService.createTextOutput(JSON.stringify(getSheetData(ss, "Master_List")))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "get_attendance") {
    return ContentService.createTextOutput(JSON.stringify(getSheetData(ss, "Attendance")))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "get_grades") {
    return ContentService.createTextOutput(JSON.stringify(getSheetData(ss, "Grades")))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: Return combined JSON
  var payload = {
    status: "success",
    timestamp: new Date().toISOString(),
    master: getSheetData(ss, "Master_List"),
    attendance: getSheetData(ss, "Attendance"),
    grades: getSheetData(ss, "Grades")
  };

  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === "log_attendance") {
      var attSheet = getOrCreateSheet(ss, "Attendance", [
        "Student ID", "Date", "Course Title", "Instructor Name", "Student Name", "Year & Section", "Status", "Timestamp"
      ]);
      
      data.records.forEach(function(rec) {
        attSheet.appendRow([
          rec.studentId || "",
          rec.date || new Date().toISOString().split("T")[0],
          rec.courseTitle || "",
          rec.instructorName || "",
          rec.studentName || "",
          rec.yearSection || "",
          rec.status || "Present",
          rec.timestamp || new Date().toLocaleString()
        ]);
      });

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Attendance saved to sheet" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "update_grade") {
      var gradeSheet = getOrCreateSheet(ss, "Grades", [
        "Student ID", "First Name", "Surname", "Quiz 1", "Quiz 2", "Midterm", "Project", "Final", "Weighted Score"
      ]);
      
      updateOrAppendRow(gradeSheet, 0, data.studentId, [
        data.studentId, data.firstName, data.surname, data.q1, data.q2, data.midterm, data.project, data.final, data.weightedScore
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Grade updated" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- HELPER FUNCTIONS ---
function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var results = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    results.push(obj);
  }
  return results;
}

function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
    }
  }
  return sheet;
}

function updateOrAppendRow(sheet, keyColIndex, keyValue, rowData) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyColIndex]).trim() === String(keyValue).trim()) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}
