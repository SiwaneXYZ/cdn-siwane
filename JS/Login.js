

// استيراد وحدات Firebase الضرورية
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    FacebookAuthProvider,
    GithubAuthProvider,
    TwitterAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    limit,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

//#################################################################################
// الخطوة 1: منطق سكربت الحماية
//#################################################################################

// --- دالة لإضافة أنماط الحماية إلى الصفحة ---
const addProtectionStyles = () => {
  const styles = `
    /* منع اختيار النص */
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }

    /* تحذير النسخ (إذا كنت تستخدمه في مكان آخر) */
    .copy-warning {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .warning-overlay {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
    }
    .warning-content {
      position: relative;
      background: #f8d7da;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      max-width: 80%;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      z-index: 10000;
    }
    .warning-content h3 {
      color: #721c24;
      margin-bottom: 15px;
    }

    /* أنماط الـ OVERLAY الذي يغطي الشاشة ويطبق البلور */
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.7); /* خلفية شفافة */
      z-index: 9999; /* يجب أن يكون أقل من رسالة الخطأ وأعلى من محتوى الصفحة */
      backdrop-filter: blur(5px); /* تأثير البلور */
      -webkit-backdrop-filter: blur(5px); /* لدعم متصفحات WebKit */
    }

    /* أنماط إشعارات الخطأ للحماية */
    .notification-error-protection {
      background-color: #f8d7da;
      color: #721c24;
      padding: 20px;
      text-align: center;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      font-weight: bold;
      font-size: 18px;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: slideIn 0.5s ease-in-out;
      z-index: 10000; /* يجب أن يكون أعلى من الـ overlay */
      width: 80%;
      max-width: 500px;
    }
    .support-link-protection {
      display: block;
      margin-top: 15px;
      padding: 10px;
      background-color: #25d366;
      color: white;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      text-align: center;
    }
    .support-link-protection:hover { background-color: #128c7e; }
    @keyframes slideIn {
      from { opacity: 0; transform: translate(-50%, -60%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
};

// --- دالة فك تشفير النص المشفر ---
function decryptText(encryptedText, key) {
    try {
        const decodedBase64 = atob(encryptedText);
        const decrypted = CryptoJS.AES.decrypt(decodedBase64, key).toString(CryptoJS.enc.Utf8);
        return decrypted;
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
}

// --- المفتاح السري (يجب أن يتطابق مع المستخدم في التشفير) ---
const encodedSecretKey = "UmF3YW4wNUAqIyQ="; // "Rawan05@*#$" مرمّز بـ Base64
const secretKey = atob(encodedSecretKey);

// --- دالة عرض إشعارات خطأ الحماية ---
function showErrorNotification(errorType) {
    // إزالة أي إشعارات سابقة للحماية (إذا كانت موجودة)
    const existingNotification = document.getElementById('protection-notification-area');
    if (existingNotification) {
        existingNotification.remove();
    }
    // إزالة أي overlay سابق (إذا كان موجودًا)
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // إنشاء الـ overlay
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'overlay';
    document.body.appendChild(overlayDiv); // أضف الـ overlay أولاً ليغطي كل شيء

    const protectionNotificationArea = document.createElement('div');
    protectionNotificationArea.id = 'protection-notification-area';
    protectionNotificationArea.className = 'notification-error-protection';

    let messageHtml = "";
    if (errorType === "key") {
        messageHtml = `<p>خطأ: رمز التفعيل غير صحيح!</p>
                       <a href="mailto:support@siwane.xyz?subject=مشكلة في رمز التفعيل" class="support-link-protection">اتصل بالدعم</a>`;
    } else if (errorType === "naming") {
        messageHtml = `<p>خطأ: النطاق الحالي غير مدعوم!</p>
                       <a href="mailto:support@siwane.xyz?subject=مشكلة في النطاق" class="support-link-protection">اتصل بالدعم</a>`;
    } else if (errorType === "config_html") {
        messageHtml = `<p>خطأ: إعدادات الحماية الأساسية (\`encryptedBase64\`) مفقودة أو غير كاملة في ملف HTML!</p>
                       <p style="font-size:0.8em; color: #555;">يرجى مراجعة وحدة السكربت التي تعرف الكائن \`encryptedBase64\`.</p>
                       <a href="mailto:support@siwane.xyz?subject=مشكلة في إعدادات الحماية HTML" class="support-link-protection">اتصل بالدعم</a>`;
    } else if (errorType === "firebase_config_missing") {
        messageHtml = `<p>خطأ حرج: إعدادات Firebase أو مسار إعادة التوجيه مفقودان (لم يتم تعريفهما عالميًا). يرجى التحقق من ملف HTML.</p>
                       <a href="mailto:support@siwane.xyz?subject=مشكلة في تعريف إعدادات Firebase HTML" class="support-link-protection">اتصل بالدعم</a>`;
    } else {
        messageHtml = `<p>خطأ غير معروف في نظام الحماية.</p>
                       <a href="mailto:support@siwane.xyz?subject=خطأ غير معروف في الحماية" class="support-link-protection">اتصل بالدعم</a>`;
    }

    protectionNotificationArea.innerHTML = messageHtml;
    document.body.appendChild(protectionNotificationArea); // أضف الإشعار بعد الـ overlay ليكون فوقه
    console.error("Protection error:", errorType);

    // تم إزالة مستمع حدث النقر من الـ overlayDiv هنا لضمان عدم إغلاق الإشعار بالنقر على أي مكان
}

// --- دالة التحقق من النطاق وتنشيط الكود المحمي ---
function verifyDomain() {
    addProtectionStyles(); // إضافة الأنماط دائمًا فورًا عند بدء التحقق

    // التحقق من وجود الكائن `encryptedBase64` ورمز التفعيل
    if (typeof encryptedBase64 === 'undefined' || !encryptedBase64 || !encryptedBase64.activationCode) {
        console.error("Protection settings (encryptedBase64 object or its activationCode) not found or incomplete in HTML.");
        showErrorNotification("config_html");
        return;
    }

    // التحقق من وجود إعدادات Firebase ومسار إعادة التوجيه كمتغيرات عامة
    if (typeof window.firebaseConfig === 'undefined' || typeof window.redirectPath === 'undefined') {
        console.error("Firebase config or redirect path not found globally (window object). Check HTML script order.");
        showErrorNotification("firebase_config_missing");
        return;
    }

    const decryptedText = decryptText(encryptedBase64.activationCode, secretKey);

    if (decryptedText) {
        const currentDomain = window.location.hostname;
        const cleanDecryptedText = decryptedText.replace(/^www\./, '');
        const cleanCurrentDomain = currentDomain.replace(/^www\./, '');

        if (cleanCurrentDomain === cleanDecryptedText) {
            console.log("Domain verification successful. Initializing protected code.");
            protectedCode(); // استدعاء الكود المحمي
        } else {
            console.warn(`Domain mismatch: Current='${cleanCurrentDomain}', Expected (decrypted)='${cleanDecryptedText}'`);
            showErrorNotification("naming");
        }
    } else {
        showErrorNotification("key");
    }
}

//#################################################################################
// الخطوة 2: الكود المحمي (نظام تسجيل الدخول بـ Firebase)
//#################################################################################
function protectedCode() {
    console.log("تم التحقق بنجاح! الكود المحمي يعمل الآن.");

    // التحقق النهائي من وجود إعدادات Firebase ومسار إعادة التوجيه (من المتغيرات العالمية)
    if (!window.firebaseConfig || !window.redirectPath) {
        console.error("Firebase config or redirect path is missing from global window object inside protectedCode.");
        showErrorNotification("firebase_config_missing"); // عرض خطأ إذا كانت البيانات مفقودة
        return;
    }

    // تهيئة Firebase باستخدام الإعدادات من `window.firebaseConfig`
    const app = initializeApp(window.firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const googleProvider = new GoogleAuthProvider();
    const facebookProvider = new FacebookAuthProvider();
    const githubProvider = new GithubAuthProvider();
    const twitterProvider = new TwitterAuthProvider();

    // عناصر DOM
    const container = document.querySelector('.container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordSection = document.getElementById('forgot-password-section');
    const forgotPasswordEmailInput = document.getElementById('forgot-password-email');
    const sendResetEmailButton = document.getElementById('send-reset-email-button');
    const backToLoginLink = document.getElementById('back-to-login-link');

    const socialAuthButtons = document.querySelectorAll('.social-auth-button');
    const googleAuthButtons = document.querySelectorAll('.google-auth-button');
    const facebookAuthButtons = document.querySelectorAll('.facebook-auth-button');
    const githubAuthButtons = document.querySelectorAll('.github-auth-button');
    const twitterAuthButtons = document.querySelectorAll('.twitter-auth-button');

    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.login-btn');
    const eyeIcons = document.querySelectorAll('.eye-icon');

    const notificationArea = document.getElementById('global-notification-area');
    const notificationMessage = document.getElementById('global-notification-message');

    const loginPasswordInput = document.getElementById('login-password');
    const loginPasswordFeedback = document.getElementById('login-password-feedback');

    const signupPasswordInput = document.getElementById('signup-password');
    const signupPasswordFeedback = document.getElementById('signup-password-feedback');

    const USER_PROFILE_CACHE_KEY = 'firebase_user_profile_cache';

    const pages = {
        login: '/p/login.html',
        profile: window.redirectPath, // استخدام مسار إعادة التوجيه من المتغيرات العامة
        admin: '/p/admin.html' // يمكنك تعديل هذا إذا كان لديك صفحة admin
    };

    // إضافة الخاصية الجديدة targetRedirect هنا
    let targetRedirect = window.targetRedirect || null;


    // --- وظائف مساعدة ---
    function showMessage(type, message) {
        if (!message || message.trim() === '') {
            hideMessages();
            return;
        }
        notificationMessage.textContent = message;
        notificationArea.classList.remove('notification-success', 'notification-error');
        if (type === 'error') {
            notificationArea.classList.add('notification-error');
        } else if (type === 'success') {
            notificationArea.classList.add('notification-success');
        }
        notificationArea.classList.add('show');
        setTimeout(hideMessages, 5000);
    }

    function hideMessages() {
        notificationArea.classList.remove('show');
    }

    function validatePhoneNumber(phone) {
        const re = /^\+?[0-9]{6,}$/;
        return re.test(String(phone).trim());
    }

    function validateFullName(name) {
        return String(name).trim().length >= 2;
    }

    async function isUsernameAvailable(username) {
        try {
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('username', '==', username.toLowerCase().trim()), limit(1));
            const snapshot = await getDocs(q);
            return snapshot.empty;
        } catch (error) {
            console.error('Error checking username availability:', error);
            return false;
        }
    }

    async function generateUniqueUsername(emailOrDisplayName, uid) {
        let baseUsername = (emailOrDisplayName || uid || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
        if (baseUsername.length === 0) baseUsername = 'user';

        let username = baseUsername;
        let counter = 1;
        let isAvailable = await isUsernameAvailable(username);

        while (!isAvailable && counter < 100) {
            username = `${baseUsername}${counter}`;
            isAvailable = await isUsernameAvailable(username);
            counter++;
        }

        if (!isAvailable) {
            console.warn('Could not generate a unique username after multiple attempts, falling back to UID based username.');
            return `user_${uid.substring(0, 8)}`;
        }
        return username;
    }

    async function saveUserProfile(user, providerId, fullNameFromForm, phoneNumberFromForm, additionalUserInfo = {}) {
        const userRef = doc(db, 'users', user.uid);
        try {
            const userDocSnap = await getDoc(userRef);
            const userDocExists = userDocSnap.exists();
            const userData = userDocSnap.data() || {};
            const isNewUser = !userDocExists;

            console.log('saveUserProfile called for user UID:', user.uid, 'Provider:', providerId);
            console.log('Form Data Received (fullName, phoneNumber):', { fullNameFromForm, phoneNumberFromForm });
            console.log('Existing Firestore Data (if any):', userData);

            let username = userData.username;
            if (!username) {
                console.log('Username not found in Firestore, generating new one.');
                const sourceIdentifier = (providerId === 'github.com' ? user.displayName : user.email) || user.uid;
                username = await generateUniqueUsername(sourceIdentifier, user.uid);
                console.log('Generated Username:', username);
            }

            const updatedData = {
                fullName: (isNewUser && fullNameFromForm) ? fullNameFromForm : (userData.fullName || user.displayName || 'مستخدم جديد'),
                username: username || userData.username || 'user',
                email: user.email || userData.email || null,
                phoneNumber: (isNewUser && phoneNumberFromForm) ? phoneNumberFromForm : (userData.phoneNumber || user.phoneNumber || ''),
                accountType: userData.accountType || 'normal',
                isAdmin: userData.isAdmin || false,
                emailVerified: user.emailVerified || userData.emailVerified || (providerId !== 'password' && user.email != null),
                createdAt: userData.createdAt || serverTimestamp(),
                lastLogin: serverTimestamp(),
                provider: providerId || userData.provider || (user.providerData && user.providerData.length > 0 ? user.providerData[0].providerId : 'unknown'),
                photoURL: user.photoURL || userData.photoURL || null
            };

            console.log('Final data prepared for Firestore setDoc:', updatedData);

            await setDoc(userRef, updatedData, { merge: true });
            console.log('User profile successfully saved/updated in Firestore for UID:', user.uid);

            try {
                localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(updatedData));
                console.log('User profile data cached in localStorage.');
            } catch (lsError) {
                console.warn('Failed to cache user profile in localStorage:', lsError);
            }
            return updatedData;
        } catch (error) {
            console.error('Firestore saveUserProfile failed for UID:', user.uid, error);
            if (providerId === 'password' && additionalUserInfo?.isNewUser && user && auth.currentUser?.uid === user.uid) {
                console.log('Attempting to delete newly created Firebase Auth user due to Firestore save failure...');
                try {
                    await user.delete();
                    console.log('Newly created Firebase Auth user successfully deleted after Firestore save failure.');
                    showMessage('error', 'فشل إكمال إنشاء الحساب بشكل كامل بسبب خطأ داخلي. تم حذف الحساب الجزئي. يرجى المحاولة مرة أخرى بعد قليل.');
                } catch (delError) {
                    console.error('Failed to delete user after Firestore save failure:', delError);
                    showMessage('error', 'حدث خطأ فادح أثناء إنشاء الحساب ولا يمكن إكمال العملية تلقائياً. تم إنشاء جزء من الحساب ولكن حدثت مشكلة ولم يتم حذفه. يرجى الاتصال بالدعم.');
                }
            } else {
                showMessage('error', 'حدث خطأ أثناء حفظ بيانات ملفك الشخصي. يرجى المحاولة لاحقًا.');
            }
            throw error;
        }
    }

    async function fetchAndCacheUserProfile(user) {
        const userRef = doc(db, 'users', user.uid);
        try {
            console.log('Attempting to fetch and cache user profile for UID:', user.uid);
            const userDocSnap = await getDoc(userRef);
            let userData = null;

            if (userDocSnap.exists()) {
                userData = userDocSnap.data();
                console.log('User profile found in Firestore:', userData);
                try {
                    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
                    console.log('Updated lastLogin timestamp in Firestore.');
                } catch (updateErr) {
                    console.warn('Failed to update lastLogin timestamp:', updateErr);
                }
            } else {
                console.warn('User profile NOT found in Firestore for UID:', user.uid, '. Creating basic profile.');
                const basicUserData = {
                    fullName: user.displayName || 'مستخدم جديد',
                    username: await generateUniqueUsername(user.email || user.uid, user.uid),
                    email: user.email,
                    phoneNumber: user.phoneNumber || '',
                    accountType: 'normal',
                    isAdmin: false,
                    emailVerified: user.emailVerified,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    provider: user.providerData[0]?.providerId || 'unknown',
                    photoURL: user.photoURL || null
                };
                console.log('Saving basic user profile to Firestore:', basicUserData);
                await setDoc(userRef, basicUserData, { merge: true });
                userData = basicUserData;
                console.log('Basic user profile saved successfully.');
            }

            if (userData) {
                try {
                    localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(userData));
                    console.log('User profile successfully cached in localStorage.');
                    return userData;
                } catch (lsError) {
                    console.warn('Failed to cache user profile in localStorage:', lsError);
                    return userData;
                }
            }
            console.warn('fetchAndCacheUserProfile returning null - no user data found or created.');
            return null;
        } catch (error) {
            console.error('Error fetching or caching user profile:', error);
            clearUserProfileCache();
            return null;
        }
    }

    function clearUserProfileCache() {
        try {
            localStorage.removeItem(USER_PROFILE_CACHE_KEY);
            console.log('User profile cache cleared from localStorage.');
        } catch (lsError) {
            console.warn('Failed to clear user profile cache from localStorage:', lsError);
        }
    }

    function redirectToTargetPage() {
        const currentPath = window.location.pathname;
        const loginPageName = pages.login.split('/').pop();
        const isComingFromLogin = currentPath.endsWith(loginPageName) || currentPath === '/' || currentPath.endsWith('index.html');

        let destination = pages.profile; // الوجهة الافتراضية بعد تسجيل الدخول

        // إذا كان هناك targetRedirect معرف و المستخدم لم يأتِ مباشرة إلى صفحة تسجيل الدخول
        if (targetRedirect && !isComingFromLogin) {
            destination = targetRedirect;
            console.log('Redirecting to previous page (targetRedirect):', destination);
        } else {
            console.log('Redirecting to default profile page:', destination);
        }

        // فقط أعد التوجيه إذا لم نكن بالفعل على صفحة الوجهة
        if (!currentPath.includes(destination.split('/').pop())) {
            window.location.href = destination;
        } else {
            console.log('Already on the destination page. No redirection needed.');
        }
    }


    function disableSocialButtons() {
        console.log('Disabling social login buttons.');
        socialAuthButtons.forEach(button => {
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.6';
        });
    }

    function enableSocialButtons() {
        console.log('Enabling social login buttons.');
        socialAuthButtons.forEach(button => {
            button.style.pointerEvents = 'auto';
            button.style.opacity = '1';
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // --- معالجات أحداث أزرار التبديل بين تسجيل الدخول والتسجيل ---
    registerBtn?.addEventListener('click', () => {
        console.log('Register button clicked. Switching to signup form.');
        container.classList.add('active');
        hideMessages();
        forgotPasswordSection.style.display = 'none';
        loginForm.style.display = 'block'; // للتأكد من أنها مرئية قبل التبديل
        loginPasswordFeedback.textContent = '';
        loginPasswordFeedback.className = 'password-feedback';
        signupPasswordFeedback.textContent = '';
        signupPasswordFeedback.className = 'password-feedback';
    });

    loginBtn?.addEventListener('click', () => {
        console.log('Login button clicked. Switching to login form.');
        container.classList.remove('active');
        hideMessages();
        forgotPasswordSection.style.display = 'none';
        loginForm.style.display = 'block'; // للتأكد من أنها مرئية
        loginPasswordFeedback.textContent = '';
        loginPasswordFeedback.className = 'password-feedback';
        signupPasswordFeedback.textContent = '';
        signupPasswordFeedback.className = 'password-feedback';
    });

    // --- معالج أحداث أيقونات إظهار/إخفاء كلمة المرور ---
    eyeIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const passwordInput = icon.closest('.input-box').querySelector('input');
            if (passwordInput && (passwordInput.type === 'password' || passwordInput.type === 'text')) {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                icon.classList.toggle('bxs-show', !isPassword);
                icon.classList.toggle('bxs-hide', isPassword);
                console.log('Toggled password visibility.');
            }
        });
    });

    // Event listener for signup password input to provide live feedback
    signupPasswordInput?.addEventListener('input', () => {
        const password = signupPasswordInput.value;
        if (password.length === 0) {
            signupPasswordFeedback.textContent = '';
            signupPasswordFeedback.className = 'password-feedback';
            return;
        }
        if (password.length < 6) {
            signupPasswordFeedback.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
            signupPasswordFeedback.className = 'password-feedback error';
        } else {
            const hasNumber = /[0-9]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasUpper = /[A-Z]/.test(password);
            const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

            let strength = 0;
            if (hasNumber) strength++;
            if (hasLower) strength++;
            if (hasUpper) strength++;
            if (hasSpecial) strength++;
            if (password.length >= 8) strength++;

            if (strength >= 4) {
                signupPasswordFeedback.textContent = 'كلمة مرور قوية جدا.';
                signupPasswordFeedback.className = 'password-feedback success';
            } else if (strength >= 2) {
                signupPasswordFeedback.textContent = 'كلمة مرور قوية تحتوي على أرقام حروف ورموز.';
                signupPasswordFeedback.className = 'password-feedback warning';
            } else {
                signupPasswordFeedback.textContent = 'كلمة مرور ضعيفة أضف 6+ أحرف وأرقام.';
                signupPasswordFeedback.className = 'password-feedback error';
            }
        }
    });

    // --- معالج حدث إرسال نموذج تسجيل الدخول ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        loginPasswordFeedback.textContent = '';
        loginPasswordFeedback.className = 'password-feedback';

        if (!email || !password) {
            showMessage('error', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
            loginPasswordFeedback.textContent = 'كلمة المرور مطلوبة.';
            loginPasswordFeedback.className = 'password-feedback error';
            return;
        }
        if (!validateEmail(email)) {
            showMessage('error', "صيغة البريد الإلكتروني غير صحيحة.");
            return;
        }
        if (password.length < 6) {
            showMessage('error', 'كلمة المرور يجب أن لا تقل عن 6 أحرف.');
            loginPasswordFeedback.textContent = 'كلمة المرور غير صحيحة.';
            loginPasswordFeedback.className = 'password-feedback error';
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'جاري تسجيل الدخول...';
        console.log('Attempting to sign in with email and password.');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('Sign in successful:', user);
            await fetchAndCacheUserProfile(user);

            showMessage('success', 'تم تسجيل الدخول بنجاح!');
            loginPasswordFeedback.textContent = '';
            loginPasswordFeedback.className = 'password-feedback';
            // **** إعادة التوجيه بعد تسجيل الدخول بنجاح ****
            redirectToTargetPage(); // استخدام دالة إعادة التوجيه الجديدة

        } catch (error) {
            console.error('Sign in error:', error);
            let friendlyMessage = "حدث خطأ غير متوقع أثناء تسجيل الدخول.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                friendlyMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
                loginPasswordFeedback.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
                loginPasswordFeedback.className = 'password-feedback error';
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "صيغة البريد الإلكتروني غير صحيحة.";
            } else if (error.code === 'auth/user-disabled') {
                friendlyMessage = "تم تعطيل هذا الحساب.";
            } else if (error.code === 'auth/too-many-requests') {
                friendlyMessage = "تم حظر الوصول مؤقتًا بسبب كثرة المحاولات. حاول مرة أخرى لاحقًا.";
            } else {
                friendlyMessage = error.message || friendlyMessage;
            }
            showMessage('error', friendlyMessage);
        } finally {
            // قم بتمكين الزر مرة أخرى فقط إذا لم يتم تسجيل دخول المستخدم بنجاح
            if (!auth.currentUser) {
                loginButton.disabled = false;
                loginButton.textContent = 'تسجيل الدخول';
            }
        }
    });

    // --- معالج حدث إرسال نموذج إنشاء حساب ---
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const fullName = document.getElementById('signup-fullname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const password = document.getElementById('signup-password').value;

        console.log('Signup Form Submission Attempt.');
        console.log('Captured Form Values:', { fullName: fullName, email: email, phone: phone }); // لا تسجل كلمة المرور الفعلية

        if (!fullName || !email || !password || !phone) {
            showMessage('error', "الرجاء تعبئة جميع الحقول المطلوبة.");
            return;
        }
        if (!validateFullName(fullName)) {
            showMessage('error', "الرجاء إدخال اسم كامل صحيح (حرفان على الأقل).");
            return;
        }
        if (!validateEmail(email)) {
            showMessage('error', "صيغة البريد الإلكتروني غير صحيحة.");
            return;
        }
        if (password.length < 6) {
            showMessage('error', "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
            signupPasswordFeedback.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
            signupPasswordFeedback.className = 'password-feedback error';
            return;
        }
        if (!validatePhoneNumber(phone)) {
            showMessage('error', "الرجاء إدخال رقم هاتف صحيح. يجب أن يحتوي على أرقام فقط وقد يبدأ بـ +، وطوله لا يقل عن 6 أرقام.");
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = 'جاري إنشاء الحساب...';
        console.log('Attempting to create user with email and password.');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('Firebase Auth user created successfully:', user);

            console.log('Attempting to send email verification.');
            sendEmailVerification(user).then(() => {
                console.log('Email verification sent.');
            }).catch((error) => {
                console.error('Failed to send email verification:', error);
            });

            console.log('Attempting to save user profile to Firestore.');
            await saveUserProfile(user, 'password', fullName, phone, { isNewUser: true });
            console.log('User profile save to Firestore completed.');

            if (fullName && user.displayName !== fullName) {
                try {
                    console.log('Attempting to update Firebase Auth user display name:', fullName);
                    await updateProfile(user, { displayName: fullName });
                    console.log('Firebase Auth display name updated successfully.');
                } catch (updateErr) {
                    console.warn('Failed to update Firebase Auth profile display name:', updateErr);
                }
            }

            showMessage('success', "تم إنشاء الحساب بنجاح! تم إرسال رابط التحقق إلى بريدك الإلكتروني. يرجى التحقق منه لتسجيل الدخول.");
            signupForm.reset();
            signupPasswordFeedback.textContent = '';
            signupPasswordFeedback.className = 'password-feedback';
            signupButton.textContent = 'انشئ حساب جديد';
            // **** إعادة التوجيه بعد إنشاء الحساب بنجاح ****
            redirectToTargetPage(); // استخدام دالة إعادة التوجيه الجديدة


        } catch (error) {
            console.error('Signup process failed:', error);
            let friendlyMessage = "حدث خطأ أثناء إنشاء الحساب.";
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "هذا البريد الإلكتروني مستخدم بالفعل. حاول تسجيل الدخول أو استخدم بريدًا آخر.";
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.";
                signupPasswordFeedback.textContent = 'كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.';
                signupPasswordFeedback.className = 'password-feedback error';
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "صيغة البريد الإلكتروني غير صحيحة.";
            } else if (error.code === 'auth/operation-not-allowed') {
                friendlyMessage = "تم تعطيل إنشاء الحساب عبر البريد الإلكتروني/كلمة المرور. يرجى الاتصال بالدعم.";
            } else if (error.code === 'auth/network-request-failed') {
                friendlyMessage = "مشكلة في الشبكة. يرجى التحقق من اتصالك بالإنترنت.";
            } else if (error.message && !friendlyMessage.includes('خطأ حاسم أثناء حفظ')) {
                friendlyMessage = `خطأ: ${error.message}`;
            } else if (!error.message && !friendlyMessage.includes('خطأ حاسم أثناء حفظ')) {
                friendlyMessage = "حدث خطأ غير متوقع أثناء إنشاء الحساب.";
            }

            showMessage('error', friendlyMessage);
            // تأكد من تمكين الزر إذا لم يتم إنشاء الحساب بنجاح (ولم يتم تسجيل دخول المستخدم)
            if (!auth.currentUser) {
                signupButton.disabled = false;
                signupButton.textContent = 'انشئ حساب جديد';
            }
        }
    });

    // --- معالج حدث أزرار تسجيل الدخول الاجتماعي ---
    async function handleSocialAuth(provider, providerId) {
        hideMessages();
        disableSocialButtons();
        console.log('Attempting social sign in with provider:', providerId);

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalUserInfo = result.additionalUserInfo;

            console.log('Social sign in successful:', user);
            console.log('Additional User Info:', additionalUserInfo);

            await saveUserProfile(user, providerId, null, null, { isNewUser: additionalUserInfo?.isNewUser });
            console.log('User profile save/update after social login completed.');

            showMessage('success', `مرحباً ${user.displayName || user.email || 'مستخدم جديد'}! تم تسجيل الدخول بنجاح.`);
            // **** إعادة التوجيه بعد تسجيل الدخول الاجتماعي بنجاح ****
            redirectToTargetPage(); // استخدام دالة إعادة التوجيه الجديدة

        } catch (error) {
            console.error('Social sign in error for provider', providerId, ':', error);
            let friendlyMessage = `حدث خطأ أثناء المصادقة باستخدام ${providerId}.`;
            if (error.code === 'auth/account-exists-with-different-credential') {
                const email = error.email;
                friendlyMessage = `هذا البريد الإلكتروني (${email}) مسجل بالفعل بحساب آخر. الرجاء تسجيل الدخول بالطريقة الأصلية التي استخدمتها (مثل البريد الإلكتروني/كلمة المرور أو مزود اجتماعي آخر).`;
            } else if (error.code === 'auth/popup-closed-by-user') {
                friendlyMessage = 'تم إلغاء المصادقة بواسطة المستخدم.';
            } else if (error.code === 'auth/network-request-failed') {
                friendlyMessage = 'مشكلة في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                friendlyMessage = 'تم إلغاء طلب المصادقة السابق.';
            } else if (error.code === 'auth/operation-not-allowed') {
                friendlyMessage = `تم تعطيل طريقة المصادقة ${providerId}. يرجى الاتصال بالدعم.`
            } else if (error.code === 'auth/credential-already-in-use') {
                friendlyMessage = 'تم ربط هذا الحساب الاجتماعي بالفعل بمستخدم آخر.';
            } else {
                friendlyMessage = error.message || friendlyMessage;
            }
            showMessage('error', friendlyMessage);
        } finally {
            enableSocialButtons();
        }
    }

    googleAuthButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleSocialAuth(googleProvider, 'google.com');
        });
    });
    facebookAuthButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleSocialAuth(facebookProvider, 'facebook.com');
        });
    });
    githubAuthButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleSocialAuth(githubProvider, 'github.com');
        });
    });
    twitterAuthButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleSocialAuth(twitterProvider, 'twitter.com');
        });
    });

    // --- معالجات أحداث قسم نسيان كلمة المرور ---
    forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Forgot password link clicked.');
        loginForm.style.display = 'none';
        forgotPasswordSection.style.display = 'block';
        hideMessages();
        forgotPasswordEmailInput.value = '';
        loginPasswordFeedback.textContent = '';
        loginPasswordFeedback.className = 'password-feedback';
    });

    backToLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Back to login link clicked.');
        forgotPasswordSection.style.display = 'none';
        loginForm.style.display = 'block';
        hideMessages();
        loginPasswordFeedback.textContent = '';
        loginPasswordFeedback.className = 'password-feedback';
    });

    sendResetEmailButton?.addEventListener('click', async () => {
        const email = forgotPasswordEmailInput.value.trim();
        hideMessages();

        if (!email) {
            showMessage('error', 'الرجاء إدخال بريدك الإلكتروني.');
            return;
        }
        if (!validateEmail(email)) {
            showMessage('error', "صيغة البريد الإلكتروني غير صحيحة.");
            return;
        }

        sendResetEmailButton.disabled = true;
        sendResetEmailButton.textContent = 'جاري الإرسال...';
        console.log('Attempting to send password reset email to:', email);

        try {
            await sendPasswordResetEmail(auth, email);
            console.log('Password reset email sent successfully.');
            showMessage('success', `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. يرجى التحقق من بريدك الوارد.`);
            forgotPasswordEmailInput.value = '';

        } catch (error) {
            console.error('Error sending password reset email:', error);
            let friendlyMessage = "حدث خطأ أثناء إرسال رابط إعادة التعيين.";
            if (error.code === 'auth/user-not-found') {
                friendlyMessage = "لا يوجد مستخدم مسجل بهذا البريد الإلكتروني.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "صيغة البريد الإلكتروني غير صحيحة.";
            } else if (error.code === 'auth/too-many-requests') {
                friendlyMessage = "تم حظر الطلب مؤقتًا بسبب كثرة المحاولات. حاول مرة أخرى لاحقًا.";
            } else {
                friendlyMessage = error.message || friendlyMessage;
            }
            showMessage('error', friendlyMessage);
        } finally {
            sendResetEmailButton.disabled = false;
            sendResetEmailButton.textContent = 'إرسال رابط إعادة التعيين';
        }
    });

    // --- دالة تسجيل الخروج ---
    async function handleSignOut() {
        console.log('Attempting to sign out.');
        try {
            await signOut(auth);
            console.log('Sign out successful.');
            // onAuthStateChanged سيتولى إعادة التوجيه
        } catch (error) {
            console.error('Sign out error:', error);
            showMessage('error', 'حدث خطأ أثناء تسجيل الخروج.');
        }
    }

    // --- مستمع لتغيير حالة المصادقة (تسجيل الدخول/الخروج) ---
    onAuthStateChanged(auth, async (user) => {
        const currentPage = window.location.pathname;
        const loginPageName = pages.login.split('/').pop();
        const isAuthPage = currentPage.endsWith(loginPageName) || currentPage === '/' || currentPage.endsWith('index.html');

        if (user) {
            console.log('Auth state changed: User is logged in.', user.uid);
            const cachedData = localStorage.getItem(USER_PROFILE_CACHE_KEY);
            let userData = null;

            if (cachedData) {
                try {
                    userData = JSON.parse(cachedData);
                    if (userData && userData.email === user.email && userData.username) {
                        console.log('User profile found in cache.');
                    } else {
                        console.log('Cached data is invalid or for a different user. Clearing cache.');
                        userData = null;
                        clearUserProfileCache();
                    }
                } catch (e) {
                    console.error('Error parsing cached data:', e);
                    userData = null;
                    clearUserProfileCache();
                }
            }

            fetchAndCacheUserProfile(user).then(fetchedData => {
                if (fetchedData) {
                    console.log('Fetched and cached latest user profile data.');
                } else {
                    console.warn('Failed to fetch and cache user profile data.');
                }
            }).catch(error => {
                console.error('Error during fetchAndCacheUserProfile:', error);
            });

            // إذا كان المستخدم على صفحة تسجيل الدخول وهو مسجل بالفعل، أعد توجيهه
            if (isAuthPage && !currentPage.includes(pages.profile.split('/').pop())) {
                console.log('User is on auth page but logged in. Redirecting to profile page.');
                // تأخير طفيف للسماح لـ fetchAndCacheUserProfile بالبدء قبل إعادة التوجيه
                setTimeout(() => {
                    if (auth.currentUser) { // تحقق مرة أخيرة
                        redirectToTargetPage(); // الآن ستقوم دالة redirectToTargetPage بتحديد الوجهة الصحيحة
                    }
                }, 500);
            }

        } else {
            console.log('Auth state changed: No user is logged in.');
            clearUserProfileCache();

            const protectedPageIdentifier = pages.profile.split('/').pop();
            const adminPageIdentifier = pages.admin.split('/').pop();

            // إذا كان المستخدم غير مسجل الدخول ويحاول الوصول إلى صفحة محمية (غير صفحة المصادقة)،
            // قم بإعادة توجيهه إلى صفحة تسجيل الدخول.
            if (!isAuthPage && (currentPage.includes(protectedPageIdentifier) || currentPage.includes(adminPageIdentifier))) {
                console.log('User is on a protected page but not logged in. Redirecting to login.');
                window.location.href = pages.login;
            } else {
                console.log('User is on an auth page and not logged in. Staying put.');
            }
        }
    });

    // --- عند تحميل الصفحة لأول مرة ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM fully loaded and parsed.');
        hideMessages();
        forgotPasswordSection.style.display = 'none';
        // لا تستدعي container.classList.remove('active') هنا مباشرةً،
        // المنطق أدناه سيتولى ذلك بناءً على الـ URL

        loginPasswordFeedback.textContent = '';
        loginPasswordFeedback.className = 'password-feedback';
        signupPasswordFeedback.textContent = '';
        signupPasswordFeedback.className = 'password-feedback';

        const cachedData = localStorage.getItem(USER_PROFILE_CACHE_KEY);
        if (cachedData) {
            try {
                const userData = JSON.parse(cachedData);
                console.log('Found cached user data on load:', userData);
            } catch (e) {
                console.error('Error parsing cached data on load:', e);
                clearUserProfileCache();
            }
        }

        // -------------------------------------------------------------
        // هذا هو الجزء الذي يقرأ معلمة الـ URL ويحدد الواجهة
        // -------------------------------------------------------------
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode'); // قراءة القيمة 'mode' من "?mode=..."

        if (mode === 'signup') {
            console.log('URL contains "?mode=signup". Switching to signup form.');
            container.classList.add('active'); // إضافة الكلاس 'active' لعرض واجهة التسجيل
            loginForm.style.display = 'block'; // تأكد أن النموذج مرئي
        } else {
            console.log('URL does not contain "?mode=signup" or is empty. Defaulting to login form.');
            container.classList.remove('active'); // إزالة الكلاس 'active' لعرض واجهة تسجيل الدخول
            loginForm.style.display = 'block'; // تأكد أن النموذج مرئي
        }
        // -------------------------------------------------------------
    });

} // نهاية protectedCode

//#################################################################################
// الخطوة 3: الاستدعاء الأولي لبدء عملية التحقق
//#################################################################################
// تأكد من أن الكائن encryptedBase64 مُعرف (من ملف HTML) قبل استدعاء verifyDomain
// إذا لم يكن كذلك، انتظر حتى يتم تحميل DOM بالكامل كمحاولة أخيرة.
if (typeof encryptedBase64 !== 'undefined') {
    verifyDomain();
} else {
    console.warn("`encryptedBase64` is not defined globally when login.js initially runs. Waiting for DOMContentLoaded.");
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof encryptedBase64 !== 'undefined') {
            verifyDomain();
        } else {
            console.error("Protection settings (encryptedBase64) are still not defined after DOMContentLoaded. Cannot verify domain.");
            addProtectionStyles(); // إضافة الأنماط حتى لو لم يتم تعريف `encryptedBase64`
            showErrorNotification("config_html"); // للإشارة إلى أن `encryptedBase64` غير موجود
        }
    });
}

