$(document).ready(function() {
  const config = window.siwanePlayerConfig;

  $('title').text(`مشغل حلقة المسلسل - الحلقة ${config.CURRENT_EPISODE_NUMBER}`);
  $('#siwane-episode-title').text(`الحلقة ${config.CURRENT_EPISODE_NUMBER} - ${config.SERIES_SHEET_NAME}`);

  function createParticles() {
    const container = $("#siwane-particles-container");
    container.empty();

    for (let i = 0; i < 50; i++) {
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

  createParticles();

  let countdownInterval;
  let countdownValue = config.COUNTDOWN_DURATION;

  function startCountdownAndPlay(videoUrl) {
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

  function loadServersForEpisode(seriesName, episodeNum) {
    const serversGrid = $("#siwane-servers-grid"); // احصل على العنصر

    serversGrid.empty();
    // 1. **إضافة الفئة `loading-state` هنا**
    serversGrid.addClass('loading-state');
    serversGrid.html(`<p style='color: #a9d6e5; text-align: center;'>جاري تحميل سيرفرات الحلقة ${episodeNum}...</p>`);


    $.ajax({
      url: config.GAS_WEB_APP_URL + '?seriesSheetName=' + encodeURIComponent(seriesName) + '&episodeNumber=' + encodeURIComponent(episodeNum),
      type: 'GET',
      dataType: 'json',
      success: function(servers) {
        // 2. **إزالة الفئة `loading-state` هنا**
        serversGrid.removeClass('loading-state');
        // 3. **تطبيق خصائص الـ grid يدوياً في JS لضمان التحول السلس**
        serversGrid.css({
            'display': 'grid',
            'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
            'gap': '12px'
        });


        serversGrid.empty(); // مسح رسالة التحميل

        if (servers.length === 0) {
          serversGrid.html(`<p style='color: #a9d6e5; text-align: center;'>لا توجد سيرفرات متاحة للحلقة ${episodeNum}.</p>`);
          // في حالة عدم وجود سيرفرات، يمكنك اختيار إبقاء 'loading-state' أو تطبيق فئة أخرى
          // إذا أردت إبقاء توسيط رسالة "لا توجد سيرفرات"، لا تزيل الفئة.
          // serversGrid.addClass('loading-state'); // إذا أردت إبقاء التوسيط لرسالة "لا توجد"
          return;
        }

        servers.forEach(server => {
          const serverBtn = $(`
            <div class="siwane-server-btn"
                 data-server-id="${server.id}"
                 data-series-sheet-name="${seriesName}">
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
          const seriesSheetNameForDecryption = $(this).data("series-sheet-name");

          $.ajax({
            url: config.GAS_WEB_APP_URL + '?id=' + encodeURIComponent(serverId) + '&seriesSheetName=' + encodeURIComponent(seriesSheetNameForDecryption),
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
        // 4. **إزالة الفئة `loading-state` حتى في حالة الخطأ**
        serversGrid.removeClass('loading-state');
        // 5. **تطبيق خصائص الـ grid حتى في حالة الخطأ إذا لم تكن الأزرار ستبقى مركزة**
        serversGrid.css({
            'display': 'grid', // أعدها لـ grid
            'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
            'gap': '12px'
        });

        alert("فشل في تحميل قائمة السيرفرات: " + error);
        serversGrid.html("<p style='color: red; text-align: center;'>فشل في تحميل السيرفرات. يرجى المحاولة لاحقًا.</p>");
      }
    });
  }

  $("#siwane-countdown").text("");
  $("#siwane-countdown-text").text("الرجاء اختيار سيرفر للبدء");
  $("#siwane-countdown-display").show();
  $("#siwane-video-frame").hide();

  loadServersForEpisode(config.SERIES_SHEET_NAME, config.CURRENT_EPISODE_NUMBER);
});
