// ========================================
// Siwane Player - النسخة الكاملة
// يدعم: صفحة الحلقات + المشغل القديم + المشغل الجديد
// ========================================

$(document).ready(function() {
  // 1. التحقق من الإعدادات
  if (!window.siwanePlayerConfig) {
    console.error('❌ إعدادات siwanePlayerConfig غير موجودة');
    return;
  }
  
  const config = window.siwanePlayerConfig;
  
  // 2. تحديد نوع الصفحة
  if (config.PAGE_TYPE === 'episodes') {
    initEpisodesPage();
  } 
  else if (config.CONTENT_TYPE === 'series' && config.EPISODE_NUMBER) {
    initSeriesPage();
  }
  else if (config.CONTENT_TYPE === 'movie' && config.MOVIE_TITLE) {
    initMoviePage();
  }
  else {
    initNormalPage();
  }
});

// ========================================
// صفحة الحلقات الرئيسية
// ========================================
function initEpisodesPage() {
  const config = window.siwanePlayerConfig;
  const grid = $("#siwane-servers-grid");
  
  // إخفاء أجزاء غير ضرورية
  $('.siwane-video-container').hide();
  
  // جلب الحلقات من GAS
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?getAllEpisodes=true&contentSheetName=' + 
         encodeURIComponent(config.CONTENT_SHEET_NAME),
    type: 'GET',
    dataType: 'json',
    success: function(episodes) {
      if (episodes.error) {
        grid.html('<p style="color:red; text-align:center">' + episodes.error + '</p>');
        return;
      }
      
      if (!Array.isArray(episodes) || episodes.length === 0) {
        grid.html('<p style="color:#666; text-align:center">لا توجد حلقات متاحة</p>');
        return;
      }
      
      // تغيير شكل الـ grid للحلقات
      grid.css({
        'display': 'grid',
        'grid-template-columns': 'repeat(auto-fill, minmax(140px, 1fr))',
        'gap': '10px',
        'padding': '15px 0'
      });
      
      // تفريغ وبناء الأزرار
      grid.empty();
      
      episodes.forEach(ep => {
        const btn = $('<div>')
          .addClass('siwane-episode-btn')
          .text('الحلقة ' + ep)
          .data('episode', ep)
          .css({
            'background': 'var(--bodyB, #2c3e50)',
            'border': '1px solid var(--linkC, #3498db)',
            'color': 'var(--bodyC, white)',
            'padding': '15px 10px',
            'border-radius': 'var(--linkR, 8px)',
            'cursor': 'pointer',
            'text-align': 'center',
            'font-weight': '500',
            'transition': 'all 0.3s'
          })
          .hover(function() {
            $(this).css({
              'background': 'var(--linkC, #3498db)',
              'transform': 'translateY(-3px)',
              'box-shadow': '0 5px 15px rgba(0,0,0,0.2)'
            });
          }, function() {
            $(this).css({
              'background': 'var(--bodyB, #2c3e50)',
              'transform': 'translateY(0)',
              'box-shadow': 'none'
            });
          });
          
        grid.append(btn);
      });
      
      // إضافة حدث النقر
      $('.siwane-episode-btn').click(function() {
        const episode = $(this).data('episode');
        redirectToRandomArticle(episode, config.CONTENT_SHEET_NAME);
      });
    },
    error: function() {
      grid.html('<p style="color:red; text-align:center">فشل في الاتصال</p>');
    }
  });
}

// ========================================
// صفحة المسلسل (القديمة)
// ========================================
function initSeriesPage() {
  const config = window.siwanePlayerConfig;
  
  // تحديث العنوان
  $('title').text(`الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`);
  
  // جلب السيرفرات
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME) + 
         '&episodeNumber=' + config.EPISODE_NUMBER,
    success: function(servers) {
      const grid = $("#siwane-servers-grid");
      grid.empty();
      
      if (!servers.length) {
        grid.html('<p style="color:#666; text-align:center">لا توجد سيرفرات</p>');
        return;
      }
      
      servers.forEach(server => {
        const btn = $('<div>')
          .addClass('siwane-server-btn')
          .html('<div class="siwane-server-icon">' + (server.icon || '🔗') + '</div>' + 
                '<span>' + (server.title || 'سيرفر') + '</span>')
          .data('id', server.id)
          .data('sheet', config.CONTENT_SHEET_NAME)
          .click(function() {
            playVideo($(this).data('id'), $(this).data('sheet'));
          });
          
        grid.append(btn);
      });
    },
    error: function() {
      $("#siwane-servers-grid").html('<p style="color:red; text-align:center">خطأ في الاتصال</p>');
    }
  });
  
  createParticles();
}

// ========================================
// صفحة الأفلام (القديمة)
// ========================================
function initMoviePage() {
  const config = window.siwanePlayerConfig;
  
  $('title').text(`${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`);
  
  // نفس كود المسلسل مع طلب مختلف
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME) + 
         '&movieTitle=' + encodeURIComponent(config.MOVIE_TITLE),
    success: function(servers) {
      const grid = $("#siwane-servers-grid");
      grid.empty();
      
      if (!servers.length) {
        grid.html('<p style="color:#666; text-align:center">لا توجد سيرفرات</p>');
        return;
      }
      
      servers.forEach(server => {
        const btn = $('<div>')
          .addClass('siwane-server-btn')
          .html('<div class="siwane-server-icon">' + (server.icon || '🔗') + '</div>' + 
                '<span>' + (server.title || 'سيرفر') + '</span>')
          .data('id', server.id)
          .data('sheet', config.CONTENT_SHEET_NAME)
          .click(function() {
            playVideo($(this).data('id'), $(this).data('sheet'));
          });
          
        grid.append(btn);
      });
    }
  });
  
  createParticles();
}

// ========================================
// صفحة عادية (مقال عشوائي مع episode)
// ========================================
function initNormalPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const episode = urlParams.get('episode');
  const sheet = urlParams.get('sheet');
  
  if (episode && sheet) {
    loadEpisodePlayer(episode, sheet);
  } else {
    $('.siwane-container').hide();
  }
}

// ========================================
// تحميل مشغل في مقال عشوائي
// ========================================
function loadEpisodePlayer(episode, sheet) {
  const config = window.siwanePlayerConfig;
  
  // إظهار المشغل
  $('.siwane-container').show();
  $('#siwane-episode-title').text(`الحلقة ${episode}`);
  
  // جلب السيرفرات
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?contentSheetName=' + encodeURIComponent(sheet) + 
         '&episodeNumber=' + episode,
    success: function(servers) {
      const grid = $("#siwane-servers-grid");
      grid.empty();
      
      if (!servers.length) {
        grid.html('<p style="color:#666; text-align:center">لا توجد سيرفرات للحلقة ' + episode + '</p>');
        return;
      }
      
      servers.forEach(server => {
        const btn = $('<div>')
          .addClass('siwane-server-btn')
          .html('<div class="siwane-server-icon">' + (server.icon || '🔗') + '</div>' + 
                '<span>' + (server.title || 'سيرفر') + '</span>')
          .data('id', server.id)
          .data('sheet', sheet)
          .click(function() {
            playVideo($(this).data('id'), $(this).data('sheet'));
          });
          
        grid.append(btn);
      });
    }
  });
  
  createParticles();
}

// ========================================
// وظائف مساعدة
// ========================================
function redirectToRandomArticle(episode, sheet) {
  const grid = $("#siwane-servers-grid");
  grid.html('<p style="color:#3498db; text-align:center">جاري البحث عن مقال...</p>');
  
  // بحث مبسط
  setTimeout(() => {
    window.location.href = '/?episode=' + episode + '&sheet=' + encodeURIComponent(sheet);
  }, 1000);
}

function playVideo(serverId, sheetName) {
  const config = window.siwanePlayerConfig;
  
  // إظهار العد التنازلي
  $('#siwane-countdown-display').show();
  $('#siwane-video-frame').hide();
  
  let countdown = config.COUNTDOWN_DURATION || 15;
  $('#siwane-countdown').text(countdown);
  $('#siwane-countdown-text').text('جاري تحضير الفيديو...');
  
  // فك التشفير
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?id=' + encodeURIComponent(serverId) + 
         '&contentSheetName=' + encodeURIComponent(sheetName),
    success: function(response) {
      if (response.url) {
        const timer = setInterval(() => {
          countdown--;
          $('#siwane-countdown').text(countdown);
          
          if (countdown <= 0) {
            clearInterval(timer);
            $('#siwane-countdown-display').hide();
            $('#siwane-video-frame').attr('src', response.url).show();
          }
        }, 1000);
      } else if (response.error) {
        $('#siwane-countdown-text').text('خطأ: ' + response.error);
      }
    },
    error: function() {
      $('#siwane-countdown-text').text('خطأ في الاتصال');
    }
  });
}

function createParticles() {
  const container = $("#siwane-particles-container");
  if (!container.length) return;
  
  container.empty();
  
  for (let i = 0; i < 80; i++) {
    const particle = $('<div class="siwane-particle"></div>');
    particle.css({
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      animationDuration: (Math.random() * 3 + 2) + 's',
      animationDelay: Math.random() + 's',
      opacity: Math.random() * 0.3 + 0.1
    });
    container.append(particle);
  }
}
