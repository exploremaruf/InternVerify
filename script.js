<script>
(function () {
  'use strict';

  // Hardcoded to the deployed Web App URL — required because the page
  // itself loads inside a script.googleusercontent.com iframe, so
  // window.location.href does NOT point at the real /exec endpoint.
  //
  // IMPORTANT: if you ever create a brand-new deployment (not just a
  // new version of the existing one), update this URL to match.
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzGvR7KZ0ufagreQ1Q9UZjQ0kVt_OGpWybtxQRgnBINc4Syb_W-UIvhotO8jIBkaUuh/exec';

  const FIELD_LABELS = [
    { key: 'studentName',     label: "Student's Name",         icon: 'person',                mono: false },
    { key: 'boardRoll',       label: 'Board Roll',             icon: 'badge',                  mono: true },
    { key: 'regNo',           label: 'Reg. No',                icon: 'fingerprint',             mono: true },
    { key: 'session',         label: 'Session',                icon: 'calendar_month',          mono: false },
    { key: 'mobile',          label: 'Communicating Mobile No', icon: 'call',                   mono: true },
    { key: 'preferredField',  label: 'Preferred Field',        icon: 'work',                    mono: false },
    { key: 'industryName',    label: 'Industry Name',          icon: 'apartment',               mono: false },
    { key: 'industryMobile',  label: 'Industry Mobile Number', icon: 'phone_in_talk',           mono: true },
    { key: 'industryAddress', label: 'Industry Address',       icon: 'location_on',             mono: false },
    { key: 'industryWebsite', label: 'Industry Website',       icon: 'language',                mono: false },
    { key: 'rocketMobile',    label: 'Rocket Acc.',            icon: 'account_balance_wallet',  mono: true }
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

    const url = WEB_APP_URL + '?' + params.toString();

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
      const rawValue = data[field.key] || '\u2014';
      const value = formatValue(field, rawValue);
      const monoClass = field.mono ? ' mono' : '';
      return (
        '<div class="result-row">' +
        '<span class="material-symbols-rounded row-icon" aria-hidden="true">' + field.icon + '</span>' +
        '<div class="row-text">' +
        '<span class="row-label">' + escapeHtml(field.label) + '</span>' +
        '<span class="row-value' + monoClass + '">' + value + '</span>' +
        '</div>' +
        '</div>'
      );
    }).join('');

    resultCard.innerHTML =
      '<div class="result-header">' +
      '<div class="result-avatar"><span class="material-symbols-rounded" aria-hidden="true">verified</span></div>' +
      '<div>' +
      '<h2>' + escapeHtml(data.studentName || 'Student Record') + '</h2>' +
      '<p><span class="material-symbols-rounded" aria-hidden="true">check_circle</span> Record found successfully</p>' +
      '</div>' +
      '</div>' +
      '<div class="result-body">' + rowsHtml + '</div>';

    showEl(resultCard);
  }

  function formatValue(field, rawValue) {
    const safe = escapeHtml(rawValue);
    if (field.key === 'industryWebsite' && rawValue && rawValue !== '\u2014') {
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
</script>
