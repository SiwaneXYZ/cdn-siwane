$(document).ready(function() {
  const config = window.siwanePlayerConfig;
  const urlParams = new URLSearchParams(window.location.search);
  const episodeFromUrl = urlParams.get('episode');

  // الوضع 1: صفحة الحلقات الرئيسية
  if (config.CONTENT_TYPE === 'series' && !episodeFromUrl) {
    initEpisodesPage();
  }
  // الوضع 2: مقال عشوائي مع مشغل
  else if (episodeFromUrl) {
    initPlayerPage(episodeFromUrl);
  }
});

// تهيئة صفحة الحلقات
function initEpisodesPage() {
  const config = window.siwanePlayerConfig;

  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_SHEET_NAME) {
    console.error("Siwane Player Config is missing essential parameters.");
    return;
  }

  $('title').text(`جميع حلقات ${config.CONTENT_SHEET_NAME}`);
  $('#siwane-episode-title').text(`جميع حلقات ${config.CONTENT_SHEET_NAME}`);

  $('.siwane-server-container').hide();
  $('.siwane-video-container').hide();
  $('#siwane-countdown-display').hide();

  loadAllEpisodes();
}

// تهيئة صفحة المشغل في المقال العشوائي
function initPlayerPage(episodeNumber) {
  const config = window.siwanePlayerConfig;
  
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_SHEET_NAME) {
    console.error("Siwane Player Config is missing essential parameters.");
    return;
  }

  $('title').text(`${config.CONTENT_SHEET_NAME} - الحلقة ${episodeNumber}`);
  $('#siwane-episode-title').text(`${config.CONTENT_SHEET_NAME} - الحلقة ${episodeNumber}`);

  $('.siwane-episodes-container').hide();
  $('.siwane-server-container').show();
  $('.siwane-video-container').show();

  $('#siwane-countdown-text').text(`الرجاء اختيار سيرفر للحلقة ${episodeNumber}`);
  loadServersForEpisode(episodeNumber);
  createParticles();
}

// تحميل جميع الحلقات
function loadAllEpisodes() {
  const config = window.siwanePlayerConfig;
  
  if (!$("#siwane-episodes-container").length) {
    $('.siwane-header').after(`
      <div class="siwane-episodes-container">
        <h2>اختر الحلقة للعرض</h2>
        <div class="siwane-episodes-grid" id="siwane-episodes-grid">
          <p style="color: var(--linkC); text-align: center;">جاري تحميل الحلقات...</p>
        </div>
      </div>
    `);
  }

  const episodesGrid = $("#siwane-episodes-grid");
  episodesGrid.html('<p style="color: #a9d6e5; text-align: center;">جاري تحميل الحلقات...</p>');

  $.ajax({
    url: config.GAS_WEB_APP_URL + '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME),
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      episodesGrid.empty();
      
      if (data.error) {
        episodesGrid.html(`<p style="color: red; text-align: center;">${data.error}</p>`);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        episodesGrid.html('<p style="color: #a9d6e5; text-align: center;">لا توجد حلقات متاحة.</p>');
        return;
      }

      const uniqueEpisodes = {};
      data.forEach(row => {
        if (row && row.length > 1 && row[1]) {
          const episodeNum = parseInt(row[1]);
          if (!isNaN(episodeNum) && !uniqueEpisodes[episodeNum]) {
            uniqueEpisodes[episodeNum] = true;
          }
        }
      });

      const sortedEpisodes = Object.keys(uniqueEpisodes)
        .map(Number)
        .sort((a, b) => a - b);

      sortedEpisodes.forEach(episode => {
        const episodeBtn = $(`
          <div class="siwane-episode-btn" data-episode="${episode}">
            <span>الحلقة ${episode}</span>
          </div>
        `);
        episodesGrid.append(episodeBtn);
      });

      $(".siwane-episode-btn").off('click').on('click', function() {
        const selectedEpisode = $(this).data('episode');
        findRandomArticle(selectedEpisode);
      });

    },
    error: function(xhr, status, error) {
      episodesGrid.html('<p style="color: red; text-align: center;">فشل في تحميل الحلقات. يرجى المحاولة لاحقًا.</p>');
    }
  });
}

// البحث عن مقال عشوائي في المدونة
function findRandomArticle(episodeNumber) {
  // رسالة تحميل
  showLoadingMessage();
  
  // استراتيجيات للعثور على مقالات عشوائية:
  
  // 1. البحث في sitemap
  fetchRandomArticleFromSitemap(episodeNumber);
  
  // 2. أو استخدام Blogger API إذا متاح
  // fetchRandomArticleFromBloggerAPI(episodeNumber);
  
  // 3. أو البحث في أرشيف المدونة
  // fetchRandomArticleFromArchive(episodeNumber);
  
  // 4. أو استخدام قائمة المقالات الموجودة في الصفحة الرئيسية
  fetchRandomArticleFromHomepage(episodeNumber);
}

// استراتيجية 1: البحث في sitemap
function fetchRandomArticleFromSitemap(episodeNumber) {
  const sitemapUrls = [
    '/sitemap.xml',
    '/feeds/posts/default?max-results=0&alt=json-in-script',
    '/atom.xml',
    '/rss.xml'
  ];
  
  // محاولة كل sitemap حتى ينجح أحدها
  trySitemapUrls(sitemapUrls, 0, episodeNumber);
}

function trySitemapUrls(urls, index, episodeNumber) {
  if (index >= urls.length) {
    // إذا فشلت جميع المحاولات، استخدم المقالات الافتراضية
    useFallbackArticles(episodeNumber);
    return;
  }
  
  const sitemapUrl = urls[index];
  
  $.ajax({
    url: sitemapUrl,
    type: 'GET',
    dataType: 'xml',
    success: function(xml) {
      const articles = parseSitemapArticles(xml);
      if (articles.length > 0) {
        const randomArticle = getRandomArticleExcludingCurrent(articles);
        redirectToArticle(randomArticle, episodeNumber);
      } else {
        trySitemapUrls(urls, index + 1, episodeNumber);
      }
    },
    error: function() {
      trySitemapUrls(urls, index + 1, episodeNumber);
    }
  });
}

// استراتيجية 4: البحث في الصفحة الرئيسية
function fetchRandomArticleFromHomepage(episodeNumber) {
  // تحميل الصفحة الرئيسية
  $.ajax({
    url: '/',
    type: 'GET',
    success: function(html) {
      const articles = extractArticlesFromHomepage(html);
      if (articles.length > 0) {
        const randomArticle = getRandomArticleExcludingCurrent(articles);
        redirectToArticle(randomArticle, episodeNumber);
      } else {
        useFallbackArticles(episodeNumber);
      }
    },
    error: function() {
      useFallbackArticles(episodeNumber);
    }
  });
}

// استخراج المقالات من HTML
function extractArticlesFromHomepage(html) {
  const articles = [];
  const $html = $(html);
  
  // البحث عن روابط المقالات (تعديل حسب قالب بلوجر)
  $html.find('a').each(function() {
    const href = $(this).attr('href');
    if (href && href.match(/\/\d{4}\/\d{2}\/.*\.html$/)) {
      if (!articles.includes(href)) {
        articles.push(href);
      }
    }
  });
  
  // إذا لم نجد، نبحث عن روابط تحتوي على /p/
  if (articles.length === 0) {
    $html.find('a[href*="/p/"]').each(function() {
      const href = $(this).attr('href');
      if (href && !articles.includes(href)) {
        articles.push(href);
      }
    });
  }
  
  return articles;
}

// الحل الاحتياطي: مقالات افتراضية
function useFallbackArticles(episodeNumber) {
  // استخدام أرشيف المدونة كحل بديل
  const currentYear = new Date().getFullYear();
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  
  // اختيار سنة وشهر عشوائي
  const randomYear = Math.floor(Math.random() * 3) + (currentYear - 2);
  const randomMonth = months[Math.floor(Math.random() * months.length)];
  
  // رابط أرشيف المدونة
  const archiveUrl = `/${randomYear}/${randomMonth}/`;
  
  // تحميل الأرشيف
  $.ajax({
    url: archiveUrl,
    type: 'GET',
    success: function(html) {
      const articles = extractArticlesFromArchive(html);
      if (articles.length > 0) {
        const randomArticle = articles[Math.floor(Math.random() * articles.length)];
        redirectToArticle(randomArticle, episodeNumber);
      } else {
        // آخر حل: توجيه إلى الصفحة الرئيسية
        redirectToArticle('/', episodeNumber);
      }
    },
    error: function() {
      redirectToArticle('/', episodeNumber);
    }
  });
}

// استخراج المقالات من الأرشيف
function extractArticlesFromArchive(html) {
  const articles = [];
  const $html = $(html);
  
  $html.find('a').each(function() {
    const href = $(this).attr('href');
    if (href && href.match(/\/\d{4}\/\d{2}\/.*\.html$/)) {
      if (!articles.includes(href)) {
        articles.push(href);
      }
    }
  });
  
  return articles;
}

// اختيار مقال عشوائي باستثناء المقال الحالي
function getRandomArticleExcludingCurrent(articles) {
  const currentPath = window.location.pathname;
  const filteredArticles = articles.filter(article => 
    article !== currentPath && 
    !article.includes('/search/label/') &&
    !article.includes('?')
  );
  
  if (filteredArticles.length === 0) {
    return articles[Math.floor(Math.random() * articles.length)];
  }
  
  return filteredArticles[Math.floor(Math.random() * filteredArticles.length)];
}

// توجيه إلى المقال مع إضافة معامل الحلقة
function redirectToArticle(articleUrl, episodeNumber) {
  let finalUrl = articleUrl;
  
  // التأكد من أن الرابط كامل
  if (!articleUrl.startsWith('http')) {
    finalUrl = window.location.origin + articleUrl;
  }
  
  // إضافة معامل الحلقة
  const separator = finalUrl.includes('?') ? '&' : '?';
  finalUrl += `${separator}episode=${episodeNumber}`;
  
  // التوجيه
  window.location.href = finalUrl;
}

// عرض رسالة تحميل
function showLoadingMessage() {
  const episodesGrid = $("#siwane-episodes-grid");
  episodesGrid.html(`
    <div style="text-align: center; padding: 20px;">
      <p style="color: var(--linkC); margin-bottom: 15px;">جاري البحث عن مقال عشوائي...</p>
      <div class="loading-spinner"></div>
    </div>
  `);
}

// تحميل السيرفرات للحلقة المحددة
function loadServersForEpisode(episodeNumber) {
  const config = window.siwanePlayerConfig;
  const serversGrid = $("#siwane-servers-grid");
  
  serversGrid.html(`<p style='color: #a9d6e5; text-align: center;'>جاري تحميل سيرفرات الحلقة ${episodeNumber}...</p>`);

  $.ajax({
    url: config.GAS_WEB_APP_URL + '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME) + 
         '&episodeNumber=' + encodeURIComponent(episodeNumber),
    type: 'GET',
    dataType: 'json',
    success: function(servers) {
      serversGrid.empty();

      if (!Array.isArray(servers) || servers.length === 0) {
        serversGrid.html(`<p style='color: #a9d6e5; text-align: center;'>لا توجد سيرفرات متاحة للحلقة ${episodeNumber}.</p>`);
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
          url: config.GAS_WEB_APP_URL + '?id=' + encodeURIComponent(serverId) + 
               '&contentSheetName=' + encodeURIComponent(contentSheetNameForDecryption),
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
      serversGrid.html("<p style='color: red; text-align: center;'>فشل في تحميل السيرفرات. يرجى المحاولة لاحقًا.</p>");
    }
  });
}

// وظائف المساعدة الأخرى (كما هي)
function startCountdownAndPlay(videoUrl) {
  const config = window.siwanePlayerConfig;
  let countdownInterval;
  let countdownValue = config.COUNTDOWN_DURATION || 15;
  
  clearInterval(countdownInterval);
  countdownValue = config.COUNTDOWN_DURATION || 15;
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
