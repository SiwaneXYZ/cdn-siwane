$(document).ready(function() {
  // 🔹 استخراج المعلومات من URL
  const urlParams = new URLSearchParams(window.location.search);
  const episode = urlParams.get('episode');
  const sheetName = urlParams.get('sheet');
  const fromEpisodes = urlParams.get('from') === 'episodes';
  
  // 🔹 الحصول على الإعدادات
  const config = window.siwanePlayerConfig || {};
  
  // 🔹 السيناريو 1: إذا كان في مقال الحلقات الرئيسي
  if (fromEpisodes && config.PAGE_TYPE === 'episodes') {
    loadEpisodesPage();
    return;
  }
  
  // 🔹 السيناريو 2: إذا جاء من مقال الحلقات إلى مقال عشوائي
  if (episode && sheetName) {
    loadPlayerForEpisode(episode, sheetName);
    return;
  }
  
  // 🔹 السيناريو 3: إذا كان في مقال عادي بدون episode
  hidePlayerCompletely();
});

// 🔹 صفحة الحلقات الرئيسية
function loadEpisodesPage() {
  const config = window.siwanePlayerConfig;
  
  // إخفاء أجزاء المشغل
  $('.siwane-server-container, .siwane-video-container').hide();
  
  // جلب الحلقات من Google Sheet
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?getAllEpisodes=true&contentSheetName=' + 
          encodeURIComponent(config.CONTENT_SHEET_NAME),
    success: function(episodes) {
      if (episodes.error) {
        showError(episodes.error);
        return;
      }
      
      // إنشاء أزرار الحلقات
      const container = $('<div class="siwane-episodes-grid"></div>');
      
      episodes.forEach(ep => {
        const btn = $(`
          <div class="siwane-episode-btn" 
               data-episode="${ep}" 
               data-sheet="${config.CONTENT_SHEET_NAME}">
            الحلقة ${ep}
          </div>
        `);
        container.append(btn);
      });
      
      // استبدال محتوى الحلقات
      $('.siwane-server-container').before(container);
      
      // حدث النقر على الحلقة
      $('.siwane-episode-btn').click(function() {
        const episode = $(this).data('episode');
        const sheet = $(this).data('sheet');
        redirectToRandomArticle(episode, sheet);
      });
    },
    error: function() {
      showError('فشل في تحميل الحلقات');
    }
  });
}

// 🔹 توجيه إلى مقال عشوائي
function redirectToRandomArticle(episode, sheetName) {
  // حفظ المعلومات في sessionStorage
  sessionStorage.setItem('siwane_episode', episode);
  sessionStorage.setItem('siwane_sheet', sheetName);
  sessionStorage.setItem('siwane_from', 'episodes');
  
  // البحث عن مقالات المدونة
  $.ajax({
    url: '/',
    success: function(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // جمع روابط المقالات
      const articles = [];
      const selectors = [
        'a[href*="/p/"]',
        'a[href*="/search/label/"]',
        'a.post-title',
        '.post-title a',
        'article h2 a',
        '.entry-title a'
      ];
      
      selectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(link => {
          const href = link.href;
          if (href && href.includes(location.hostname) && !href.includes('#')) {
            articles.push(href);
          }
        });
      });
      
      // اختيار مقال عشوائي
      if (articles.length > 0) {
        const randomArticle = articles[Math.floor(Math.random() * articles.length)];
        const finalUrl = randomArticle + 
                        (randomArticle.includes('?') ? '&' : '?') +
                        `episode=${episode}&sheet=${encodeURIComponent(sheetName)}&from=episodes`;
        
        location.href = finalUrl;
      } else {
        // إذا لم يجد مقالات، يذهب للصفحة الرئيسية
        location.href = '/?episode=' + episode + '&sheet=' + encodeURIComponent(sheetName) + '&from=episodes';
      }
    },
    error: function() {
      // حل احتياطي
      location.href = '/?episode=' + episode + '&sheet=' + encodeURIComponent(sheetName) + '&from=episodes';
    }
  });
}

// 🔹 تحميل المشغل في المقال العشوائي
function loadPlayerForEpisode(episode, sheetName) {
  const config = window.siwanePlayerConfig;
  
  // إظهار المشغل
  $('.siwane-container').show();
  
  // تحديث العنوان
  $('#siwane-episode-title').text(`الحلقة ${episode}`);
  
  // جلب السيرفرات
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?contentSheetName=' + encodeURIComponent(sheetName) + 
         '&episodeNumber=' + episode,
    success: function(servers) {
      if (servers.error) {
        $('#siwane-servers-grid').html(`<p style="color:red">${servers.error}</p>`);
        return;
      }
      
      const grid = $('#siwane-servers-grid');
      grid.empty();
      
      servers.forEach(server => {
        const btn = $(`
          <div class="siwane-server-btn" 
               data-id="${server.id}" 
               data-sheet="${sheetName}">
            <div class="siwane-server-icon">${server.icon}</div>
            <span>${server.title}</span>
          </div>
        `);
        grid.append(btn);
      });
      
      // حدث النقر على السيرفر
      $('.siwane-server-btn').click(function() {
        const serverId = $(this).data('id');
        const sheet = $(this).data('sheet');
        playVideo(serverId, sheet);
      });
    },
    error: function() {
      $('#siwane-servers-grid').html('<p style="color:red">فشل في تحميل السيرفرات</p>');
    }
  });
  
  // إنشاء الجسيمات
  createParticles();
}

// 🔹 تشغيل الفيديو
function playVideo(serverId, sheetName) {
  const config = window.siwanePlayerConfig;
  
  // إظهار العد التنازلي
  $('#siwane-countdown-display').show();
  $('#siwane-video-frame').hide();
  
  let countdown = config.COUNTDOWN_DURATION || 15;
  $('#siwane-countdown').text(countdown);
  $('#siwane-countdown-text').text('جاري تحضير الفيديو...');
  
  // طلب فك التشفير
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?id=' + serverId + '&contentSheetName=' + encodeURIComponent(sheetName),
    success: function(response) {
      if (response.url) {
        startCountdown(response.url);
      } else {
        $('#siwane-countdown-text').text('خطأ: ' + (response.error || 'رابط غير متوفر'));
      }
    },
    error: function() {
      $('#siwane-countdown-text').text('خطأ في الاتصال');
    }
  });
}

// 🔹 العد التنازلي
function startCountdown(videoUrl) {
  const config = window.siwanePlayerConfig;
  let countdown = config.COUNTDOWN_DURATION || 15;
  
  const timer = setInterval(() => {
    countdown--;
    $('#siwane-countdown').text(countdown);
    
    if (countdown <= 0) {
      clearInterval(timer);
      $('#siwane-countdown-display').hide();
      $('#siwane-video-frame').attr('src', videoUrl).show();
    }
  }, 1000);
}

// 🔹 إنشاء الجسيمات
function createParticles() {
  const container = $("#siwane-particles-container");
  if (!container.length) return;
  
  container.empty();
  
  for (let i = 0; i < 80; i++) {
    const particle = $('<div class="siwane-particle"></div>');
    particle.css({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random()}s`,
      opacity: Math.random() * 0.3 + 0.1
    });
    container.append(particle);
  }
}

// 🔹 إخفاء المشغل
function hidePlayerCompletely() {
  $('.siwane-container').hide();
}

// 🔹 عرض خطأ
function showError(message) {
  $('.siwane-container').html(`<div style="color:red; text-align:center; padding:20px;">${message}</div>`);
}
