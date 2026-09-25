/* MediVeR XR — wireframe shell renderer.
   Injects the sidebar, top bar and planning rail so each page file
   only contains its own content. */

(function () {
  var S = 'stroke="currentColor" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  var ic = {
    home: '<path ' + S + ' d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2V15H9.2v5.5H5A1.5 1.5 0 0 1 3.5 19z"/>',
    cube: '<path ' + S + ' d="M12 3 20 7.2v9.6L12 21l-8-4.2V7.2z"/><path ' + S + ' d="M4 7.2 12 11.5l8-4.3M12 11.5V21"/>',
    folder: '<path ' + S + ' d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.6l1.9 2.4h8.1a1.7 1.7 0 0 1 1.7 1.7v7.7a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z"/>',
    clip: '<path ' + S + ' d="M9.2 5.2H7.4a1.9 1.9 0 0 0-1.9 1.9v11.4a1.9 1.9 0 0 0 1.9 1.9h9.2a1.9 1.9 0 0 0 1.9-1.9V7.1a1.9 1.9 0 0 0-1.9-1.9h-1.8"/><rect ' + S + ' x="9.2" y="3.3" width="5.6" height="3.6" rx="1.3"/>',
    chart: '<path ' + S + ' d="M4 4v16h16"/><path ' + S + ' d="M8 16.5v-3.8M12 16.5V8.5M16 16.5v-6"/>',
    book: '<path ' + S + ' d="M4.5 5.6A2.1 2.1 0 0 1 6.6 3.5H19.5v13.6H6.6a2.1 2.1 0 0 0-2.1 2.1z"/><path ' + S + ' d="M19.5 17.1v3.4H6.6"/>',
    users: '<circle ' + S + ' cx="9.4" cy="8.4" r="3.1"/><path ' + S + ' d="M3.8 19.4a5.6 5.6 0 0 1 11.2 0"/><path ' + S + ' d="M16 6.1a3 3 0 0 1 0 5.8M17.4 14.6a5.2 5.2 0 0 1 2.8 4.8"/>',
    gear: '<circle ' + S + ' cx="12" cy="12" r="2.8"/><path ' + S + ' d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
    help: '<circle ' + S + ' cx="12" cy="12" r="8.5"/><path ' + S + ' d="M9.7 9.6a2.4 2.4 0 1 1 3.2 2.3c-.6.2-.9.7-.9 1.3v.5"/><circle cx="12" cy="16.6" r="1" fill="currentColor"/>',
    bell: '<path ' + S + ' d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.2 1.5 5.2h-14S6.5 14 6.5 10Z"/><path ' + S + ' d="M10.2 18.3a2 2 0 0 0 3.6 0"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ic[name] || '') + '</svg>';
  }

  var NAV = [
    { id: 'home', label: 'Home', href: 'home.html', icon: 'home' },
    { id: 'simulations', label: 'Simulations', href: 'simulations.html', icon: 'cube' },
    { id: 'cases', label: 'Cases', href: 'cases.html', icon: 'folder' },
    { id: 'content', label: 'Content', href: 'content.html', icon: 'clip' },
    { id: 'assessments', label: 'Assessments', href: 'assessments.html', icon: 'clip' },
    { id: 'performance', label: 'Performance', href: 'performance.html', icon: 'chart' },
    { id: 'library', label: 'Library', href: 'library.html', icon: 'book' },
    { id: 'cohorts', label: 'Cohorts', href: 'cohorts.html', icon: 'users' },
    { id: 'settings', label: 'Settings', href: 'settings.html', icon: 'gear' }
  ];

  var STEPS = [
    'Case history', 'Imaging review', 'Deformity measurement', 'Alignment planning',
    'Implant selection', 'Risk & strategy', 'Plan summary'
  ];

  var active = document.body.getAttribute('data-nav') || '';

  // ---- sidebar ----
  var side = document.querySelector('[data-side]');
  if (side) {
    var html = '' +
      '<a class="brand" href="index.html">' +
        '<span class="mark">M</span>' +
        '<span class="name">MediVeR<small>XR Dashboard</small></span>' +
      '</a>';
    NAV.forEach(function (n) {
      html += '<a class="nav-item' + (n.id === active ? ' on' : '') + '" href="' + n.href + '">' +
        svg(n.icon) + '<span>' + n.label + '</span></a>';
    });
    html += '<div class="nav-foot">' +
      '<div class="nav-sep"></div>' +
      '<a class="nav-item' + (active === 'help' ? ' on' : '') + '" href="help.html">' + svg('help') + '<span>Help</span></a>' +
      '<a class="nav-item" href="index.html">' + svg('dot') + '<span>Wireframe index</span></a>' +
      '</div>';
    side.innerHTML = html;
  }

  // ---- top bar ----
  var top = document.querySelector('[data-topbar]');
  if (top) {
    var crumb = (top.getAttribute('data-crumb') || 'Home').split('/');
    var c = '<nav class="crumb">';
    crumb.forEach(function (p, i) {
      if (i) c += '<span class="sep">›</span>';
      c += (i === crumb.length - 1) ? '<b>' + p.trim() + '</b>' : '<span>' + p.trim() + '</span>';
    });
    c += '</nav>';
    top.innerHTML = c +
      '<div class="top-right">' +
        '<span class="badge live"><span class="dot"></span>Headset online</span>' +
        '<button class="btn icon sm" aria-label="Notifications">' + svg('bell') + '</button>' +
        '<span class="chip"><span class="ph solid" style="width:22px;height:22px;border-radius:50%;min-height:0;font-size:9px;color:var(--muted)">AM</span>Dr A. Mehta</span>' +
      '</div>';
  }

  // ---- planning rail ----
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var cur = parseInt(rail.getAttribute('data-step'), 10) || 1;
    var r = '<div class="rail-top">' +
      '<div class="eyebrow">Pre-operative phase</div>' +
      '<div class="t">Case 1 — Varus OA<br>Right knee</div>' +
      '<div class="row" style="margin-top:10px"><span class="badge pass">Saved</span>' +
      '<span class="badge">Training · Intermediate</span></div>' +
      '</div>';
    STEPS.forEach(function (label, i) {
      var n = i + 1;
      var cls = n < cur ? 'done' : (n === cur ? 'on' : '');
      r += '<a class="rstep ' + cls + '" href="plan-' + n + '.html">' +
        '<span class="dot">' + (n < cur ? '✓' : n) + '</span>' +
        '<span class="lab">' + label + '</span></a>';
    });
    r += '<div class="rail-foot">Forward is gated. Backward is always free. Autosave on every change.</div>';
    rail.innerHTML = r;
  }
})();
