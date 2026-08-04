/* ============================================================
   STUDENT RECORD PORTAL — script.js
   NOTE: Inside the Apps Script editor this content must live in
   a file named "script.html", wrapped like:
     <script> ...this whole file... </script>
   ============================================================ */

(function () {
  'use strict';

  /**
   * IMPORTANT:
   * Because this script is served BY the same Apps Script web app
   * it is calling, you can leave WEB_APP_URL as an empty string —
   * the code will automatically fetch relative to its own URL and
   * you will hit zero CORS issues.
   *
   * If you ever host this frontend somewhere ELSE (e.g. GitHub Pages)
   * and only use Apps Script as an API, paste your deployed
   * "…/exec" Web App URL below instead.
   */
  const WEB_APP_URL = ''; // e.g. 'https://script.google.com/macros/s/AKfycb.../exec'

  const FIELD_LABELS = [
    { key: 'studentName',     label: "Student's Name" },
    { key: 'boardRoll',       label: 'Board Roll' },
    { key: 'regNo',           label: 'Reg. No' },
    { key: 'session',         label: 'Session' },
    { key: 'mobile',          label: 'Communicating Mobile No' },
    { key: 'preferredField',  label: 'Preferred Field' },
    { key: 'industryName',    label: 'Industry Name' },
    { key: 'industryMobile',  label: 'Industry Mobile Number' },
    { key: 'industryAddress', label: 'Industry Address' },
    { key: 'industryWebsite', label: 'Industry Website' },
    { key: 'rocketMobile',    label: 'Rocket Acc. Mobile No.' }
  ];

  const form        = document.getElementById('searchForm');
  const boardRollEl = document.getElementById('boardRoll');
  const mobileEl    = document.getElementById('mobile');
  const searchBtn   = document.getElementById('searchBtn');
  const formError   = document.getElementById('formError');
  const statusBox   = document.getElementById('statusBox');
  const messageBox  = document.getElementById('messageBox');
  const resultCard  = document.getElementById('resultCard');

  document.getElementById('year').textContent = new Date().getFullYear();

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    handleSearch();
  });

  function handleSearch() {
    hideEl(formError);
    hideEl(messageBox);
    hideEl(resultCard);

    const boardRoll = sanitize(boardRollEl.value);
    const mobile    = sanitize(mobileEl.value);

    if (!boardRoll || !mobile) {
      showError('Please enter both your Board Roll and Mobile Number.');
      return;
    }

    if (!/^[0-9A-Za-z-]+$/.test(boardRoll)) {
      showError('Board Roll should contain only letters, numbers, or hyphens.');
      return;
    }

    if (!/^[0-9+ ]+$/.test(mobile)) {
      showError('Mobile Number should contain only digits.');
      return;
    }

    fetchStudentRecord(boardRoll, mobile);
  }

  function sanitize(value) {
    return (value || '').toString().trim();
  }

  function showError(msg) {
    formError.textContent = msg;
    showEl(formError);
  }

  function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    if (isLoading) {
      showEl(statusBox);
    } else {
      hideEl(statusBox);
    }
  }

  function fetchStudentRecord(boardRoll, mobile) {
    setLoading(true);

    const params = new URLSearchParams({
      action: 'search',
      boardRoll: boardRoll,
      mobile: mobile
    });

    const base = WEB_APP_URL || window.location.href.split('?')[0];
    const url  = base + '?' + params.toString();

    fetch(url, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Network error (status ' + res.status + ')');
        }
        return res.json();
      })
      .then(function (json) {
        setLoading(false);
        if (json && json.success) {
          renderResult(json.data);
        } else {
          renderMessage(
            (json && json.message) ||
              'No record found. Please check your Board Roll and Mobile Number.',
            'error'
          );
        }
      })
      .catch(function (err) {
        setLoading(false);
        renderMessage(
          'Something went wrong while fetching your record. Please try again. (' +
            err.message +
            ')',
          'error'
        );
      });
  }

  function renderMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = 'message-box ' + (type || 'info');
    showEl(messageBox);
  }

  function renderResult(data) {
    const rowsHtml = FIELD_LABELS.map(function (field) {
      const rawValue = data[field.key] || '—';
      const value = formatValue(field.key, rawValue);
      return (
        '<div class="result-row">' +
        '<span class="label">' + escapeHtml(field.label) + '</span>' +
        '<span class="value">' + value + '</span>' +
        '</div>'
      );
    }).join('');

    resultCard.innerHTML =
      '<div class="result-header">' +
      '<h2>' + escapeHtml(data.studentName || 'Student Record') + '</h2>' +
      '<p>Record found successfully</p>' +
      '</div>' +
      '<div class="result-body">' + rowsHtml + '</div>';

    showEl(resultCard);
  }

  function formatValue(key, rawValue) {
    const safe = escapeHtml(rawValue);
    if (key === 'industryWebsite' && rawValue && rawValue !== '—') {
      const href = /^https?:\/\//i.test(rawValue) ? rawValue : 'https://' + rawValue;
      return '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' + safe + '</a>';
    }
    return safe;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function showEl(el) {
    el.hidden = false;
  }

  function hideEl(el) {
    el.hidden = true;
  }
})();
