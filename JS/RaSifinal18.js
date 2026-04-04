document.addEventListener("DOMContentLoaded", function() {
    
    // =====================================================================
    // 1. الإعدادات (المفاتيح يتم سحبها من الـ HTML لكي لا يتم حظرها من GitHub)
    // =====================================================================
    const USAGE_KEY = "RaSiChatUsage_v1",
          HISTORY_KEY = "RaSiChatHistory_v1",
          DEV_FLAG_KEY = "RaSiDevUnlimited_v1",
          DEFAULT_DAILY_LIMIT = 25;

    let messagesLoaded = false;
    let headerClickCount = 0, headerClickTimer = null;

    const container = document.getElementById("RaSi-chat-container");
    const txt = document.getElementById("RaSi-input");
    const head = document.getElementById("RaSi-head");
    const charsUI = document.getElementById("RaSi-chars");
    const chatBtn = document.getElementById("RaSi-chat-btn");
    const messagesArea = document.getElementById("RaSi-messages");

    if (!chatBtn || !container) return;

    // =====================================================================
    // 2. التجاوب الذكي والآمن مع زر PWA (مبني على 125px)
    // =====================================================================
    function setupPwaSync() {
        // الحساب الدقيق للمسافات
        const BTN_HIGH = "175px"; // (PWA Bottom 125 + PWA Height 40 + Gap 10)
        const BTN_LOW = "125px";  // يأخذ مكان زر PWA إذا لم يكن موجوداً
        
        const CONTAINER_HIGH = "230px"; // (Btn High 175 + Btn Height 40 + Gap 15)
        const CONTAINER_LOW = "180px";  // (Btn Low 125 + Btn Height 40 + Gap 15)

        const updatePositions = () => {
            const pwaBtn = document.getElementById("app_install_button") || document.querySelector(".pwa-button");
            
            // نتحقق إذا كان زر PWA مخفياً أو غير موجود قطعاً
            const isPwaNotVisible = !pwaBtn || pwaBtn.hidden || getComputedStyle(pwaBtn).display === "none" || getComputedStyle(pwaBtn).visibility === "hidden";

            // إذا لم يكن PWA موجوداً، ينزل الدردشة للأسفل. وإلا يبقى في الأعلى.
            const btnBottom = isPwaNotVisible ? BTN_LOW : BTN_HIGH;
            chatBtn.style.setProperty("bottom", btnBottom, "important");

            if (window.innerWidth > 767 && container && container.style.display === "flex" && !container.classList.contains("RaSi-fullscreen")) {
                const containerBottom = isPwaNotVisible ? CONTAINER_LOW : CONTAINER_HIGH;
                container.style.setProperty("bottom", containerBottom, "important");
            }
        };

        updatePositions();
        window.addEventListener("resize", updatePositions);

        const observer = new MutationObserver(() => updatePositions());
        if (document.getElementById("app_install_button")) {
            observer.observe(document.getElementById("app_install_button"), { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
        } else if (document.querySelector(".pwa-button")) {
            observer.observe(document.querySelector(".pwa-button"), { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
        } else {
            observer.observe(document.body, { childList: true, subtree: true });
        }

        window.RaSiSyncPwaPositions = updatePositions;
    }
    
    setupPwaSync();

    // =====================================================================
    // 3. دوال النظام والمساعدة
    // =====================================================================
    function escapeHtml(e) { return e ? e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") : "" }
    function isSafeUrl(e) { try { let t = new URL(e, location.href); return "https:" === t.protocol || "http:" === t.protocol } catch (e) { return false } }

    function renderRichText(e) {
        let t = escapeHtml(e);
        t = t.replace(/^#{1,6}\s+(.*)$/gm, (e, t) => `<b style="display:block; margin:15px 0 8px 0; color:var(--linkC, #2563eb);">${t.trim()}</b>`);
        let n = 0;
        t = t.replace(/^[*\-]\s+(.*)$/gm, (e, t) => { n++; let s = n <= 10 ? ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠"][n - 1] : n + "."; return `${s} ${t.trim()}<br>` });
        t = t.replace(/(?<!\w)[*#](?!\w)/g, ""); t = t.replace(/\*\*/g, ""); t = t.replace(/\*/g, "");
        t = t.replace(/!\[([^\]]*?)\]\((.*?)\)/g, (e, t, n) => isSafeUrl(n.trim()) ? `<img src="${n.trim()}" alt="${escapeHtml(t)}" loading="lazy" style="max-width:100%; height:auto; border-radius:8px; margin:8px 0;">` : escapeHtml(e));
        t = t.replace(/\[([^\]]+)\]\((.*?)\)/g, (e, t, n) => isSafeUrl(n.trim()) ? `<a href="${n.trim()}" target="_blank" rel="noopener noreferrer" style="color:var(--linkC, #2563eb); text-decoration:underline;">${escapeHtml(t)}</a>` : escapeHtml(e));
        t = t.replace(/`([^`]+)`/g, (e, t) => `<code style="background:var(--contentBa, #f4f8ff); padding:2px 6px; border-radius:4px; border:1px solid var(--contentL, #e3e7ef);">${escapeHtml(t)}</code>`);
        t = t.replace(/\*\*(.*?)\*\*/g, (e, t) => `<b style="font-weight:600;">${escapeHtml(t)}</b>`);
        t = t.replace(/\*(.*?)\*/g, (e, t) => `<i style="font-style:italic;">${escapeHtml(t)}</i>`);
        t = t.replace(/(^|\s)(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|bmp))(?![^<]*>)/gi, (e, t, n) => isSafeUrl(n) ? `${t}<img src="${n}" loading="lazy" style="max-width:100%; height:auto; border-radius:8px; margin:8px 0;">` : e);
        t = t.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (e, t, n) => isSafeUrl(n) ? `${t}<a href="${n}" target="_blank" rel="noopener noreferrer" style="color:var(--linkC, #2563eb); text-decoration:underline;">${escapeHtml(n)}</a>` : e);
        t = t.replace(/\n\n+/g, "<br><br>"); t = t.replace(/\n/g, "<br>"); t = t.replace(/(<br>){3,}/g, "<br><br>");
        return t;
    }

    function loadUsage() { try { let e = localStorage.getItem(USAGE_KEY); if (!e) return initUsage(); let t = JSON.parse(e), n = new Date().toISOString().slice(0, 10); if (t.date !== n) return initUsage(); return t; } catch (s) { return initUsage(); } }
    function initUsage() { let e = new Date().toISOString().slice(0, 10), t = { date: e, count: 0, limit: DEFAULT_DAILY_LIMIT }; localStorage.setItem(USAGE_KEY, JSON.stringify(t)); return t; }
    function saveUsage(e) { localStorage.setItem(USAGE_KEY, JSON.stringify(e)); }
    function remainingMessages() { let e = "1" === localStorage.getItem(DEV_FLAG_KEY); if (e) return Infinity; let t = loadUsage(); return Math.max(0, t.limit - t.count); }

    function refreshUsageUI() {
        let remaining = remainingMessages();
        let remElement = document.getElementById("RaSi-remaining");
        let remItem = document.getElementById("RaSi-remaining-item");
        
        if (chatBtn) {
            let badge = document.getElementById("RaSi-chat-badge");
            if (!badge) {
                badge = document.createElement("div");
                badge.id = "RaSi-chat-badge";
                badge.className = "RaSi-chat-badge";
                chatBtn.appendChild(badge);
            }
            let currentUsage = loadUsage().count;
            badge.textContent = currentUsage === 0 ? "1" : currentUsage;
        }

        if(!remElement || !remItem) return;

        if (remaining === Infinity) {
            remElement.innerHTML = `<svg class='line' viewBox='0 0 24 24'><path d='M10.18 9.32001C9.35999 8.19001 8.05001 7.45001 6.54001 7.45001C4.03001 7.45001 1.98999 9.49 1.98999 12C1.98999 14.51 4.03001 16.55 6.54001 16.55C8.23001 16.55 9.80001 15.66 10.67 14.21L12 12L13.32 9.78998C14.19 8.33998 15.76 7.45001 17.45 7.45001C19.96 7.45001 22 9.49 22 12C22 14.51 19.96 16.55 17.45 16.55C15.95 16.55 14.64 15.81 13.81 14.68'></path></svg>`;
            remItem.classList.add("unlimited"); remItem.classList.remove("limited"); remItem.title = "وضع غير محدود";
        } else {
            remElement.textContent = remaining; remItem.classList.add("limited"); remItem.classList.remove("unlimited"); remItem.title = `${remaining} رسائل متبقية`;
        }
    }

    function saveHistory() {
        if(!messagesArea) return;
        try {
            let e = [...messagesArea.children],
                t = e.map(e => ({ role: e.classList.contains("RaSi-msg-user") ? "user" : "assistant", html: e.querySelector(".bubble") ? e.querySelector(".bubble").innerHTML : e.innerHTML }));
            localStorage.setItem(HISTORY_KEY, JSON.stringify(t));
        } catch (n) {}
    }

    function showStatus(e, t = 1600) { 
        let n = document.getElementById("RaSi-status"); 
        if(!n) return;
        n.style.display = "block"; n.textContent = e; 
        t > 0 && setTimeout(() => { n.style.display = "none" }, t); 
    }

    function createUserMessage(e) {
        let t = document.createElement("div"); t.className = "RaSi-msg-user";
        let n = document.createElement("div"); n.className = "bubble"; n.innerHTML = renderRichText(e); t.appendChild(n);
        let s = document.createElement("div"); s.className = "meta"; s.innerHTML = `<div class="msg-controls"><button class="edit-user" title="تعديل"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button></div>`;
        t.appendChild(s); 
        if(messagesArea) messagesArea.appendChild(t); 
        return t;
    }

    function createAiPlaceholder() {
        let e = document.createElement("div"); e.className = "RaSi-msg-ai";
        let t = document.createElement("div"); t.className = "bubble"; t.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><div class="spinner" aria-hidden="true"></div> جاري الكتابة...</div>`; e.appendChild(t);
        let n = document.createElement("div"); n.className = "meta";
        n.innerHTML = `<div class="msg-controls"><button class="copy-reply" title="نسخ الرد"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><button class="like-btn" title="إعجاب"><svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></button><button class="dislike-btn" title="عدم إعجاب"><svg viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg></button><button class="download-msg" title="تحميل الرد"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button><button class="resend-retry" title="إعادة المحاولة" style="display:none"><svg viewBox="0 0 24 24"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button></div>`;
        e.appendChild(n); 
        if(messagesArea) messagesArea.appendChild(e); 
        setTimeout(() => { ensureFullMessageVisibility(); }, 100); 
        return e;
    }

    // =====================================================================
    // 4. بناء سياق الصفحة والاتصال بخوادم الذكاء الاصطناعي
    // =====================================================================
    function getPageContext() {
        let title = document.title || "بدون عنوان";
        let bodyElement = document.querySelector('.post-body') || document.querySelector('.entry-content') || document.body;
        let snippet = bodyElement ? bodyElement.innerText.substring(0, 800).trim() : "";
        return `عنوان المقال: ${title}\nمقتطف من محتوى المقال:\n${snippet}`;
    }

    function buildConversationPayload(e) {
        if(!messagesArea) return [];
        let htmlMessages = [...messagesArea.children];
        let chatHistory = [];
        
        htmlMessages.forEach(el => {
            let isUser = el.classList.contains("RaSi-msg-user"), bubble = el.querySelector(".bubble");
            if (!bubble) return;
            let textContent = bubble.innerText || bubble.textContent || "";
            chatHistory.push({ role: isUser ? "user" : "assistant", content: textContent });
        });
        
        if(e) chatHistory.push({ role: "user", content: e });
        
        let finalMessages = chatHistory.slice(-5);
        let currentContext = getPageContext();
        let systemPrompt = "أنت مساعد تقني ذكي ولطيف لمدونة siwane.xyz. أجب باختصار واحترافية. استعن بهذا المحتوى من الصفحة الحالية إذا سألك المستخدم عنه:\n\n" + currentContext;
        
        finalMessages.unshift({ role: "system", content: systemPrompt });
        return finalMessages;
    }

    async function sendMessage(e, t = null, n = false) {
        let isDev = "1" === localStorage.getItem(DEV_FLAG_KEY);
        if (!isDev) { let usage = loadUsage(); if (usage.count >= usage.limit) return showStatus("تم تجاوز الحد اليومي للرسائل"), false; }
        
        let placeholder = t || createAiPlaceholder();
        showStatus("جاري إرسال الرسالة...");
        
        let messagesPayload = buildConversationPayload(e);
        let responseContent = "";
        let errorLog = "";

        let orKey = typeof OPENROUTER_API_KEY !== 'undefined' ? OPENROUTER_API_KEY : "";
        let orModel = typeof OPENROUTER_MODEL !== 'undefined' ? OPENROUTER_MODEL : "stepfun/step-3.5-flash:free";
        let hfKey = typeof HUGGING_FACE_TOKEN !== 'undefined' ? HUGGING_FACE_TOKEN : "";
        let hfModel = typeof HUGGING_FACE_MODEL !== 'undefined' ? HUGGING_FACE_MODEL : "HuggingFaceH4/zephyr-7b-beta";

        try {
            if(!orKey) throw new Error("مفتاح OpenRouter غير موجود.");
            
            let apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${orKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin || "https://siwane.xyz",
                    "X-Title": "siwane.xyz"
                },
                body: JSON.stringify({ 
                    model: orModel, 
                    messages: messagesPayload, 
                    max_tokens: 1000, 
                    temperature: 0.7 
                })
            });

            if (!apiRes.ok) throw new Error(`OpenRouter Error (${apiRes.status})`);
            let data = await apiRes.json();
            responseContent = data?.choices?.[0]?.message?.content;

        } catch (err1) {
            errorLog += err1.message + "<br>";
            showStatus("تبديل الخادم...");
            try {
                if(!hfKey) throw new Error("مفتاح HuggingFace غير موجود.");
                
                let hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
                    method: "POST",
                    headers: { 
                        "Authorization": `Bearer ${hfKey}`, 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ 
                        model: hfModel, 
                        messages: messagesPayload, 
                        max_tokens: 1000 
                    })
                });

                if (!hfRes.ok) throw new Error(`HuggingFace Error (${hfRes.status})`);
                let data = await hfRes.json();
                responseContent = data?.choices?.[0]?.message?.content;
            } catch (err2) {
                 errorLog += err2.message;
                 responseContent = null;
            }
        }

        let bubbleElement = placeholder.querySelector(".bubble");
        let retryBtn = placeholder.querySelector(".resend-retry");

        if (responseContent) {
            if(bubbleElement) bubbleElement.innerHTML = renderRichText(responseContent);
            if(retryBtn) retryBtn.style.display = "none";
            
            if(!n) { let u = loadUsage(); u.count = (u.count || 0) + 1; saveUsage(u); refreshUsageUI(); }
            saveHistory(); showStatus("تم الرد بنجاح!"); ensureFullMessageVisibility();
            return true;
        } else {
            if(bubbleElement) bubbleElement.innerHTML = `<div style="color:#ef4444; font-family:monospace; font-size:10px; direction:ltr; text-align:left;"><b>⚠️ خطأ:</b><br>${errorLog}</div>`;
            if(retryBtn) {
                retryBtn.style.display = "flex"; 
                retryBtn.onclick = async function() { 
                    retryBtn.disabled = true; 
                    bubbleElement.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><div class="spinner"></div> إعاد...</div>`; 
                    await sendMessage(e, placeholder, true); 
                    retryBtn.disabled = false; 
                };
            }
            saveHistory(); showStatus("تعذر الاتصال بالخادم"); ensureFullMessageVisibility();
            return false;
        }
    }

    // =====================================================================
    // 5. إدارة واجهة المستخدم والأحداث
    // =====================================================================
    function lazyLoadMessages() {
        if (!messagesLoaded) {
            let e = document.createElement("div"); e.className = "RaSi-msg-ai";
            let t = document.createElement("div"); t.className = "bubble"; t.innerHTML = `👋 مرحبًا بك! يمكنك سؤالي عن محتوى هذا المقال.`; e.appendChild(t);
            let n = document.createElement("div"); n.className = "meta";
            n.innerHTML = `<div class="msg-controls"><button class="copy-reply" title="نسخ الرد"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><button class="like-btn" title="إعجاب"><svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></button><button class="dislike-btn" title="عدم إعجاب"><svg viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg></button></div>`;
            e.appendChild(n); 
            if(messagesArea) messagesArea.appendChild(e); 
            messagesLoaded = true;
            setTimeout(() => { if(messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight; }, 100);
        }
    }

    function adjustForKeyboard() {
        if (!container || container.style.display !== "flex") return;
        if (window.visualViewport) {
            let vv = window.visualViewport;
            if (window.innerWidth <= 767) {
                if (!container.classList.contains("RaSi-fullscreen")) {
                    container.style.removeProperty("height");
                    container.style.removeProperty("top");
                    let offsetBottom = window.innerHeight - (vv.offsetTop + vv.height);
                    container.style.setProperty("bottom", Math.max(0, offsetBottom) + "px", "important");
                } else {
                    container.style.setProperty("bottom", "auto", "important");
                    container.style.setProperty("top", vv.offsetTop + "px", "important");
                    container.style.setProperty("height", vv.height + "px", "important");
                }
            } else {
                let keyboardHeight = window.innerHeight - vv.height;
                if (keyboardHeight > 150) {
                    container.style.setProperty("bottom", "10px", "important");
                    if(chatBtn) chatBtn.style.setProperty("bottom", "10px", "important");
                } else {
                    if(typeof window.RaSiSyncPwaPositions === "function") {
                        window.RaSiSyncPwaPositions();
                    }
                }
            }
        }
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", adjustForKeyboard);
        window.visualViewport.addEventListener("scroll", adjustForKeyboard);
    }

    function ensureFullMessageVisibility() {
        if(!messagesArea) return;
        const lastMessage = messagesArea.lastElementChild;
        if (lastMessage) { 
            const messageHeight = lastMessage.offsetHeight; 
            const containerHeight = messagesArea.offsetHeight; 
            messagesArea.scrollTop = messagesArea.scrollHeight - containerHeight + messageHeight + 20; 
        }
    }

    chatBtn.addEventListener("click", function() {
        container.style.display = "flex"; 
        lazyLoadMessages();
        setTimeout(function() { 
            if(txt) txt.focus(); 
            adjustForKeyboard();
            setTimeout(() => { ensureFullMessageVisibility(); }, 200); 
        }, 100);
        window.RaSiChatOpenedAt = Date.now(); 
        refreshUsageUI();
    });

    function exitFullscreenMode() {
        const fullscreenBtn = document.getElementById('RaSi-fullscreen'); 
        container.classList.remove('RaSi-fullscreen');
        document.body.classList.remove('rasi-no-scroll'); 
        if(fullscreenBtn) { fullscreenBtn.title = 'الشاشة الكاملة'; fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`; }
        container.style.removeProperty("height"); container.style.removeProperty("top"); container.style.removeProperty("bottom"); 
        if(typeof window.RaSiSyncPwaPositions === "function") window.RaSiSyncPwaPositions();
        adjustForKeyboard(); 
    }

    function enterFullscreenMode() {
        const fullscreenBtn = document.getElementById('RaSi-fullscreen'); 
        container.classList.add('RaSi-fullscreen');
        document.body.classList.add('rasi-no-scroll'); 
        if(fullscreenBtn) { fullscreenBtn.title = 'تصغير'; fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`; }
        adjustForKeyboard(); setTimeout(() => { if(messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight; }, 150);
    }

    let closeBtn = document.getElementById("RaSi-chat-close");
    if(closeBtn) {
        closeBtn.addEventListener("click", function(e) {
            e.stopPropagation(); e.preventDefault();
            document.body.classList.remove('rasi-no-scroll'); 
            if(container.classList.contains("RaSi-fullscreen")) { exitFullscreenMode(); setTimeout(() => { container.style.display = "none"; }, 100); } else { container.style.display = "none"; }
        });
    }

    let fullBtn = document.getElementById('RaSi-fullscreen');
    if(fullBtn) {
        fullBtn.addEventListener("click", function(e) { 
            e.preventDefault(); e.stopPropagation(); 
            if (container.classList.contains('RaSi-fullscreen')) { exitFullscreenMode(); } else { enterFullscreenMode(); } 
        });
    }

    if(txt) {
        txt.addEventListener("input", function(e) { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 62) + "px"; if(charsUI) charsUI.textContent = `${e.target.value.length} `; });
        txt.addEventListener("keydown", function(e) { if (("Enter" === e.key && !e.shiftKey) || ((e.ctrlKey || e.metaKey) && "Enter" === e.key)) { e.preventDefault(); let sBtn = document.getElementById("RaSi-send"); if(sBtn) sBtn.click(); return; } });
        txt.addEventListener("focus", function() { setTimeout(adjustForKeyboard, 50); setTimeout(ensureFullMessageVisibility, 300); });
        txt.addEventListener("blur", function() { setTimeout(adjustForKeyboard, 50); });
    }

    document.addEventListener("click", function(e) {
        if("flex" !== container.style.display) return;
        if(container.contains(e.target) || chatBtn.contains(e.target)) return;
        if(!document.body.contains(e.target)) return;
        document.body.classList.remove('rasi-no-scroll'); container.style.display = "none";
    });

    document.addEventListener("keydown", function(e) { if ("Escape" === e.key) { document.body.classList.remove('rasi-no-scroll'); container.style.display = "none"; } });
    
    let copyAllBtn = document.getElementById("RaSi-copy-all");
    if(copyAllBtn) copyAllBtn.addEventListener("click", function() { if(!messagesArea) return; let e = [...messagesArea.children].map(e => e.innerText).join("\n"); navigator.clipboard.writeText(e).then(() => showStatus("تم نسخ المحادثة!")); });

    let clearBtn = document.getElementById("RaSi-clear");
    if(clearBtn) clearBtn.addEventListener("click", function() { localStorage.removeItem(HISTORY_KEY); if(messagesArea) messagesArea.innerHTML = ""; messagesLoaded = false; lazyLoadMessages(); showStatus("تم حذف المحادثة!"); });

    if(messagesArea) {
        messagesArea.addEventListener('click', function(e) {
            let target = e.target.closest('button'); if (!target) return;
            const messageElement = target.closest('.RaSi-msg-ai, .RaSi-msg-user'); if (!messageElement) return;
            if (target.classList.contains('copy-reply')) {
                const text = messageElement.querySelector('.bubble').innerText || '';
                navigator.clipboard.writeText(text).then(() => { showStatus('تم نسخ الرد!'); const originalBg = target.style.background; const originalColor = target.style.color; target.style.background = 'var(--success, #10b981)'; target.style.color = 'white'; setTimeout(() => { target.style.background = originalBg; target.style.color = originalColor; }, 1000); }).catch(() => showStatus('فشل في النسخ'));
            } else if (target.classList.contains('edit-user')) {
                const text = messageElement.querySelector('.bubble').innerText || ''; if(txt) { txt.value = text; txt.focus(); txt.dispatchEvent(new Event('input')); } showStatus('تم تحميل النص للتعديل');
            } else if (target.classList.contains('like-btn') || target.classList.contains('dislike-btn')) {
                const likeBtn = messageElement.querySelector('.like-btn'), dislikeBtn = messageElement.querySelector('.dislike-btn');
                if (target.classList.contains('like-btn')) { likeBtn.classList.toggle('liked'); dislikeBtn.classList.remove('disliked'); showStatus(likeBtn.classList.contains('liked') ? 'تم تسجيل الإعجاب' : 'تم إلغاء الإعجاب'); } else { dislikeBtn.classList.toggle('disliked'); likeBtn.classList.remove('liked'); showStatus(dislikeBtn.classList.contains('disliked') ? 'تم تسجيل عدم الإعجاب' : 'تم الإلغاء'); }
            } else if (target.classList.contains('download-msg')) {
                const text = messageElement.querySelector('.bubble').innerText || '', blob = new Blob([text], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `رد-${new Date().toLocaleDateString('ar-SA')}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); showStatus('تم تحميل الرد');
            }
        });
    }

    let sendBtn = document.getElementById("RaSi-send");
    if(sendBtn) {
        sendBtn.addEventListener("click", async function() {
            if(!txt) return; let messageText = txt.value.trim(); if(!messageText) return;
            let isUnlimited = "1" === localStorage.getItem(DEV_FLAG_KEY);
            if(!isUnlimited) { let usage = loadUsage(); if(usage.count >= usage.limit) { showStatus("تم تجاوز الحد اليومي للرسائل"); return; } }
            createUserMessage(messageText); txt.value = ""; txt.style.height = "auto"; if(charsUI) charsUI.textContent = `0 `;
            let aiMessage = createAiPlaceholder(); setTimeout(() => { if(messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight; }, 50);
            saveHistory(); await sendMessage(messageText, aiMessage); setTimeout(() => { if(messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight + 100; }, 100);
        });
    }

    if(head) {
        head.addEventListener("click", function() {
            headerClickCount++; if(headerClickTimer) clearTimeout(headerClickTimer);
            headerClickTimer = setTimeout(() => { headerClickCount = 0 }, 4000);
            if (headerClickCount >= 5) { headerClickCount = 0; let t = "1" === localStorage.getItem(DEV_FLAG_KEY); if (t) { localStorage.removeItem(DEV_FLAG_KEY); showStatus("وضع المطور معطل"); } else { localStorage.setItem(DEV_FLAG_KEY, "1"); showStatus("مفعل: غير محدود"); } refreshUsageUI(); }
        });
    }

    refreshUsageUI();
});
