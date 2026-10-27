(function () {
  'use strict';

  // 滚动后导航栏由透明变实底
  var navbar = document.getElementById('navbar');
  if (navbar) {
    var onScroll = function () {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // MENU：桌面收起/展开侧栏，移动端滑出抽屉
  var menuBtn = document.getElementById('menuBtn');
  var sidebarMask = document.getElementById('sidebarMask');
  function toggleSidebar() {
    if (window.innerWidth <= 960) {
      document.body.classList.toggle('sidebar-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
  }
  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
  }
  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
  if (sidebarMask) sidebarMask.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });

  // 深色模式
  var themeBtn = document.getElementById('themeBtn');
  var STORAGE_KEY = 'cnblog-theme';

  function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    if (themeBtn) themeBtn.textContent = dark ? '☀' : '☾';
  }

  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') applyTheme(true);
  else if (saved === 'light') applyTheme(false);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme(true);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = !document.body.classList.contains('dark');
      applyTheme(dark);
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
  }

  // 目录滚动高亮
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-wrap .toc-link'));
  if (tocLinks.length) {
    var headingMap = {};
    tocLinks.forEach(function (link) {
      var id = decodeURIComponent((link.getAttribute('href') || '').replace(/^#/, ''));
      var el = document.getElementById(id);
      if (el) headingMap[id] = link;
    });

    var current = null;
    function updateActive() {
      var passed = null;
      Object.keys(headingMap).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) passed = id;
      });
      var next = passed ? headingMap[passed] : null;
      if (next === current) return;
      if (current) current.classList.remove('active');
      if (next) {
        next.classList.add('active');
        // 让高亮项在目录里保持可见
        var wrap = next.closest('.toc-wrap');
        if (wrap) {
          var top = next.offsetTop - wrap.clientHeight / 2;
          if (Math.abs(wrap.scrollTop - top) > wrap.clientHeight / 2) wrap.scrollTop = Math.max(0, top);
        }
      }
      current = next;
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    // 点击平滑滚动，抵消固定导航栏的高度
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = decodeURIComponent((link.getAttribute('href') || '').replace(/^#/, ''));
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      });
    });
  }
})();
