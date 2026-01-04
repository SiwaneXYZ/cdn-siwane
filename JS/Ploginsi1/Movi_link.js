$(document).ready(function() {
  const config = window.siwanePlayerConfig;

  // التحقق من الإعدادات الأساسية
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_SHEET_NAME) {
    console.error("إعدادات مشغل سيواني ناقصة");
    return;
  }

  console.log("🔧 بدء تهيئة مشغل سيواني");
  console.log("📄 نوع الصفحة:", config.PAGE_TYPE || "player");
  console.log("📋 اسم الورقة:", config.CONTENT_SHEET_NAME);

  // 🔥 صفحة الحلقات الرئيسية
  if (config.PAGE_TYPE === 'episodes') {
    console.log("🎬 صفحة الحلقات - جاري تحميل الحلقات");
    loadAllEpisodes();
    return;
  }

  // 🔥 فحص إذا جاء من صفحة الحلقات
  const urlParams = new URLSearchParams(window.location.search);
  const episodeFromUrl = urlParams.get('episode');
  const sheetFromUrl = urlParams.get('sheet');

  // 🔥 إذا كان هناك episode في URL (جاء من صفحة الحلقات)
  if (episodeFromUrl && sheetFromUrl) {
    console.log("🎬 جاء من صفحة الحلقات - الحلقة:", episodeFromUrl);
    loadPlayerForEpisode(episodeFromUrl, sheetFromUrl);
    return;
  }

  // 🔥 صفحة المسلسل العادية (السيناريو القديم)
  if (config.CONTENT_TYPE === 'series' && config.EPISODE_NUMBER !== undefined) {
    console.log("🎬 مشغل حلقة - الحلقة:", config.EPISODE_NUMBER);
    initSeriesPlayer();
    return;
  }

  // 🔥 صفحة الأفلام
  if (config.CONTENT_TYPE === 'movie' && config.MOVIE_TITLE !== undefined) {
    console.log("🎬 مشغل فيلم - العنوان:", config.MOVIE_TITLE);
    initMoviePlayer();
    return;
  }

  // 🔥 إذا كان مقال عادي بدون episode
  console.log("📄 مقال عادي - إخفاء المشغل");
  $('.siwane-container').hide();
});

// ============================================
// 🔥 صفحة الحلقات الرئيسية
// ============================================
function loadAllEpisodes() {
  const config = window.siwanePlayerConfig;
  const serversGrid = $("#siwane-servers-grid");

  // تحديث العنوان
  $('#siwane-episode-title').text(`جميع حلقات ${config.CONTENT_SHEET_NAME}`);
  $('.siwane-server-container h2').text('اختر الحلقة للعرض');

  // رسالة تحميل
  serversGrid.html('<p style="color: var(--linkC); text-align: center;">جاري تحميل الحلقات...</p>');

  // 🔥 الطلب للحصول على جميع الحلقات
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?getAllEpisodes=true&contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME),
    type: 'GET',
    dataType: 'json',
    success: function(episodes) {
      console.log("✅ تم استلام الحلقات:", episodes);

      if (episodes.error) {
        serversGrid.html(`<p style="color: red; text-align: center;">${episodes.error}</p>`);
        return;
      }

      if (!Array.isArray(episodes) || episodes.length === 0) {
        serversGrid.html('<p style="color: var(--linkC); text-align: center;">لا توجد حلقات متاحة.</p>');
        return;
      }

      // 🔥 تغيير الكلاس للـ grid
      serversGrid.removeClass('siwane-servers-grid').addClass('siwane-episodes-grid');
      serversGrid.empty();

      // 🔥 إنشاء أزرار الحلقات
      episodes.forEach(episode => {
        const episodeBtn = $(`
          <div class="siwane-episode-btn" data-episode="${episode}" data-sheet="${config.CONTENT_SHEET_NAME}">
            <span>الحلقة ${episode}</span>
          </div>
        `);
        serversGrid.append(episodeBtn);
      });

      console.log(`🎉 تم إنشاء ${episodes.length} زر حلقة`);

      // 🔥 حدث النقر على الحلقة
      $(".siwane-episode-btn").off('click').on('click', function() {
        const selectedEpisode = $(this).data('episode');
        const sheetName = $(this).data('sheet');
        console.log(`🎯 تم النقر على الحلقة ${selectedEpisode}`);
        findRandomArticle(selectedEpisode, sheetName);
      });

    },
    error: function(xhr, status, error) {
      console.error("❌ خطأ في تحميل الحلقات:", error);
      serversGrid.html('<p style="color: red; text-align: center;">فشل في تحميل الحلقات.</p>');
    }
  });
}

// ============================================
// 🔥 البحث عن مقال عشوائي
// ============================================
function findRandomArticle(episodeNumber, sheetName) {
  const serversGrid = $("#siwane-servers-grid");
  
  // عرض رسالة
  serversGrid.html('<p style="color: var(--linkC); text-align: center;">🔍 جاري البحث عن مقال عشوائي...</p>');

  // 🔥 البحث في المدونة عن مقالات
  $.ajax({
    url: '/',
    type: 'GET',
    success: function(html) {
      // استخراج روابط المقالات
      const tempDiv = $('<div>').html(html);
      const articleLinks = [];
      
      // جمع روابط المقالات
      tempDiv.find('a').each(function() {
        const href = $(this).attr('href');
        if (href && href.includes(location.hostname) && 
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
        
        // بناء الرابط النهائي
        const separator = targetArticle.includes('?') ? '&' : '?';
        const finalUrl = targetArticle + separator + 'episode=' + episodeNumber + '&sheet=' + encodeURIComponent(sheetName);
        
        console.log("📍 الانتقال إلى:", finalUrl);
        window.location.href = finalUrl;
      } else {
        // إذا لم يجد مقالات
        console.log("⚠️ لم يتم العثور على مقالات، الانتقال للصفحة الرئيسية");
        window.location.href = '/?episode=' + episodeNumber + '&sheet=' + encodeURIComponent(sheetName);
      }
    },
    error: function() {
      console.log("⚠️ خطأ في البحث، الانتقال للصفحة الرئيسية");
      window.location.href = '/?episode=' + episodeNumber + '&sheet=' + encodeURIComponent(sheetName);
    }
  });
}

// ============================================
// 🔥 تحميل المشغل في المقال العشوائي
// ============================================
function loadPlayerForEpisode(episodeNumber, sheetName) {
  const config = window.siwanePlayerConfig;
  
  console.log("🎬 تحميل مشغل للحلقة:", episodeNumber);

  // إظهار المشغل
  $('.siwane-container').show();
  
  // تحديث العنوان
  $('#siwane-episode-title').text(`الحلقة ${episodeNumber}`);
  
  // 🔥 جلب السيرفرات للحلقة
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?contentSheetName=' + encodeURIComponent(sheetName) + 
         '&episodeNumber=' + episodeNumber,
    type: 'GET',
    dataType: 'json',
    success: function(servers) {
      console.log("✅ تم استلام السيرفرات:", servers);
      
      const serversGrid = $("#siwane-servers-grid");
      serversGrid.empty();

      if (servers.error) {
        serversGrid.html(`<p style="color: red; text-align: center;">${servers.error}</p>`);
        return;
      }

      if (!Array.isArray(servers) || servers.length === 0) {
        serversGrid.html(`<p style="color: var(--linkC); text-align: center;">لا توجد سيرفرات متاحة للحلقة ${episodeNumber}.</p>`);
        return;
      }

      // 🔥 إنشاء أزرار السيرفرات
      servers.forEach(server => {
        const serverBtn = $(`
          <div class="siwane-server-btn"
               data-server-id="${server.id}"
               data-content-sheet-name="${sheetName}">
            <div class="siwane-server-icon">${server.icon || '🔗'}</div>
            <span>${server.title || 'سيرفر'}</span>
          </div>
        `);
        serversGrid.append(serverBtn);
      });

      // 🔥 حدث النقر على السيرفر
      $(".siwane-server-btn[data-server-id]").off('click').on('click', function() {
        $(".siwane-server-btn[data-server-id]").removeClass("active");
        $(this).addClass("active");

        const serverId = $(this).data("server-id");
        const contentSheetNameForDecryption = $(this).data("content-sheet-name");
        
        playVideo(serverId, contentSheetNameForDecryption);
      });

    },
    error: function(xhr, status, error) {
      console.error("❌ خطأ في تحميل السيرفرات:", error);
      $("#siwane-servers-grid").html('<p style="color: red; text-align: center;">فشل في تحميل السيرفرات.</p>');
    }
  });
  
  // إنشاء الجسيمات
  createParticles();
}

// ============================================
// 🔥 تشغيل الفيديو
// ============================================
function playVideo(serverId, sheetName) {
  const config = window.siwanePlayerConfig;
  
  // إظهار العد التنازلي
  $('#siwane-countdown-display').show();
  $('#siwane-video-frame').hide();
  
  let countdown = config.COUNTDOWN_DURATION || 15;
  $('#siwane-countdown').text(countdown);
  $('#siwane-countdown-text').text('جاري تحضير الفيديو...');
  
  console.log("🔐 جاري فك تشفير الرابط للسيرفر:", serverId);

  // 🔥 طلب فك التشفير
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?id=' + encodeURIComponent(serverId) + 
         '&contentSheetName=' + encodeURIComponent(sheetName),
    type: 'GET',
    dataType: 'json',
    success: function(response) {
      if (response.url) {
        console.log("✅ تم فك التشفير بنجاح");
        startCountdown(response.url);
      } else if (response.error) {
        console.error("❌ خطأ في فك التشفير:", response.error);
        $('#siwane-countdown-text').text('خطأ: ' + response.error);
      }
    },
    error: function(xhr, status, error) {
      console.error("❌ خطأ في الاتصال:", error);
      $('#siwane-countdown-text').text('خطأ في الاتصال');
    }
  });
}

// ============================================
// 🔥 العد التنازلي
// ============================================
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

// ============================================
// 🔥 المشغل العادي (السيناريو القديم)
// ============================================
function initSeriesPlayer() {
  const config = window.siwanePlayerConfig;
  
  // تحديث العنوان
  $('title').text(`الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`);
  
  // تحميل السيرفرات
  $.ajax({
    url: config.GAS_WEB_APP_URL + '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME) + 
         '&episodeNumber=' + config.EPISODE_NUMBER,
    type: 'GET',
    dataType: 'json',
    success: function(servers) {
      const serversGrid = $("#siwane-servers-grid");
      serversGrid.empty();

      if (servers.length === 0) {
        serversGrid.html(`<p style='color: var(--linkC); text-align: center;'>لا توجد سيرفرات متاحة للحلقة ${config.EPISODE_NUMBER}.</p>`);
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

      // حدث النقر على السيرفر
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
              startCountdown(response.url);
            } else if (response.error) {
              alert("خطأ في جلب الفيديو: " + response.error);
            }
          },
          error: function(xhr, status, error) {
            alert("خطأ في الاتصال بالخادم: " + error);
          }
        });
      });
    },
    error: function() {
      $("#siwane-servers-grid").html("<p style='color: red; text-align: center;'>فشل في تحميل السيرفرات.</p>");
    }
  });
  
  createParticles();
}

// ============================================
// 🔥 مشغل الأفلام (السيناريو القديم)
// ============================================
function initMoviePlayer() {
  const config = window.siwanePlayerConfig;
  
  $('title').text(`${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`);
  
  // نفس كود initSeriesPlayer مع تعديل بسيط
  initSeriesPlayer();
}

// ============================================
// 🔥 دالة الجسيمات
// ============================================
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
