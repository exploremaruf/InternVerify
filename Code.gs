/**
 * ============================================================
 *  STUDENT RECORD PORTAL — Code.gs
 * ============================================================
 *  1. Serves the web app UI (index.html + style.html + script.html)
 *  2. Handles ?action=search requests and returns JSON
 *
 *  IMPORTANT — CONFIGURE THESE TWO VALUES BEFORE DEPLOYING:
 * ============================================================
 */
const SHEET_ID   = '1PwVM3xEmvRyWBbHJ0iaCnbuopdHw_0_jx3H-PDYPd8M';
const SHEET_NAME = 'Sheet1';

/**
 * Column headers exactly as they must appear in ROW 1 of your sheet.
 * If your sheet uses slightly different header text, edit the values
 * on the right-hand side below so they match your sheet exactly.
 */
const COLUMNS = {
  studentName:     "Student`s Name",
  boardRoll:       "Board Roll",
  regNo:           "Reg. No",
  session:         "Session",
  mobile:          "Communicating Mobile No",
  preferredField:  "Preferred Field",
  industryName:    "Industry Name",
  industryMobile:  "Industry Mobile Number",
  industryAddress: "Industry Address",
  industryWebsite: "Industry Website",
  rocketMobile:    "Rocket Acc."
};

/**
 * Human-friendly labels used only for error messages (not required by the UI,
 * the frontend has its own copy of these labels).
 */

/* ---------------------------------------------------------
 * doGet — entry point for both page loads and API calls
 * --------------------------------------------------------- */
function doGet(e) {
  try {
    // API mode: /exec?action=search&boardRoll=...&mobile=...
    if (e && e.parameter && e.parameter.action === 'search') {
      return handleSearch(e);
    }

    // Normal mode: serve the HTML page
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Student Record Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return jsonResponse({ success: false, message: 'Server error: ' + err.message });
  }
}

/* ---------------------------------------------------------
 * Core search logic
 * --------------------------------------------------------- */
function handleSearch(e) {
  const boardRollInput = (e.parameter.boardRoll || '').toString().trim();
  const mobileInput     = (e.parameter.mobile || '').toString().trim();

  if (!boardRollInput || !mobileInput) {
    return jsonResponse({
      success: false,
      message: 'Both Board Roll and Mobile Number are required.'
    });
  }

  let sheet;
  try {
    sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  } catch (err) {
    return jsonResponse({ success: false, message: 'Could not open the spreadsheet. Check SHEET_ID.' });
  }

  if (!sheet) {
    return jsonResponse({
      success: false,
      message: 'Sheet tab "' + SHEET_NAME + '" not found. Check SHEET_NAME in Code.gs.'
    });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonResponse({ success: false, message: 'The sheet has no data rows.' });
  }

  const headers = data[0].map(function (h) { return h.toString().trim(); });

  // Map each logical field to its column index by matching header text
  const colIndex = {};
  Object.keys(COLUMNS).forEach(function (key) {
    colIndex[key] = headers.indexOf(COLUMNS[key]);
  });

  const missing = Object.keys(colIndex).filter(function (k) { return colIndex[k] === -1; });
  if (missing.length) {
    return jsonResponse({
      success: false,
      message: 'These columns were not found in row 1 of the sheet: ' +
        missing.map(function (k) { return COLUMNS[k]; }).join(', ')
    });
  }

  const normalizeText = function (s) {
    return s.toString().trim().toLowerCase().replace(/\s+/g, '');
  };
  const digitsOnly = function (s) {
    return s.toString().replace(/\D/g, '');
  };

  const targetRoll   = normalizeText(boardRollInput);
  const targetMobile = digitsOnly(mobileInput);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowRoll = row[colIndex.boardRoll];
    if (!rowRoll) continue;

    const rollMatch = normalizeText(rowRoll) === targetRoll;
    if (!rollMatch) continue;

    const rowMobileDigits = digitsOnly(row[colIndex.mobile] || '');

    // Match on exact digits, OR the input matches the last 4+ digits on file
    const mobileMatch =
      rowMobileDigits === targetMobile ||
      (targetMobile.length >= 4 && rowMobileDigits.slice(-targetMobile.length) === targetMobile);

    if (mobileMatch) {
      const result = {};
      Object.keys(COLUMNS).forEach(function (key) {
        const val = row[colIndex[key]];
        result[key] = (val === undefined || val === null) ? '' : val.toString();
      });
      return jsonResponse({ success: true, data: result });
    }
  }

  return jsonResponse({
    success: false,
    message: 'No record found. Please check your Board Roll and Mobile Number.'
  });
}

/* ---------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Used by index.html to pull in style.html / script.html as includes
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
