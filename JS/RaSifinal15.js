document.addEventListener("DOMContentLoaded", function() {
    
    const USAGE_KEY = "RaSiChatUsage_v1", HISTORY_KEY = "RaSiChatHistory_v1", DEV_FLAG_KEY = "RaSiDevUnlimited_v1", DEFAULT_DAILY_LIMIT = 25;
    let messagesLoaded = false, headerClickCount = 0, headerClickTimer = null;

    const container = document.getElementById("RaSi-chat-container"), txt = document.getElementById("RaSi-input");
    const head = document.getElementById("RaSi-head"), chatBtn = document.getElementById("RaSi-chat-btn");
    const messagesArea = document.getElementById("RaSi-messages");

    if (!chatBtn || !container) return;

    // 1. نظام PWA (خليتو حيت مزيان للمدونة)
    function setupPwaSync() {
        const updatePositions = () => {
            const pwaBtn = document.getElementById("app_install_button") || document.querySelector(".pwa-button");
            const isPwaVisible = pwaBtn && !pwaBtn.hidden && getComputedStyle(pwaBtn).display !== "none" && getComputedStyle(pwaBtn).visibility !== "hidden";
            chatBtn.style.setProperty("bottom", isPwaVisible ? "175px" : "125px", "important");
            if (window.innerWidth > 767 && container.style.display === "flex" && !container.classList.contains("RaSi-fullscreen")) {
                container.style.setProperty("bottom", isPwaVisible ? "230px" : "180px", "important");
            }
        };
        updatePositions(); window.addEventListener("resize", updatePositions);
        const observer = new MutationObserver(updatePositions);
        observer.observe(document.body, { childList: true, subtree: true });
    }
    setupPwaSync();

    // 2. أدوات مساعدة
    function escapeHtml(e) { return e ? e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") : "" }
    function isSafeUrl(e) { try { let t = new URL(e, location.href); return "https:" === t.protocol || "http:" === t.protocol } catch (e) { return false } }
    
    function renderRichText(e) {
        let t = escapeHtml(e);
        t = t.replace(/\n\n+/g, "<br><br>").replace(/\n/g, "<br>");
        t = t.replace(/\*\*(.*?)\*\*/g, (e, t) => `<b style="font-weight:600;">${escapeHtml(t)}</b>`);
        return t;
    }

    // 3. نظام الاستخدام
    function loadUsage() { try { let e = localStorage.getItem(USAGE_KEY); if (!e) return initUsage(); let t = JSON.parse(e), n = new Date().toISOString().slice(0, 10); return t.date !== n ? initUsage() : t; } catch (s) { return initUsage(); } }
    function initUsage() { let t = { date: new Date().toISOString().slice(0, 10), count: 0, limit: DEFAULT_DAILY_LIMIT }; localStorage.setItem(USAGE_KEY, JSON.stringify(t)); return t; }
    function saveUsage(e) { localStorage.setItem(USAGE_KEY, JSON.stringify(e)); }
    function remainingMessages() { return "1" === localStorage.getItem(DEV_FLAG_KEY) ? Infinity : Math.max(0, DEFAULT_DAILY_LIMIT - loadUsage().count); }

    function refreshUsageUI() {
        let remaining = remainingMessages(), remElement = document.getElementById("RaSi-remaining"), remItem = document.getElementById("RaSi-remaining-item");
        if (chatBtn) {
            let badge = document.getElementById("RaSi-chat-badge");
            if (!badge) { badge = document.createElement("div"); badge.id = "RaSi-chat-badge"; badge.className = "RaSi-chat-badge"; chatBtn.appendChild(badge); }
            badge.textContent = loadUsage().count === 0 ? "1" : loadUsage().count;
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
        try { let t = [...messagesArea.children].map(e => ({ role: e.classList.contains("RaSi-msg-user") ? "user" : "assistant", html: e.querySelector(".bubble") ? e.querySelector(".bubble").innerHTML : e.innerHTML })); localStorage.setItem(HISTORY_KEY, JSON.stringify(t)); } catch (n) {}
    }

    function showStatus(e, t = 1600) { let n = document.getElementById("RaSi-status"); if(!n) return; n.style.display = "block"; n.textContent = e; t > 0 && setTimeout(() => { n.style.display = "none" }, t); }

    // 4. بناء واجهة الرسائل
    function createUserMessage(e) {
        let t = document.createElement("div"); t.className = "RaSi-msg-user";
        let n = document.createElement("div"); n.className = "bubble"; n.innerHTML = renderRichText(e); t.appendChild(n);
        if(messagesArea) messagesArea.appendChild(t); return t;
    }

    function createAiPlaceholder() {
        let e = document.createElement("div"); e.className = "RaSi-msg-ai";
        let t = document.createElement("div"); t.className = "bubble"; t.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><div class="spinner" aria-hidden="true"></div> جاري الكتابة...</div>`; e.appendChild(t);
        let n = document.createElement("div"); n.className = "meta";
        n.innerHTML = `<div class="msg-controls"><button class="copy-reply" title="نسخ الرد"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div>`;
        e.appendChild(n); if(messagesArea) messagesArea.appendChild(e); 
        ensureFullMessageVisibility(); return e;
    }

    // 5. بناء الطلب وإرساله (النسخة البسيطة والسريعة)
    function buildConversationPayload(e) {
        if(!messagesArea) return [];
        let chatHistory = [];
        [...messagesArea.children].forEach(el => {
            let isUser = el.classList.contains("RaSi-msg-user"), bubble = el.querySelector(".bubble");
            if (bubble) chatHistory.push({ role: isUser ? "user" : "assistant", content: bubble.innerText || "" });
        });
        if(e) chatHistory.push({ role: "user", content: e });
        let finalMessages = chatHistory.slice(-5); // أخذ آخر 5 رسائل فقط لتخفيف الضغط
        finalMessages.unshift({ role: "system", content: "أنت مساعد تقني ذكي لمدونة siwane.xyz. أجب باختصار واحترافية." });
        return finalMessages;
    }

    async function sendMessage(e, t = null) {
        if ("1" !== localStorage.getItem(DEV_FLAG_KEY) && loadUsage().count >= loadUsage().limit) return showStatus("تم تجاوز الحد اليومي"), false;
        
        let placeholder = t || createAiPlaceholder();
        let payload = buildConversationPayload(e);
        let responseContent = "";

        // جلب المفاتيح من الـ HTML مباشرة
        let orKey = window.OR_KEY || "";
        let hfKey = window.HF_KEY || "";

        try {
            if(!orKey) throw new Error("مفتاح مفقود");
            let res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${orKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://siwane.xyz", "X-Title": "siwane.xyz" },
                body: JSON.stringify({ model: "stepfun/step-3.5-flash:free", messages: payload, max_tokens: 1000 })
            });
            if (!res.ok) throw new Error("OpenRouter Failed");
            let data = await res.json();
            responseContent = data?.choices?.[0]?.message?.content;
        } catch (err) {
            try {
                if(!hfKey) throw new Error("مفتاح مفقود");
                let res = await fetch("https://router.huggingface.co/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ model: "google/gemma-2-9b-it:nebius", messages: payload, max_tokens: 1000 })
                });
                if (!res.ok) throw new Error("HuggingFace Failed");
                let data = await res.json();
                responseContent = data?.choices?.[0]?.message?.content;
            } catch (finalErr) { responseContent = null; }
        }

        let bubble = placeholder.querySelector(".bubble");
        if (responseContent) {
            if(bubble) bubble.innerHTML = renderRichText(responseContent);
            let u = loadUsage(); u.count++; saveUsage(u); refreshUsageUI(); saveHistory();
            ensureFullMessageVisibility(); return true;
        } else {
            if(bubble) bubble.innerHTML = `<div style="color:#ef4444;">❌ الخوادم مشغولة حالياً، يرجى المحاولة لاحقاً.</div>`;
            ensureFullMessageVisibility(); return false;
        }
    }

    // 6. واجهة المستخدم والأحداث
    function lazyLoadMessages() {
        if (!messagesLoaded) {
            let e = document.createElement("div"); e.className = "RaSi-msg-ai";
            let t = document.createElement("div"); t.className = "bubble"; t.innerHTML = `👋 مرحبًا بك في دردشة مدونة صوان! كيف أساعدك اليوم؟`; e.appendChild(t);
            if(messagesArea) messagesArea.appendChild(e); messagesLoaded = true;
        }
    }

    function ensureFullMessageVisibility() { if(messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight + 50; }

    chatBtn.addEventListener("click", function() {
        container.style.display = "flex"; lazyLoadMessages();
        setTimeout(() => { if(txt) txt.focus(); ensureFullMessageVisibility(); }, 100);
        refreshUsageUI();
    });

    document.getElementById("RaSi-chat-close").addEventListener("click", function(e) {
        e.preventDefault(); container.style.display = "none"; document.body.classList.remove('rasi-no-scroll');
    });

    document.getElementById('RaSi-fullscreen').addEventListener("click", function(e) { 
        e.preventDefault(); 
        if(container.classList.contains('RaSi-fullscreen')) {
            container.classList.remove('RaSi-fullscreen'); document.body.classList.remove('rasi-no-scroll');
            this.title = 'الشاشة الكاملة'; this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
        } else {
            container.classList.add('RaSi-fullscreen'); document.body.classList.add('rasi-no-scroll');
            this.title = 'تصغير'; this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
        }
    });

    document.getElementById("RaSi-send").addEventListener("click", async function() {
        if(!txt) return; let msg = txt.value.trim(); if(!msg) return;
        createUserMessage(msg); txt.value = ""; txt.style.height = "auto";
        let aiPlaceholder = createAiPlaceholder();
        await sendMessage(msg, aiPlaceholder);
    });

    if(txt) txt.addEventListener("keydown", function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.getElementById("RaSi-send").click(); } });
    document.getElementById("RaSi-clear").addEventListener("click", function() { localStorage.removeItem(HISTORY_KEY); if(messagesArea) messagesArea.innerHTML = ""; messagesLoaded = false; lazyLoadMessages(); });

    refreshUsageUI();
});
