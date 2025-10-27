import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    // تحديد العناصر
    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const myProductsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;

    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    function getConfig() {
        const firebaseConfigScript = document.getElementById('json:firebaseconfig');
        if (!firebaseConfigScript) return {};
        try {
            const configData = JSON.parse(firebaseConfigScript.textContent);
            if (configData && configData.apiKey && (configData.appId || configData.projectId)) {
                return {
                    apiKey: configData.apiKey,
                    authDomain: configData.authDomain,
                    projectId: configData.projectId,
                    databaseURL: configData.databaseURL,
                    storageBucket: configData.storageBucket,
                    messagingSenderId: configData.messagingSenderId,
                    appId: configData.appId,
                };
            }
        } catch (e) {
            console.error("Failed to parse Firebase config:", e);
        }
        return {};
    }

    let app;
    let auth = null;
    let config = getConfig();

    // تهيئة Firebase
    if (Object.keys(config).length > 0) {
        try {
            const apps = getApps();
            app = (apps.length === 0) ? initializeApp(config) : getApp();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
        }
    }

    // الحصول على خدمة المصادقة وبدء الاستماع
    if (app) {
        try {
            auth = getAuth(app);
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // Logic for Logged In user (updateUI)
                    const firebaseUserData = { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, email: user.email };
                    let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { cachedUserData = JSON.parse(dataString); } catch (e) { cachedUserData = null; }
                    }
                    const combinedUserData = { ...cachedUserData, ...firebaseUserData, isAdmin: cachedUserData ? cachedUserData.isAdmin : false };
                    localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(combinedUserData));
                    updateUI(true, combinedUserData, combinedUserData.photoURL || user.photoURL);
                } else {
                    // Logic for Logged Out user (updateUI + showLoginPrompt)
                    localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                    updateUI(false, null, null);
                    showLoginPrompt();
                }
                if (loginCheckbox) loginCheckbox.checked = false;
            });
        } catch (error) {
            updateUI(false, null, null);
            showLoginPrompt();
            if (loginCheckbox) loginCheckbox.checked = false;
        }
    } else {
        updateUI(false, null, null);
        showLoginPrompt();
        if (loginCheckbox) loginCheckbox.checked = false;
    }

    // تحديث واجهة المستخدم (Update UI)
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');
                const isAdmin = userData && userData.isAdmin === true;
                if (adminElement) adminElement.classList.toggle('hidden', !isAdmin);
                if (myProductsElement) myProductsElement.classList.toggle('hidden', isAdmin);
                if (pointsElement) pointsElement.classList.toggle('hidden', isAdmin);
                
                if (userIconLabel) {
                    let profileImg = userIconLabel.querySelector('.current-profile-image');
                    if (!profileImg) {
                        userIconLabel.innerHTML = '';
                        profileImg = document.createElement('img');
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser', 'current-profile-image');
                        userIconLabel.appendChild(profileImg);
                    }
                    profileImg.src = profileImageUrl || DEFAULT_PROFILE_IMAGE;
                    profileImg.onerror = function () { this.src = DEFAULT_PROFILE_IMAGE; };
                    userIconLabel.classList.add('logged-in');
                }
            } else {
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');
                if (adminElement) adminElement.classList.add('hidden');
                if (pointsElement) pointsElement.classList.add('hidden');
                if (myProductsElement) myProductsElement.classList.add('hidden');
                if (userIconLabel) {
                    userIconLabel.innerHTML = originalIconHtml;
                    userIconLabel.classList.remove('logged-in');
                }
            }
        }
    }

    // تسجيل الخروج
    function logOut() {
        const performLogoutActions = () => {
            if (loginCheckbox) loginCheckbox.checked = false;
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null);
            performLogoutActions();
            return;
        }

        signOut(auth)
            .then(() => { performLogoutActions(); })
            .catch((error) => { performLogoutActions(); });
    }

    // دالة عرض اشعار تسجيل الدخول (بدون CSS مُضمن)
    function showLoginPrompt() {
        const promptDismissedData = localStorage.getItem('prompt_dismissed_v13');
        const delayDuration = 500; // 0.5 ثانية (عدنا لتأخير أقصر للاختبار)
        const transitionDuration = 400;
        
        // 1. منطق الإخفاء المؤقت
        if (promptDismissedData) {
            try {
                const dismissedData = JSON.parse(promptDismissedData);
                const daysSinceLastShow = (Date.now() - dismissedData.timestamp) / (1000 * 60 * 60 * 24);
                
                if (daysSinceLastShow < 3.5) {
                    console.warn("Prompt Check: الإشعار تم إغلاقه مؤخراً (أقل من 3.5 أيام). لن يظهر.");
                    return;
                }
            } catch (e) { /* تجاهل الخطأ واستمر */ }
        }

        // 2. التحقق من وجود العنصر
        if (document.getElementById('login-signup-prompt-dynamic')) {
            return;
        }

        // 3. متغيرات بلوجر
        const blogTitle = typeof data !== 'undefined' && data.blog && data.blog.title ? data.blog.title : 'صوانˣʸᶻ';
        const faviconUrl = typeof data !== 'undefined' && data.blog && data.blog.blogspotFaviconUrl ? data.blog.blogspotFaviconUrl : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh80X00Lvdk3ZJBmgQFmGd1SmDZvqHpPf8D6YhmW7QsWYXyo_Cbo6BFHHdv1r1ocOe4gr5OexjPYYi-9Tp6QFQsfci2WPbFDu6DGFFr4UzhyphenhyphenkbTKFEBEQyPPbuYDM08v9-OU4ySBsI4bNOPtqr-U1fKMmcqRL38XSVE_XvVjFcblgVffq1j18GvYQTZEM8/s1600/favicon.png';

        // 4. تعريف الـ HTML
        const promptHTML = `<div id="login-signup-prompt-dynamic" class="browser-notification-bar">
                <div class="prompt-content">
                    <div class="site-info">
                        <img src="${faviconUrl}" alt="${blogTitle} icon" class="site-icon"/>
                        <div class="text-block">
                            <p class="site-name">${blogTitle}</p>
                            <p class="prompt-message">هل أنت جديد هنا؟ سجل الدخول أو أنشئ حسابًا.</p>
                        </div>
                    </div>
                    <div dir="ltr" class="prompt-actions">
                        <a href="/p/login.html" class="action-button">تسجيل الدخول</a>
                        <button id="dismiss-prompt-dynamic" class="secondary-button">ليس الآن</button> 
                    </div>
                </div>
            </div>`;

        // 5. حقن الـ HTML
        const container = document.createElement('div');
        container.innerHTML = promptHTML;
        document.body.insertBefore(container.firstElementChild, document.body.firstChild); // حقن كأول ابن للـ body

        // 6. تطبيق المنطق
        const popup = document.getElementById('login-signup-prompt-dynamic');
        const dismissButton = document.getElementById('dismiss-prompt-dynamic');

        console.log("Prompt Log: بدء محاولة الإظهار بعد", delayDuration, "مللي ثانية.");

        // منطق العرض
        setTimeout(() => {
            // **التصحيح الحاسم:** فرض الإظهار لتجاوز أي تعارض في CSS القالب
            popup.style.setProperty('display', 'block', 'important');
            console.log("Prompt Log: تم تطبيق display: block !important.");
            
            setTimeout(() => {
                popup.classList.add('show');
                console.log("Prompt Log: تم إضافة .show class. يجب أن يكون الإشعار مرئياً.");
            }, 50);
        }, delayDuration);

        // منطق الإغلاق
        dismissButton.addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.parentNode && popup.parentNode.removeChild(popup);
                // حفظ وقت الإغلاق للتتبع
                localStorage.setItem('prompt_dismissed_v13', JSON.stringify({ timestamp: Date.now(), version: 'v13' }));
                console.log("Prompt Log: تم إغلاق الإشعار وحذفه.");
            }, transitionDuration);
        });
    }

    // إضافة مستمعي الأحداث
    if (logoutElement) logoutElement.addEventListener('click', logOut);
    if (adminElement) adminElement.addEventListener('click', () => { window.location.href = '/p/admin.html'; });
    if (pointsElement) pointsElement.addEventListener('click', (event) => { event.preventDefault(); window.location.href = '/p/points.html'; });
    if (myProductsElement) myProductsElement.addEventListener('click', (event) => { event.preventDefault(); window.location.href = '/p/my-products.html'; });
    if (userIconLabel && loginCheckbox) userIconLabel.addEventListener('click', (event) => { event.preventDefault(); loginCheckbox.checked = !loginCheckbox.checked; });
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            const isClickOutside = !userIconLabel.contains(target) && !popupWrapper.contains(target);
            if (isClickOutside) loginCheckbox.checked = false;
        }
    });
});
