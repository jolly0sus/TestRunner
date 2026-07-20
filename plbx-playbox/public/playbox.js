(function () {
  'use strict';

  var CFG = window.__PLAYBOX__ || { target: '', lanTarget: '', defaultDevice: 's23ultra' };
  var DEVICES = window.PLAYBOX_DEVICES || [];
  var LS = 'plbx.playbox.state';

  // DOM
  var deviceEl = document.getElementById('device');
  var screenEl = deviceEl.querySelector('.screen');
  var frame = document.getElementById('frame');
  var select = document.getElementById('deviceSelect');
  var orientationBtn = document.getElementById('orientationBtn');
  var orientationLabel = document.getElementById('orientationLabel');
  var orientationIco = document.getElementById('orientationIco');
  var cleanBtn = document.getElementById('cleanBtn');
  var muteBtn = document.getElementById('muteBtn');
  var reloadBtn = document.getElementById('reloadBtn');
  var qrBtn = document.getElementById('qrBtn');
  var resLabel = document.getElementById('resLabel');
  var qrModal = document.getElementById('qrModal');
  var qrClose = document.getElementById('qrClose');
  var qrImg = document.getElementById('qrImg');
  var qrLink = document.getElementById('qrLink');

  // State (restored from localStorage where possible)
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) {}
  var state = {
    deviceId: saved.deviceId || CFG.defaultDevice,
    landscape: !!saved.landscape,
    muted: !!saved.muted,
    clean: !!saved.clean,
  };

  function persist() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
  function currentDevice() {
    return DEVICES.filter(function (d) { return d.id === state.deviceId; })[0] || DEVICES[0];
  }

  // ---------------------------------------------------------------- populate
  DEVICES.forEach(function (d) {
    var o = document.createElement('option');
    o.value = d.id;
    o.textContent = d.name;
    select.appendChild(o);
  });
  select.value = state.deviceId;

  // ---------------------------------------------------------------- layout
  function apply() {
    var d = currentDevice();
    var w = state.landscape ? d.h : d.w;
    var h = state.landscape ? d.w : d.h;

    screenEl.style.width = w + 'px';
    screenEl.style.height = h + 'px';
    deviceEl.setAttribute('data-camera', d.camera || 'none');
    deviceEl.classList.toggle('clean', state.clean);

    orientationLabel.textContent = state.landscape ? 'Landscape' : 'Portrait';
    orientationIco.textContent = state.landscape ? '▭' : '▯';
    resLabel.textContent = w + ' × ' + h;
    muteBtn.textContent = state.muted ? '🔇' : '🔊';
    muteBtn.classList.toggle('active', state.muted);
    cleanBtn.classList.toggle('active', state.clean);

    fit();
    persist();
  }

  // Scale the (unscaled-measured) device so it fits the available viewport.
  function fit() {
    deviceEl.style.setProperty('--scale', '1');
    var natW = deviceEl.offsetWidth;
    var natH = deviceEl.offsetHeight;
    var availW = window.innerWidth - 48;
    var availH = window.innerHeight - 84 - 48;
    var scale = Math.min(availW / natW, availH / natH, 1);
    deviceEl.style.setProperty('--scale', String(scale));
  }

  // ---------------------------------------------------------------- iframe
  function loadTarget() {
    // Assigning src (rather than reload()) works across origins.
    frame.src = CFG.target;
  }

  // Best-effort mute: playables can opt in by listening for this message.
  function sendMute() {
    try {
      frame.contentWindow.postMessage(
        { source: 'playbox', type: 'playbox:mute', muted: state.muted }, '*'
      );
    } catch (e) {}
  }

  // ---------------------------------------------------------------- QR
  function openQR() {
    var url = CFG.lanTarget || CFG.target;
    qrImg.src = '/api/qr?data=' + encodeURIComponent(url);
    qrLink.textContent = url;
    qrLink.href = url;
    qrModal.hidden = false;
  }
  function closeQR() { qrModal.hidden = true; }

  // ---------------------------------------------------------------- events
  select.addEventListener('change', function () { state.deviceId = select.value; apply(); });
  orientationBtn.addEventListener('click', function () { state.landscape = !state.landscape; apply(); });
  cleanBtn.addEventListener('click', function () { state.clean = !state.clean; apply(); });
  muteBtn.addEventListener('click', function () { state.muted = !state.muted; apply(); sendMute(); });
  reloadBtn.addEventListener('click', loadTarget);
  qrBtn.addEventListener('click', openQR);
  qrClose.addEventListener('click', closeQR);
  qrModal.addEventListener('click', function (e) { if (e.target === qrModal) closeQR(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeQR(); });
  window.addEventListener('resize', fit);
  frame.addEventListener('load', sendMute); // re-assert mute after (re)loads

  // ---------------------------------------------------------------- boot
  loadTarget();
  apply();
})();
