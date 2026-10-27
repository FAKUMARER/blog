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

  // 移动端菜单
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

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

  // 点击导航后收起移动端菜单
  if (navLinks) {
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    });
  }
})();
