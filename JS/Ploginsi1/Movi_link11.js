$(document).ready(function() {
  // جلب الإعدادات من الكائن العالمي ومن إعدادات الصفحة
  const globalConfig = window.siwaneGlobalConfig || {};
  const config = window.siwanePlayerConfig;

  // التحقق من روابط الإعلانات
  const adLinks = globalConfig.AD_LINKS || { ad1: '#', ad2: '#', ad3: '#' };
  let adsClickedStatus = { ad1: false, ad2: false, ad3: false };

  // التحقق من الإعدادات الأساسية
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_TYPE || !config.CONTENT_SHEET_NAME) {
      console.error("Siwane Player: Missing config.");
      $("#siwane-countdown-text").text("خطأ في الإعدادات. يرجى التحقق.");
      return;
  }

  // إعداد العناوين
  let displayTitle = (config.CONTENT_TYPE === 'series') 
      ? `الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`
      : `${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`;
  
  $('#siwane-episode-title').text(displayTitle);

  function createParticles() {
    const container = $("#siwane-particles-container");
    container.empty();
    for (let i = 0; i < 60; i++) {
      const particle = $('<div class="siwane-particle"></div>');
      particle.css({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 4 + 3}s`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        opacity: Math.random() * 0.5 + 0.2
      });
      container.append(particle);
    }
  }

  // --- وظيفة حقن أزرار الإعلانات (Ad-Gate) ---
  function showAdGate(videoUrl) {
    adsClickedStatus = { ad1: false, ad2: false, ad3: false };
    $("#siwane-countdown").fadeOut(); // إخفاء رقم العداد بعد انتهائه
    
    const gateHTML = `
      <div class="siwane-ad-gate">
        <div style="color: var(--linkC); font-size: 0.95rem; margin-bottom: 12px; font-weight: 600;">
          ⚠️ يرجى النقر على الإعلانات الـ 3 لتشغيل الفيديو
        </div>
        <div class="ad-btns-wrapper">
          <button class="siwane-ad-btn ad-red" data-ad="ad1">إعلان 1</button>
          <button class="siwane-ad-btn ad-blue" data-ad="ad2">إعلان 2</button>
          <button class="siwane-ad-btn ad-orange" data-ad="ad3">إعلان 3</button>
        </div>
        <div id="unlock-area" style="display:none; margin-top: 15px;">
           <button class="final-play-btn">▶ تشغيل الفيديو الآن</button>
        </div>
      </div>
    `;

    $("#siwane-countdown-text").html(gateHTML);

    $(".siwane-ad-btn").on('click', function() {
        const adId = $(this).data('ad');
        const link = adLinks[adId];
        
        window.open(link, '_blank');
        
        // تأثير البخوت (Fading) بعد النقر
        $(this).addClass('is-clicked');
        adsClickedStatus[adId] = true;

        // التحقق من اكتمال النقرات الثلاث
        if (adsClickedStatus.ad1 && adsClickedStatus.ad2 && adsClickedStatus.ad3) {
            $("#unlock-area").fadeIn(500);
        }
    });

    $(".final-play-btn").on('click', function() {
        $("#siwane-countdown-text").text("جاري تحميل المشغل...");
        setTimeout(() => {
          $("#siwane-video-frame").attr("src", videoUrl);
          $("#siwane-countdown-display").hide();
          $("#siwane-video-frame").show();
        }, 1000);
    });
  }

  let countdownInterval;
  
  function startCountdownAndPlay(videoUrl) {
    clearInterval(countdownInterval);
    // جلب مدة العداد من الإعدادات العالمية
    let countdownValue = globalConfig.COUNTDOWN || 15;
    
    $("#siwane-countdown").text(countdownValue).show();
    $("#siwane-countdown-text").text("جاري تجهيز رابط الفيديو...");
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
        showAdGate(videoUrl); // استدعاء مرحلة الإعلانات بدلاً من التشغيل المباشر
      }
    }, 1000);
  }

  // --- دالة تحميل السيرفرات ---
  function loadServers() {
    const serversGrid = $("#siwane-servers-grid");
    serversGrid.empty().addClass('loading-state').html("<p>جاري تحميل قائمة السيرفرات...</p>");

    let ajaxUrl = globalConfig.GAS_URL + '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME);
    if (config.CONTENT_TYPE === 'series') ajaxUrl += '&episodeNumber=' + encodeURIComponent(config.EPISODE_NUMBER);
    else if (config.CONTENT_TYPE === 'movie') ajaxUrl += '&movieTitle=' + encodeURIComponent(config.MOVIE_TITLE);

    $.ajax({
      url: ajaxUrl,
      type: 'GET',
      dataType: 'json',
      success: function(servers) {
        serversGrid.removeClass('loading-state').empty();
        if (servers.length === 0) {
            serversGrid.html("<p>لا توجد سيرفرات متاحة.</p>");
            return;
        }

        servers.forEach(server => {
          const serverBtn = $(`
            <div class="siwane-server-btn" data-server-id="${server.id}">
              <div class="siwane-server-icon">${server.icon}</div>
              <span>${server.title}</span>
            </div>
          `);
          serversGrid.append(serverBtn);
        });

        $(".siwane-server-btn").on('click', function() {
          $(".siwane-server-btn").removeClass("active");
          $(this).addClass("active");
          
          const serverId = $(this).data("server-id");
          $.ajax({
            url: globalConfig.GAS_URL + '?id=' + encodeURIComponent(serverId) + '&contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME),
            type: 'GET',
            success: function(response) {
              if (response.url) startCountdownAndPlay(response.url);
            }
          });
        });
      }
    });
  }

  loadServers();
});
