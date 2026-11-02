/**
 * "Website projects" sheet — Apps Script (Extensions → Apps Script in the sheet).
 * Keeps one row per website project, filled from https://bloc11.studio/data/projects.json:
 *   • new projects are added as rows (with the category Gemini chose);
 *   • empty cells are filled from the website; cells you have filled in are never changed.
 * What you fill in is applied to the website on the next "Refresh from Drive" in the admin page.
 * Menu "Bloc 11" → "Update from website" runs it by hand; "Set up" (once) adds the dropdowns and an hourly update.
 */
const SITE = 'https://bloc11.studio/data/projects.json';
const HEAD = ['Project', 'Show on website', 'Position', 'Category', 'Type', 'Status', 'Year', 'City', 'Photos', 'Own page', 'ID'];
const KEYS = ['title', 'show', 'order', 'category', 'type', 'status', 'year', 'city', 'photos', 'page', 'id'];
const INFO = ['photos'];                 // read-only column, always refreshed from the website
const CATEGORIES = ['Residential', 'Commercial', 'Hospitality', 'Institutional', 'Interiors', 'Planning', 'Installations'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Bloc 11')
    .addItem('Update from website', 'updateFromWebsite')
    .addItem('Set up (run once)', 'setup')
    .addToUi();
}

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName('Projects') || ss.getSheets()[0];
}

function setup() {
  const sh = sheet_();
  sh.setName('Projects');
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#141414').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  if (sh.getMaxRows() < 201) sh.insertRowsAfter(sh.getMaxRows(), 201 - sh.getMaxRows());
  const n = sh.getMaxRows() - 1;
  const rule = (list) => SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
  sh.getRange(2, 2, n, 1).setDataValidation(rule(['Yes', 'No']));
  sh.getRange(2, 4, n, 1).setDataValidation(rule(CATEGORIES));
  sh.getRange(2, 6, n, 1).setDataValidation(rule(['Completed', 'Ongoing']));
  sh.getRange(2, 10, n, 1).setDataValidation(rule(['Yes', 'No'])).setFontColor('#141414');
  sh.getRange(2, 3, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThan(0).setAllowInvalid(false).build());
  sh.getRange(2, 9, n, 1).setFontColor('#8a8782');          // read-only info
  sh.hideColumns(11);                                        // ID: links the row to the project
  sh.setColumnWidth(1, 220);
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('updateFromWebsite').timeBased().everyHours(1).create();
  updateFromWebsite();
}

function updateFromWebsite() {
  const data = JSON.parse(UrlFetchApp.fetch(SITE + '?t=' + Date.now(), { muteHttpExceptions: true }).getContentText()).projects || [];
  const sh = sheet_();
  const last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, HEAD.length).getValues() : [];
  const idCol = HEAD.length - 1;
  const at = new Map(rows.map((r, k) => [String(r[idCol]), k]));
  const show = (v) => (v ? 'Yes' : 'No');
  data.forEach((p) => {
    const vals = KEYS.map((k) => (k === 'show' ? show(p.show) : k === 'page' ? (p.page ? 'Yes' : 'No') : p[k] === undefined ? '' : p[k]));
    if (!at.has(p.id)) { rows.push(vals); at.set(p.id, rows.length - 1); return; }
    const r = rows[at.get(p.id)];
    KEYS.forEach((k, c) => { if (INFO.includes(k) || r[c] === '' || r[c] === null) r[c] = vals[c]; });
  });
  if (rows.length) sh.getRange(2, 1, rows.length, HEAD.length).setValues(rows);
  sh.getRange(1, 12).setValue('Updated ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'd MMM, h:mm a')).setFontColor('#8a8782');
}
