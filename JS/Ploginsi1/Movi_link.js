$(document).ready(function() {
  const config = window.siwanePlayerConfig;

  // Validate essential config
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_SHEET_NAME) {
      console.error("Siwane Player Config is missing essential parameters.");
      return;
  }

  // Set initial titles
  $('title').text(`جميع حلقات ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`جميع حلقات ${config.CONTENT_SHEET_NAME}`);

  // 🔥 صفحة الحلقات الرئيسية
  if (config.PAGE_TYPE === 'episodes') {
    loadAllEpisodes();
  } 
  // 🔥 صفحة المشغل العادية
  else if (config.CONTENT_TYPE === 'series' && config.EPISODE_NUMBER !== undefined) {
    initSeriesPlayer();
  } 
  // 🔥 صفحة الأفلام
  else if (config.CONTENT_TYPE === 'movie' && config.MOVIE_TITLE !== undefined) {
    initMoviePlayer();
  }
  // 🔥 مقال عادي بدون episode
  else {
    // لا تظهر أي شيء
    $('.siwane-container').hide();
    return;
  }

  // 🔥 دالة الجسيمات
  createParticles();
});

// 🔥 تحميل جميع الحلقات
function loadAllEpisodes() {
  const config = window.siwanePlayerConfig;
  const serversGrid = $("#siwane-servers-grid");

  serversGrid.empty();
  serversGrid.html('<p style="color: var(--linkC); text-align: center;">جاري تحميل الحلقات...</p>');

  // 🔥 الطلب الجديد للحصول على الحلقات
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?getAllEpisodes=true&contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME),
    type: 'GET',
    dataType: 'json',
    success: function(episodes) {
      serversGrid.empty();

      if (episodes.error) {
        serversGrid.html(`<p style="color: red; text-align: center;">${episodes.error}</p>`);
        return;
      }

      if (!Array.isArray(episodes) || episodes.length === 0) {
        serversGrid.html('<p style="color: var(--linkC); text-align: center;">لا توجد حلقات متاحة.</p>');
        return;
      }

      // 🔥 تغيير العنوان
      $('#siwane-episode-title').text(`جميع حلقات ${config.CONTENT_SHEET_NAME}`);
      $('.siwane-server-container h2').text('اختر الحلقة للعرض');

      // 🔥 تغيير الكلاس ليكون episodes-grid بدلاً من servers-grid
      serversGrid.removeClass('siwane-servers-grid').addClass('siwane-episodes-grid');

      // 🔥 إنشاء أزرار الحلقات
      episodes.forEach(episode => {
        const episodeBtn = $(`
          <div class="siwane-episode-btn" data-episode="${episode}">
            <span>الحلقة ${episode}</span>
          </div>
        `);
        serversGrid.append(episodeBtn);
      });

      // 🔥 حدث النقر على الحلقة
      $(".siwane-episode-btn").off('click').on('click', function() {
        const selectedEpisode = $(this).data('episode');
        findRandomArticle(selectedEpisode, config.CONTENT_SHEET_NAME);
      });

    },
    error: function(xhr, status, error) {
      serversGrid.html('<p style="color: red; text-align: center;">فشل في تحميل الحلقات. يرجى المحاولة لاحقًا.</p>');
    }
  });
}

// 🔥 البحث عن مقال عشوائي
function findRandomArticle(episodeNumber, sheetName) {
  const serversGrid = $("#siwane-servers-grid");
  
  serversGrid.html('<p style="color: var(--linkC); text-align: center;">🔍 جاري البحث عن مقال عشوائي...</p>');

  // البحث في المدونة عن مقالات
  $.ajax({
    url: '/',
    type: 'GET',
    success: function(html) {
      const tempDiv = $('<div>').html(html);
      const articleLinks = [];
      
      // البحث عن روابط المقالات
      tempDiv.find('a').each(function() {
        const href = $(this).attr('href');
        if (href && 
            (href.includes('/p/') || 
             href.includes('/search/label/') ||
             href.match(/\/\d{4}\/\d{2}\/.*\.html$/)) &&
            !href.includes('#') &&
            !href.includes('?episode=')) {
          articleLinks.push(href);
        }
      });

      if (articleLinks.length > 0) {
        // اختيار مقال عشوائي
        const randomIndex = Math.floor(Math.random() * articleLinks.length);
        const targetArticle = articleLinks[randomIndex];
        
        // إضافة معلمات الحلقة
        const separator = targetArticle.includes('?') ? '&' : '?';
        const finalUrl = targetArticle + separator + 'episode=' + episodeNumber + '&sheet=' + encodeURIComponent(sheetName) + '&fromEpisodes=true';
        
        window.location.href = finalUrl;
      } else {
        // إذا لم يجد مقالات
        window.location.href = '/?episode=' + episodeNumber + '&sheet=' + encodeURIComponent(sheetName) + '&fromEpisodes=true';
      }
    },
    error: function() {
      window.location.href = '/?episode=' + episodeNumber + '&sheet=' + encodeURIComponent(sheetName) + '&fromEpisodes=true';
    }
  });
}

// 🔥 المشغل العادي (للسيناريو القديم)
function initSeriesPlayer() {
  const config = window.siwanePlayerConfig;
  
  $('title').text(`الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`);
  
  loadServers();
}

// 🔥 المشغل العادي للسيرفرات (الوظيفة الأصلية)
function loadServers() {
  const config = window.siwanePlayerConfig;
  const serversGrid = $("#siwane-servers-grid");

  serversGrid.empty();
  serversGrid.addClass('loading-state');

  let loadingMessage = "";
  let ajaxUrl = config.GAS_WEB_APP_URL + '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME);

  if (config.CONTENT_TYPE === 'series') {
      loadingMessage = `<p style='color: #a9d6e5; text-align: center;'>جاري تحميل سيرفرات الحلقة ${config.EPISODE_NUMBER}...</p>`;
      ajaxUrl += '&episodeNumber=' + encodeURIComponent(config.EPISODE_NUMBER);
  } else if (config.CONTENT_TYPE === 'movie') {
      loadingMessage = `<p style='color: #a9d6e5; text-align: center;'>جاري تحميل سيرفرات الفيلم ${config.MOVIE_TITLE}...</p>`;
      ajaxUrl += '&movieTitle=' + encodeURIComponent(config.MOVIE_TITLE);
  }

  serversGrid.html(loadingMessage);

  $.ajax({
    url: ajaxUrl,
    type: 'GET',
    dataType: 'json',
    success: function(servers) {
      serversGrid.removeClass('loading-state');
      serversGrid.css({
          'display': 'grid',
          'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
          'gap': '12px'
      });

      serversGrid.empty();

      if (servers.length === 0) {
        const noServersMessage = (config.CONTENT_TYPE === 'series') ?
          `لا توجد سيرفرات متاحة للحلقة ${config.EPISODE_NUMBER}.` :
          `لا توجد سيرفرات متاحة للفيلم ${config.MOVIE_TITLE}.`;
        serversGrid.html(`<p style='color: #a9d6e5; text-align: center;'>${noServersMessage}</p>`);
        return;
      }

      servers.forEach(server => {
        const serverBtn = $(`
          <div class="siwane-server-btn"
               data-server-id="${server.id}"
               data-content-sheet-name="${config.CONTENT_SHEET_NAME}">
            <div class="siwane-server-icon">${server.icon}</div>
            <span>${server.title}</span>
          </div>
        `);
        serversGrid.append(serverBtn);
      });

      $(".siwane-server-btn[data-server-id]").off('click').on('click', function() {
        $(".siwane-server-btn[data-server-id]").removeClass("active");
        $(this).addClass("active");

        const serverId = $(this).data("server-id");
        const contentSheetNameForDecryption = $(this).data("content-sheet-name");

        $.ajax({
          url: config.GAS_WEB_APP_URL + '?id=' + encodeURIComponent(serverId) + '&contentSheetName=' + encodeURIComponent(contentSheetNameForDecryption),
          type: 'GET',
          dataType: 'json',
          success: function(response) {
            if (response.url) {
              startCountdownAndPlay(response.url);
            } else if (response.error) {
              alert("خطأ في جلب الفيديو: " + response.error);
              $("#siwane-countdown-text").text("حدث خطأ: " + response.error);
            }
          },
          error: function(xhr, status, error) {
            alert("خطأ في الاتصال بالخادم: " + error);
            $("#siwane-countdown-text").text("خطأ في الاتصال بالسيرفر.");
          }
        });
      });
    },
    error: function(xhr, status, error) {
      serversGrid.removeClass('loading-state');
      serversGrid.css({
          'display': 'grid',
          'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
          'gap': '12px'
      });

      alert("فشل في تحميل قائمة السيرفرات: " + error);
      serversGrid.html("<p style='color: red; text-align: center;'>فشل في تحميل السيرفرات. يرجى المحاولة لاحقًا.</p>");
    }
  });
}

// 🔥 دالة الأفلام
function initMoviePlayer() {
  const config = window.siwanePlayerConfig;
  
  $('title').text(`${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`);
  
  loadServers();
}

// 🔥 دالة الجسيمات (كما هي)
function createParticles() {
  const container = $("#siwane-particles-container");
  if (!container.length) return;
  
  container.empty();

  for (let i = 0; i < 100; i++) {
    const particle = $('<div class="siwane-particle"></div>');
    particle.css({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 4 + 3}s`,
      animationDelay: `${Math.random() * 2}s`,
      width: `${Math.random() * 4 + 1}px`,
      height: `${Math.random() * 4 + 1}px`,
      opacity: Math.random() * 0.5 + 0.2
    });
    container.append(particle);
  }
}

// 🔥 العد التنازلي (كما هي)
function startCountdownAndPlay(videoUrl) {
  const config = window.siwanePlayerConfig;
  let countdownInterval;
  let countdownValue = config.COUNTDOWN_DURATION;

  clearInterval(countdownInterval);
  countdownValue = config.COUNTDOWN_DURATION;
  $("#siwane-countdown").text(countdownValue);
  $("#siwane-countdown-text").text("جاري تحضير الفيديو...");
  $("#siwane-countdown-display").show();
  $("#siwane-video-frame").hide();
  createParticles();

  $('html, body').animate({
    scrollTop: $("#siwane-countdown-display").offset().top - 20
  }, 800);

  countdownInterval = setInterval(() => {
    countdownValue--;
    $("#siwane-countdown").text(countdownValue);

    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      $("#siwane-countdown-text").text("جاري تشغيل الفيديو...");

      setTimeout(() => {
        $("#siwane-video-frame").attr("src", videoUrl);
        $("#siwane-countdown-display").hide();
        $("#siwane-video-frame").show();
      }, 1000);
    }
  }, 1000);
}
