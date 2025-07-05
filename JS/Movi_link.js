$(document).ready(function() {
  const config = window.siwanePlayerConfig;

  // Validate essential config
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_TYPE || !config.CONTENT_SHEET_NAME) {
      console.error("Siwane Player Config is missing essential parameters.");
      // Display a user-friendly error message on the page
      $("#siwane-countdown-text").text("خطأ في إعدادات المشغل. يرجى التحقق من التهيئة.");
      $("#siwane-countdown-display").show();
      $("#siwane-video-frame").hide();
      return; // Stop execution
  }

  // Set initial titles and display based on content type
  let pageTitle = '';
  let displayTitle = '';

  if (config.CONTENT_TYPE === 'series') {
      if (config.EPISODE_NUMBER === undefined) {
          console.error("Siwane Player Config is missing EPISODE_NUMBER for series.");
          $("#siwane-countdown-text").text("خطأ في إعدادات المسلسل. رقم الحلقة مفقود.");
          $("#siwane-countdown-display").show();
          $("#siwane-video-frame").hide();
          return;
      }
      pageTitle = `مشغل حلقة المسلسل - الحلقة ${config.EPISODE_NUMBER}`;
      displayTitle = `الحلقة ${config.EPISODE_NUMBER} - ${config.CONTENT_SHEET_NAME}`;
  } else if (config.CONTENT_TYPE === 'movie') {
      if (config.MOVIE_TITLE === undefined) {
          console.error("Siwane Player Config is missing MOVIE_TITLE for movie.");
          $("#siwane-countdown-text").text("خطأ في إعدادات الفيلم. عنوان الفيلم مفقود.");
          $("#siwane-countdown-display").show();
          $("#siwane-video-frame").hide();
          return;
      }
      pageTitle = `مشغل الفيلم - ${config.MOVIE_TITLE}`;
      displayTitle = `${config.MOVIE_TITLE} - ${config.CONTENT_SHEET_NAME}`;
  } else {
      console.error("Invalid CONTENT_TYPE in Siwane Player Config.");
      $("#siwane-countdown-text").text("نوع المحتوى غير صالح في الإعدادات.");
      $("#siwane-countdown-display").show();
      $("#siwane-video-frame").hide();
      return;
  }

  $('title').text(pageTitle);
  $('#siwane-episode-title').text(displayTitle); // تم تغيير ID ليكون أكثر عمومية

  function createParticles() {
    const container = $("#siwane-particles-container");
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
    createParticles(); // تستدعى هنا لإنشاء جسيمات جديدة في كل مرة

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

  function loadServers() { // تم تغيير اسم الدالة لتكون أكثر عمومية
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

        serversGrid.empty(); // مسح رسالة التحميل

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
          const contentSheetNameForDecryption = $(this).data("content-sheet-name"); // استخدام contentSheetName

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

  // Initial display before loading servers
  let initialCountdownText = "";
  if (config.CONTENT_TYPE === 'series') {
      initialCountdownText = `الرجاء اختيار سيرفر للحلقة ${config.EPISODE_NUMBER}`;
  } else if (config.CONTENT_TYPE === 'movie') {
      initialCountdownText = `الرجاء اختيار سيرفر للفيلم ${config.MOVIE_TITLE}`;
  } else {
      initialCountdownText = "الرجاء اختيار سيرفر للبدء";
  }

  $("#siwane-countdown").text("");
  $("#siwane-countdown-text").text(initialCountdownText);
  $("#siwane-countdown-display").show();
  $("#siwane-video-frame").hide();

  // Load servers based on detected content type
  loadServers();
});
