
  // ==============================================
// Siwane Player - Complete JavaScript
// ==============================================

$(document).ready(function() {
  const config = window.siwanePlayerConfig;
  
  // Check if we're on episodes page or player page
  const urlParams = new URLSearchParams(window.location.search);
  const episodeFromUrl = urlParams.get('episode');
  
  if (config.CONTENT_TYPE === 'series' && !episodeFromUrl) {
    initEpisodesPage();
  } else if (episodeFromUrl) {
    initPlayerPage(episodeFromUrl);
  } else {
    console.error("Invalid page configuration");
    showErrorMessage("خطأ في إعدادات الصفحة");
  }
});

// ============================================
// EPISODES PAGE FUNCTIONS
// ============================================

function initEpisodesPage() {
  const config = window.siwanePlayerConfig;
  
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_SHEET_NAME) {
    showErrorMessage("خطأ في إعدادات المشغل");
    return;
  }
  
  // Set page title
  const pageTitle = `جميع حلقات ${config.CONTENT_SHEET_NAME}`;
  document.title = pageTitle;
  $('#siwane-episode-title').text(pageTitle);
  
  // Hide player sections
  $('.siwane-server-container').hide();
  $('.siwane-video-container').hide();
  
  // Create episodes container if not exists
  if (!$("#siwane-episodes-container").length) {
    $('.siwane-header').after(`
      <div class="siwane-episodes-container">
        <h2>اختر الحلقة للعرض</h2>
        <div class="siwane-episodes-grid" id="siwane-episodes-grid">
          <p style="color: var(--linkC); text-align: center;">جاري تحميل الحلقات...</p>
        </div>
        <div id="siwane-loading" style="display: none; text-align: center; margin-top: 20px;">
          <div class="loading-spinner"></div>
          <p style="color: var(--linkC); margin-top: 10px;">جاري البحث عن مقال عشوائي...</p>
        </div>
      </div>
    `);
  }
  
  // Load all episodes
  loadAllEpisodes();
}

function loadAllEpisodes() {
  const config = window.siwanePlayerConfig;
  const episodesGrid = $("#siwane-episodes-grid");
  
  episodesGrid.html('<p style="color: #a9d6e5; text-align: center;">جاري تحميل الحلقات...</p>');
  
  // Request ALL episodes data
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME) +
         '&getAllEpisodes=true',
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: function(data) {
      handleEpisodesData(data);
    },
    error: function(xhr, status, error) {
      console.error("Failed to load episodes:", error);
      episodesGrid.html(`
        <p style="color: red; text-align: center;">
          فشل في تحميل الحلقات. يرجى:<br>
          1. التأكد من اتصال الإنترنت<br>
          2. تحديث الصفحة<br>
          3. المحاولة لاحقاً
        </p>
      `);
    }
  });
}

function handleEpisodesData(data) {
  const episodesGrid = $("#siwane-episodes-grid");
  
  if (data.error) {
    episodesGrid.html(`<p style="color: red; text-align: center;">${data.error}</p>`);
    return;
  }
  
  if (!Array.isArray(data) || data.length === 0) {
    episodesGrid.html('<p style="color: #a9d6e5; text-align: center;">لا توجد حلقات متاحة حالياً.</p>');
    return;
  }
  
  // Extract unique episode numbers
  const uniqueEpisodes = new Set();
  data.forEach(row => {
    if (row && row.length > 1 && row[1]) {
      const episodeNum = parseInt(row[1]);
      if (!isNaN(episodeNum)) {
        uniqueEpisodes.add(episodeNum);
      }
    }
  });
  
  // Check if we found episodes
  if (uniqueEpisodes.size === 0) {
    episodesGrid.html(`
      <p style="color: orange; text-align: center;">
        تنسيق البيانات غير متوافق.<br>
        تأكد من أن رقم الحلقة في العمود الثاني.
      </p>
    `);
    return;
  }
  
  // Sort episodes
  const sortedEpisodes = Array.from(uniqueEpisodes).sort((a, b) => a - b);
  
  // Clear and show episodes
  episodesGrid.empty();
  
  sortedEpisodes.forEach(episode => {
    const episodeBtn = $(`
      <div class="siwane-episode-btn" data-episode="${episode}">
        <span>الحلقة ${episode}</span>
      </div>
    `);
    episodesGrid.append(episodeBtn);
  });
  
  // Add click handlers
  $(".siwane-episode-btn").off('click').on('click', function() {
    const selectedEpisode = $(this).data('episode');
    redirectToRandomArticle(selectedEpisode);
  });
}

function redirectToRandomArticle(episodeNumber) {
  // Show loading
  $("#siwane-loading").show();
  $("#siwane-episodes-grid").hide();
  
  // Smart article discovery strategy
  discoverRandomArticle(episodeNumber);
}

function discoverRandomArticle(episodeNumber) {
  const strategies = [
    discoverFromSitemap,
    discoverFromBloggerAPI,
    discoverFromArchive,
    discoverFromRecentPosts
  ];
  
  // Try strategies in order
  tryStrategy(0);
  
  function tryStrategy(index) {
    if (index >= strategies.length) {
      // All strategies failed, use fallback
      useFallbackRedirect(episodeNumber);
      return;
    }
    
    strategies[index](episodeNumber)
      .then(articleUrl => {
        if (articleUrl) {
          finalRedirect(articleUrl, episodeNumber);
        } else {
          tryStrategy(index + 1);
        }
      })
      .catch(() => {
        tryStrategy(index + 1);
      });
  }
}

function discoverFromSitemap(episodeNumber) {
  return new Promise((resolve, reject) => {
    // Try different sitemap locations
    const sitemapUrls = [
      '/sitemap.xml',
      '/atom.xml',
      '/rss.xml',
      '/feeds/posts/default?alt=json-in-script'
    ];
    
    let currentIndex = 0;
    
    function tryNextUrl() {
      if (currentIndex >= sitemapUrls.length) {
        reject();
        return;
      }
      
      $.ajax({
        url: sitemapUrls[currentIndex],
        type: 'GET',
        dataType: 'xml',
        timeout: 5000,
        success: function(xml) {
          const articles = extractUrlsFromXML(xml);
          if (articles.length > 0) {
            const randomArticle = getRandomArticle(articles);
            resolve(randomArticle);
          } else {
            currentIndex++;
            tryNextUrl();
          }
        },
        error: function() {
          currentIndex++;
          tryNextUrl();
        }
      });
    }
    
    tryNextUrl();
  });
}

function discoverFromRecentPosts(episodeNumber) {
  return new Promise((resolve, reject) => {
    // Try to get recent posts from homepage
    $.ajax({
      url: '/',
      type: 'GET',
      timeout: 5000,
      success: function(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for article links (common patterns in Blogger)
        const articleSelectors = [
          'a[href*="/p/"]',
          'a[href*="/search/label/"]',
          'a.post-title',
          'h3.post-title a',
          'article a',
          '.post a'
        ];
        
        let articles = [];
        
        articleSelectors.forEach(selector => {
          const links = doc.querySelectorAll(selector);
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && isValidArticleUrl(href) && !articles.includes(href)) {
              articles.push(href);
            }
          });
        });
        
        if (articles.length > 0) {
          const randomArticle = getRandomArticle(articles);
          resolve(randomArticle);
        } else {
          reject();
        }
      },
      error: reject
    });
  });
}

function useFallbackRedirect(episodeNumber) {
  // Generate a random article URL based on common Blogger patterns
  const currentYear = new Date().getFullYear();
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const randomYear = Math.max(currentYear - Math.floor(Math.random() * 3), 2020);
  const randomMonth = months[Math.floor(Math.random() * months.length)];
  
  const articleUrl = `/${randomYear}/${randomMonth}/blog-post.html`;
  finalRedirect(articleUrl, episodeNumber);
}

function finalRedirect(articleUrl, episodeNumber) {
  // Ensure URL is absolute
  let finalUrl = articleUrl;
  if (!finalUrl.startsWith('http')) {
    finalUrl = window.location.origin + finalUrl;
  }
  
  // Add episode parameter
  const separator = finalUrl.includes('?') ? '&' : '?';
  finalUrl += `${separator}episode=${episodeNumber}`;
  
  // Add timestamp to prevent caching
  finalUrl += `&_t=${Date.now()}`;
  
  // Redirect
  window.location.href = finalUrl;
}

// ============================================
// PLAYER PAGE FUNCTIONS
// ============================================

function initPlayerPage(episodeNumber) {
  const config = window.siwanePlayerConfig;
  
  if (!config || !config.GAS_WEB_APP_URL || !config.CONTENT_SHEET_NAME) {
    showErrorMessage("خطأ في إعدادات المشغل");
    return;
  }
  
  // Set page title
  const pageTitle = `${config.CONTENT_SHEET_NAME} - الحلقة ${episodeNumber}`;
  document.title = pageTitle;
  $('#siwane-episode-title').text(pageTitle);
  
  // Hide episodes container if exists
  $('.siwane-episodes-container').hide();
  
  // Show player sections
  $('.siwane-server-container').show();
  $('.siwane-video-container').show();
  
  // Set countdown text
  $('#siwane-countdown-text').text(`الرجاء اختيار سيرفر للحلقة ${episodeNumber}`);
  
  // Load particles
  createParticles();
  
  // Load servers for this episode
  loadServersForEpisode(episodeNumber);
}

function loadServersForEpisode(episodeNumber) {
  const config = window.siwanePlayerConfig;
  const serversGrid = $("#siwane-servers-grid");
  
  serversGrid.html(`<p style='color: #a9d6e5; text-align: center;'>جاري تحميل سيرفرات الحلقة ${episodeNumber}...</p>`);
  
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?contentSheetName=' + encodeURIComponent(config.CONTENT_SHEET_NAME) + 
         '&episodeNumber=' + encodeURIComponent(episodeNumber),
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: function(servers) {
      handleServersData(servers, episodeNumber);
    },
    error: function(xhr, status, error) {
      serversGrid.html(`
        <p style='color: red; text-align: center;'>
          فشل في تحميل السيرفرات.<br>
          رقم الخطأ: ${xhr.status}<br>
          يرجى المحاولة لاحقاً
        </p>
      `);
    }
  });
}

function handleServersData(servers, episodeNumber) {
  const serversGrid = $("#siwane-servers-grid");
  serversGrid.empty();
  
  if (!Array.isArray(servers) || servers.length === 0) {
    serversGrid.html(`
      <p style='color: #a9d6e5; text-align: center;'>
        لا توجد سيرفرات متاحة للحلقة ${episodeNumber}.<br>
        يرجى المحاولة لاحقاً أو اختيار حلقة أخرى.
      </p>
    `);
    return;
  }
  
  servers.forEach(server => {
    const serverBtn = $(`
      <div class="siwane-server-btn"
           data-server-id="${server.id}"
           data-content-sheet-name="${config.CONTENT_SHEET_NAME}">
        <div class="siwane-server-icon">${server.icon || '🔗'}</div>
        <span>${server.title || 'سيرفر'}</span>
      </div>
    `);
    serversGrid.append(serverBtn);
  });
  
  // Add click handlers
  $(".siwane-server-btn[data-server-id]").off('click').on('click', function() {
    $(".siwane-server-btn[data-server-id]").removeClass("active");
    $(this).addClass("active");
    
    const serverId = $(this).data("server-id");
    const contentSheetName = $(this).data("content-sheet-name");
    
    decryptAndPlay(serverId, contentSheetName);
  });
}

function decryptAndPlay(serverId, contentSheetName) {
  const config = window.siwanePlayerConfig;
  
  $.ajax({
    url: config.GAS_WEB_APP_URL + 
         '?id=' + encodeURIComponent(serverId) + 
         '&contentSheetName=' + encodeURIComponent(contentSheetName),
    type: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: function(response) {
      if (response.url) {
        startCountdownAndPlay(response.url);
      } else if (response.error) {
        alert("خطأ في جلب الفيديو: " + response.error);
        $("#siwane-countdown-text").text("خطأ: " + response.error);
      }
    },
    error: function(xhr, status, error) {
      alert("خطأ في الاتصال بالخادم: " + error);
      $("#siwane-countdown-text").text("خطأ في الاتصال بالسيرفر");
    }
  });
}

function startCountdownAndPlay(videoUrl) {
  const config = window.siwanePlayerConfig;
  let countdownValue = config.COUNTDOWN_DURATION || 15;
  
  // Clear any existing interval
  if (window.countdownInterval) {
    clearInterval(window.countdownInterval);
  }
  
  // Reset display
  $("#siwane-countdown").text(countdownValue);
  $("#siwane-countdown-text").text("جاري تحضير الفيديو...");
  $("#siwane-countdown-display").show();
  $("#siwane-video-frame").hide();
  
  // Refresh particles
  createParticles();
  
  // Scroll to player
  $('html, body').animate({
    scrollTop: $("#siwane-countdown-display").offset().top - 20
  }, 600);
  
  // Start countdown
  window.countdownInterval = setInterval(() => {
    countdownValue--;
    $("#siwane-countdown").text(countdownValue);
    
    if (countdownValue <= 0) {
      clearInterval(window.countdownInterval);
      $("#siwane-countdown-text").text("جاري تشغيل الفيديو...");
      
      setTimeout(() => {
        $("#siwane-video-frame").attr("src", videoUrl);
        $("#siwane-countdown-display").hide();
        $("#siwane-video-frame").show();
      }, 800);
    }
  }, 1000);
}

// ============================================
// UTILITY FUNCTIONS
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
      animationDuration: `${Math.random() * 4 + 2}s`,
      animationDelay: `${Math.random() * 1.5}s`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      opacity: Math.random() * 0.4 + 0.1,
      backgroundColor: getRandomColor()
    });
    container.append(particle);
  }
}

function getRandomColor() {
  const colors = [
    '#4cc9f0', '#4361ee', '#3a0ca3', '#7209b7',
    '#f72585', '#4895ef', '#560bad', '#b5179e'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomArticle(articles) {
  if (!articles || articles.length === 0) return null;
  
  // Filter out current page and invalid URLs
  const currentPath = window.location.pathname;
  const validArticles = articles.filter(url => 
    url && 
    url !== currentPath && 
    !url.includes('#') &&
    !url.startsWith('javascript:') &&
    !url.includes('?episode=') &&
    isValidArticleUrl(url)
  );
  
  if (validArticles.length === 0) {
    return articles[Math.floor(Math.random() * articles.length)];
  }
  
  return validArticles[Math.floor(Math.random() * validArticles.length)];
}

function isValidArticleUrl(url) {
  // Common Blogger article patterns
  const patterns = [
    /\/\d{4}\/\d{2}\/.*\.html$/,
    /\/p\/.*\.html$/,
    /\/search\/label\/.*/,
    /\.blogspot\.com\/\d{4}\/\d{2}\/.*\.html/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

function extractUrlsFromXML(xml) {
  const urls = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml.responseText || xml, 'text/xml');
  
  // Look for URLs in different XML formats
  const locElements = xmlDoc.getElementsByTagName('loc');
  const linkElements = xmlDoc.getElementsByTagName('link');
  const urlElements = xmlDoc.getElementsByTagName('url');
  
  [locElements, linkElements, urlElements].forEach(elements => {
    for (let elem of elements) {
      const url = elem.textContent;
      if (url && isValidArticleUrl(url)) {
        urls.push(url);
      }
    }
  });
  
  return urls;
}

function showErrorMessage(message) {
  const container = $('.siwane-container');
  container.html(`
    <div class="siwane-error" style="text-align: center; padding: 40px; color: red;">
      <h2>خطأ</h2>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: var(--linkC);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">
        إعادة تحميل الصفحة
      </button>
    </div>
  `);
}

// ============================================
// INITIALIZATION
// ============================================

// Make functions globally available if needed
window.siwanePlayer = {
  loadAllEpisodes,
  loadServersForEpisode,
  startCountdownAndPlay,
  createParticles
};
