$(document).ready(function() {
  const config = window.siwanePlayerConfig;

  // التحقق من الإعدادات
  if (!config || !config.GAS_WEB_APP_URL) {
      console.error("Missing config!");
      return;
  }

  // العناوين ونظام الجسيمات الأصلي
  $('#siwane-episode-title').text(`${config.MOVIE_TITLE} - قائمة الحلقات`);
  
  function createParticles() {
    const container = $("#siwane-particles-container");
    container.empty();
    for (let i = 0; i < 80; i++) {
      const p = $('<div class="siwane-particle"></div>');
      p.css({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 4 + 3}s`,
        animationDelay: `${Math.random() * 2}s`
      });
      container.append(p);
    }
  }
  createParticles();

  // 1. تحميل الحلقات ديناميكياً من GAS
  function loadEpisodes() {
    const grid = $("#siwane-servers-grid");
    grid.html("<p style='text-align:center; color:#a9d6e5;'>جاري جلب الحلقات من تيرابوكس...</p>");

    const apiUrl = `${config.GAS_WEB_APP_URL}?action=getEpisodes&contentSheetName=${encodeURIComponent(config.CONTENT_SHEET_NAME)}&movieTitle=${encodeURIComponent(config.MOVIE_TITLE)}`;

    $.getJSON(apiUrl, function(data) {
      grid.empty();
      if (data.error) {
        grid.html(`<p style='color:red; text-align:center;'>خطأ: ${data.error}</p>`);
        return;
      }
      if (data.length === 0) {
        grid.html("<p style='text-align:center;'>المجلد فارغ أو الرابط غير صحيح.</p>");
        return;
      }

      data.forEach((ep, index) => {
        const btn = $(`
          <div class="siwane-server-btn" 
               data-fsid="${ep.fs_id}" 
               data-shareid="${ep.shareid}" 
               data-uk="${ep.uk}" 
               data-surl="${ep.surl}">
            <div class="siwane-server-icon">🎬</div>
            <span>${ep.name}</span>
          </div>`);
        grid.append(btn);
      });

      // تشغيل العد التنازلي عند اختيار حلقة
      $(".siwane-server-btn").on('click', function() {
        $(".siwane-server-btn").removeClass("active");
        $(this).addClass("active");
        
        const params = {
          fs_id: $(this).data("fsid"),
          shareid: $(this).data("shareid"),
          uk: $(this).data("uk"),
          surl: $(this).data("surl")
        };

        startCountdown(params);
      });
    });
  }

  // 2. وظيفة العد التنازلي والتشغيل
  function startCountdown(params) {
    let count = config.COUNTDOWN_DURATION;
    $("#siwane-countdown").text(count);
    $("#siwane-countdown-text").text("جاري استخراج رابط البث المباشر...");
    $("#siwane-countdown-display").show();
    $("#siwane-video-frame").hide();
    $("#siwane-v-container").remove(); // تنظيف أي مشغل قديم

    const timer = setInterval(() => {
      count--;
      $("#siwane-countdown").text(count);

      if (count <= 0) {
        clearInterval(timer);
        
        const streamUrlApi = `${config.GAS_WEB_APP_URL}?action=getStream&fs_id=${params.fs_id}&shareid=${params.shareid}&uk=${params.uk}&surl=${params.surl}`;
        
        $.getJSON(streamUrlApi, function(res) {
          if (res.url) {
            $("#siwane-countdown-display").hide();
            
            // إنشاء مشغل فيديو يدعم HLS بجودة عالية
            const playerHtml = `
              <div id="siwane-v-container" style="width:100%; height:450px; background:#000; border-radius:8px; overflow:hidden; position:relative;">
                <video id="siwane-video-player" controls autoplay style="width:100%; height:100%;"></video>
              </div>`;
            $("#siwane-video-frame").after(playerHtml).hide();

            // استخدام مكتبة Hls.js للتشغيل
            const video = document.getElementById('siwane-video-player');
            if (Hls.isSupported()) {
              const hls = new Hls();
              hls.loadSource(res.url);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = res.url;
            }
          } else {
            $("#siwane-countdown-text").text("خطأ في جلب رابط البث.");
          }
        });
      }
    }, 1000);
  }

  loadEpisodes();
});
