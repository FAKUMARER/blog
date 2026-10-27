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
})();
