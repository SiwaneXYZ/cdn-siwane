// membership.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// WARNING: Storing the encryption key directly in client-side code is NOT secure.
// Any user can view this key and decrypt content if they have the ciphertext.
// For real security, manage content access and decryption on a secure backend.
const ARTICLE_ENCRYPTION_KEY = "Rawan05@*#$"; // المفتاح السري للمحتوى المشفر يظل هنا

// المفتاح السري لفك تشفير رمز التفعيل الخاص بالنطاق.
// تم ترميزه بـ Base64 لجعله يبدو أقل وضوحًا، ويتم فك ترميزه هنا.
// هذا المفتاح الآن مضمن مباشرة في هذا الملف.
const ENCODED_DOMAIN_ACTIVATION_KEY = "UmF3YW4wNUAqIyQ="; // "Rawan05@*#$" مرمّز بـ Base64
const DOMAIN_ACTIVATION_KEY = atob(ENCODED_DOMAIN_ACTIVATION_KEY); // فك ترميز المفتاح

let app;
let auth;
let db;
let globalCustomSettings = {}; // لتخزين الإعدادات المخصصة بعد التحقق من النطاق

// HTML template for email verification messages
const emailVerificationHtmlTemplate = `
    <div id="mcE">
        <p class="mBox warn"><b>تنبيه! البريد الإلكتروني غير مؤكد</b><br/>
            حسابك غير مفعل. يرجى التحقق من بريدك الإلكتروني وتأكيد عنوانك للوصول إلى المحتوى.
            <span class="email-placeholder"></span></p>
         <div class="evPrompt">
            <p>لم تستلم البريد؟ 
                <a href="#" id="resendEmailVerificationLink">
                    <span class="link-text">إعادة إرسال بريد التحقق</span>
                    <span class="spinner" style="display: none;"></span> 
                </a>.
            </p>
        </div>
        <div class="evMsg evSend" style="display: none;">جاري إرسال بريد التفعيل...</div>
        <div class="evMsg evSent" style="display: none;">تم إرسال بريد التفعيل بنجاح. يرجى التحقق من صندوق الوارد (وربما مجلد الرسائل غير المرغوب فيها).</div>
        <div class="evMsg evVerified" style="display: none;">بريدك الإلكتروني مؤكد بالفعل.</div>
        <div class="evMsg evError" style="display: none;">حدث خطأ أثناء إرسال بريد التفعيل. يرجى المحاولة لاحقاً أو التواصل مع الدعم.</div>
    </div>
`;

// متغير لتعقب حالة الإرسال
let isSendingEmailVerification = false;

/**
 * Initializes the Firebase application and sets up authentication/firestore instances.
 * Also performs domain verification before proceeding with Firebase functionalities.
 * @param {object} firebaseConfig - The Firebase configuration object.
 * @param {object} domainProtectionConfig - Configuration for domain protection, including activationCode.
 */
export function initializeMembership(firebaseConfig, domainProtectionConfig) {
    if (!domainProtectionConfig || !domainProtectionConfig.activationCode) {
        showErrorNotification("key"); // رمز التفعيل مفقود أو غير صالح
        console.error("Domain protection configuration or activationCode is missing.");
        return; // توقف عن التهيئة إذا كانت إعدادات الحماية غير موجودة
    }

    // أولاً، قم بالتحقق من النطاق
    // نمرر فقط activationCode لأن المفتاح الآن موجود داخليًا
    const isDomainVerified = verifyDomain(domainProtectionConfig.activationCode, domainProtectionConfig.customSettings);

    if (isDomainVerified) {
        // إذا تم التحقق من النطاق بنجاح، قم بتهيئة Firebase
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            console.log("Firebase app and services initialized.");

            // Inject the email verification HTML into the page
            // Make sure '#membership-messages' is available in your HTML
            const membershipMessagesContainer = document.getElementById('membership-messages');
            if (membershipMessagesContainer) {
                membershipMessagesContainer.insertAdjacentHTML('beforeend', emailVerificationHtmlTemplate);
                console.log("Email verification HTML injected.");
            } else {
                console.warn("Container with ID 'membership-messages' not found for injecting HTML.");
            }

            // فقط قم بإعداد مستمع حالة المصادقة إذا تم تهيئة التطبيق والمصادقة بنجاح
            setupAuthStateListener();
            // أضف مستمع الحدث هنا بعد تهيئة Firebase وتوفر auth وبعد حقن الـ HTML
            setupEmailVerificationResendListener();

        } catch (e) {
            console.error("Firebase initialization failed:", e);
            showErrorNotification("firebase-init"); // عرض إشعار خطأ إذا فشلت تهيئة Firebase
        }
    } else {
        // إذا فشل التحقق من النطاق، دالة verifyDomain ستعرض الإشعار المناسب.
        // لا حاجة لتهيئة Firebase أو أي شيء آخر.
        console.warn("Domain verification failed. Firebase initialization aborted.");
    }
}

/**
 * Decrypts an encrypted text using AES and a given key.
 * Uses atob to decode Base64 before decryption.
 * @param {string} encryptedText - The Base64 encoded and AES encrypted text.
 * @param {string} key - The decryption key.
 * @returns {string|null} The decrypted plaintext, or null if decryption fails.
 */
function decryptText(encryptedText, key) {
    try {
        if (!window.CryptoJS) {
            console.error("CryptoJS library is not loaded for domain decryption.");
            return null;
        }
        const decodedBase64 = atob(encryptedText);
        const decrypted = CryptoJS.AES.decrypt(decodedBase64, key).toString(CryptoJS.enc.Utf8);
        return decrypted;
    } catch (e) {
        console.error("Error decrypting domain activation code:", e);
        return null;
    }
}

/**
 * Verifies the current domain against the provided activation code.
 * @param {string} activationCode - The Base64 encoded and AES encrypted allowed domain.
 * @param {object} customSettings - Custom settings to store if verification is successful.
 * @returns {boolean} True if the domain is valid, false otherwise.
 */
function verifyDomain(activationCode, customSettings) {
    // المفتاح يتم جلبه الآن من DOMAIN_ACTIVATION_KEY المعرف في هذا الملف
    const decryptedDomain = decryptText(activationCode, DOMAIN_ACTIVATION_KEY);

    if (decryptedDomain) {
        const currentDomain = window.location.hostname; // الحصول على نطاق الصفحة الحالية

        // تأكد من إزالة www إذا كانت موجودة في النطاقات للمقارنة المتسقة
        const cleanDecryptedDomain = decryptedDomain.replace(/^www\./, '');
        const cleanCurrentDomain = currentDomain.replace(/^www\./, '');

        if (cleanCurrentDomain === cleanDecryptedDomain) {
            console.log("Domain verified successfully:", cleanCurrentDomain);
            globalCustomSettings = customSettings; // حفظ الإعدادات المخصصة
            return true;
        } else {
            console.warn(`Domain mismatch! Current: ${cleanCurrentDomain}, Expected: ${cleanDecryptedDomain}`);
            showErrorNotification("naming"); // عرض إشعار خطأ متعلق بالنطاق
            return false;
        }
    } else {
        console.error("Failed to decrypt domain activation code.");
        showErrorNotification("key"); // عرض إشعار خطأ متعلق برمز التفعيل
        return false;
    }
}

/**
 * Displays an error notification to the user and halts further script execution.
 * @param {string} errorType - The type of error ('key', 'naming', 'firebase-init').
 */
function showErrorNotification(errorType) {
    // إخفاء جميع عناصر protected-content
    document.querySelectorAll('.protected-content').forEach(element => {
        element.style.display = 'none';
    });

    // إنشاء طبقة التعتيم
    let overlay = document.querySelector(".overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "overlay";
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';

    // إنشاء إشعار الخطأ
    let notification = document.querySelector(".notification-error");
    if (!notification) {
        notification = document.createElement("div");
        notification.className = "notification-error";
        document.body.appendChild(notification);
    }
    notification.style.display = 'block';


    // تخصيص الرسالة بناءً على نوع الخطأ
    if (errorType === "key") {
        notification.innerHTML = `
            <p>خطأ: رمز التفعيل غير صحيح أو فاسد!</p>
            <p>الرجاء التأكد من صحة إعدادات السكربت.</p>
            <a href="mailto:support@example.com?subject=مشكلة في رمز التفعيل" class="support-link">اتصل بالدعم</a>
        `;
    } else if (errorType === "naming") {
        notification.innerHTML = `
            <p>خطأ: النطاق الحالي غير مصرح به!</p>
            <p>هذا السكربت غير مسموح بتشغيله على <b>${window.location.hostname}</b>.</p>
            <a href="mailto:support@example.com?subject=مشكلة في النطاق" class="support-link">اتصل بالدعم</a>
        `;
    } else if (errorType === "firebase-init") {
        notification.innerHTML = `
            <p>خطأ فني: تعذر تهيئة خدمات الموقع!</p>
            <p>يرجى المحاولة لاحقاً أو التواصل مع الدعم.</p>
            <a href="mailto:support@example.com?subject=مشكلة في تهيئة Firebase" class="support-link">اتصل بالدعم</a>
        `;
    }

    // إضافة الأنماط إذا لم تكن موجودة بالفعل
    if (!document.getElementById('membership-protection-styles')) {
        const style = `
            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.7);
                z-index: 999;
                backdrop-filter: blur(5px);
                display: none; /* يتم التحكم بها بواسطة JS */
            }
            .notification-error {
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
                z-index: 1000;
                width: 80%;
                max-width: 500px;
                display: none; /* يتم التحكم بها بواسطة JS */
            }
            .support-link {
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
            .support-link:hover {
                background-color: #128c7e;
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translate(-50%, -60%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = style;
        styleSheet.id = 'membership-protection-styles'; // أضف ID لتجنب الإضافة المتكررة
        document.head.appendChild(styleSheet);
    }
}

function decryptBase64AES(base64Ciphertext, key) {
    if (!window.CryptoJS) {
        console.error("CryptoJS library is not loaded.");
        return null;
    }
    if (!base64Ciphertext || typeof base64Ciphertext !== 'string' || base64Ciphertext.trim() === "") {
        return null;
    }
    if (!key || typeof key !== 'string' || key === "") {
        return null;
    }

    try {
        const bytes = CryptoJS.enc.Base64.parse(base64Ciphertext);
        const ciphertext = bytes.toString(CryptoJS.enc.Utf8);

        const decrypted = CryptoJS.AES.decrypt(ciphertext, key);

        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

        const emptyPlaintextBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(""));
        if (plaintext === "" && base64Ciphertext.trim() !== emptyPlaintextBase64.trim()) {
            return null;
        }

        return plaintext;
    } catch (error) {
        console.error("Decryption failed in decryptBase64AES:", error);
        return null;
    }
}

function formatDate(timestampOrMillis) {
    if (!timestampOrMillis) return '';
    let date;
    if (typeof timestampOrMillis === 'number') date = new Date(timestampOrMillis);
    else if (typeof timestampOrMillis.toDate === 'function') date = timestampOrMillis.toDate(); // For Firestore Timestamps
    else return ''; // Invalid input type
    if (isNaN(date.getTime())) return ''; // Check for "Invalid Date"
    return date.toLocaleDateString('ar-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const localStorageUserKey = 'firebaseUserProfileData';

// These global variables will now be assigned AFTER the HTML is injected
let messageContainerGeneral;
let messageContainerEmailUnverified;

const messageHtmlStrings = {
    'not-logged-in': `<p class='mBox info'><b>معلومة!</b><br/> أهلاً بك! للوصول إلى هذا المحتوى الحصري، تحتاج إلى تسجيل الدخول. إذا لم يكن لديك حساب بعد، يمكنك إنشاء واحد بسرعة.<br/>يرجى <a href="/p/login.html">تسجيل الدخول هنا</a> لفحص بيانات حسابك وتحديد إمكانية الوصول.</p>`,
    'normal-account': `<p class='mBox wnote'><b>تنبيه!</b><br/> عذراً، هذا المحتوى حصري للمستخدمين أصحاب الحسابات المميزة (Premium).<br/>لن تتمكن من الوصول إليه بحسابك العادي. إذا كنت ترغب في الاشتراك في خدمة الحساب المميز والوصول إلى جميع المحتويات الحصرية، يرجى التواصل مع مدير الموقع لتفعيل حسابك على الباقة المتاحة.<br/>يمكنك التواصل معنا عبر <a href="https://wa.me/212722464243">[واتسآب]</a>.</p>`,
    'loading': `<p class='mBox outl'><b>جارٍ التحقق...</b><br/> جاري التحقق من حالة حسابك لتحديد إمكانية الوصول إلى المحتوى.</p>`,
    'expired': `<p class='mBox error'><b>انتهى الاشتراك!</b><br/> عذراً، اشتراكك المميز قد انتهى بتاريخ <span class="expiry-date-placeholder"></span>.<br/>يرجى التواصل مع مدير الموقع لتجديد اشتراكك.</p>`,
    'data-error': `<p class='mBox error'><b>خطأ فني!</b><br/> حدث خطأ أثناء جلب بيانات حسابك أو التحقق منها.<br/>يرجى المحاولة لاحقاً. إذا استمرت المشكلة، يرجى التواصل مع مدير الموقع.<br/>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير الموقع عبر <a href="https://wa.me/212722464243">[واتسآب]</a>.</p>`
};

// A function to get the message containers AFTER they are injected
function getMessageContainers() {
    // Only assign if they haven't been assigned yet (or if they became null for some reason)
    if (!messageContainerGeneral) {
        messageContainerGeneral = document.getElementById('mcG');
    }
    if (!messageContainerEmailUnverified) {
        messageContainerEmailUnverified = document.getElementById('mcE');
    }
}

function hideAllRestrictionContainers() {
    getMessageContainers(); // Ensure containers are retrieved
    if (messageContainerGeneral) messageContainerGeneral.style.display = 'none';
    if (messageContainerEmailUnverified) {
        messageContainerEmailUnverified.style.display = 'none';
        messageContainerEmailUnverified.querySelectorAll('.evPrompt, .evMsg').forEach(msg => msg.style.display = 'none');
    }
}

function showRestrictionMessage(reason, userData = null, user = null) {
    getMessageContainers(); // Ensure containers are retrieved
    // تأكد من عدم عرض رسالة التقييد إذا كانت رسالة الخطأ الشاملة معروضة (بسبب فشل التحقق من النطاق)
    const notificationVisible = document.querySelector(".notification-error") && document.querySelector(".notification-error").style.display !== 'none';
    if (notificationVisible) {
        console.log("Global error notification is active, suppressing restriction message.");
        return;
    }

    hideAllRestrictionContainers();

    if (reason === 'email-unverified') {
        if (messageContainerEmailUnverified) {
            messageContainerEmailUnverified.style.display = 'block';
            const emailPlaceholder = messageContainerEmailUnverified.querySelector('.email-placeholder');
            if (emailPlaceholder && user && user.email) emailPlaceholder.textContent = user.email;
            // عند عرض رسالة "البريد غير مؤكد"، أظهر الحالة الأولية (الطلب)
            showEmailVerificationStatus('prompt');
        }
    } else {
        const messageHtml = messageHtmlStrings[reason];
        if (messageContainerGeneral && messageHtml) {
            messageContainerGeneral.innerHTML = messageHtml;
            messageContainerGeneral.style.display = 'block';

            if (reason === 'expired') {
                const expiryDatePlaceholder = messageContainerGeneral.querySelector('.expiry-date-placeholder');
                if (expiryDatePlaceholder && userData && userData.premiumExpiry) {
                    expiryDatePlaceholder.textContent = formatDate(userData.premiumExpiry);
                }
            }
        }
    }
}

function showEmailVerificationStatus(status) {
    getMessageContainers();
    if (messageContainerEmailUnverified) {
        const promptContainer = messageContainerEmailUnverified.querySelector('.evPrompt');
        const resendLink = document.getElementById('resendEmailVerificationLink');
        const linkTextSpan = resendLink ? resendLink.querySelector('.link-text') : null;
        const spinnerSpan = resendLink ? resendLink.querySelector('.spinner') : null;
        const statusMessages = messageContainerEmailUnverified.querySelectorAll('.evMsg');

        // إخفاء جميع رسائل الحالة أولاً
        statusMessages.forEach(msg => msg.style.display = 'none');

        // إخفاء السبينر والنص افتراضيًا
        if (linkTextSpan) linkTextSpan.style.display = 'block';
        if (spinnerSpan) spinnerSpan.style.display = 'none';
        if (resendLink) resendLink.classList.remove('disabled'); // إزالة حالة التعطيل

        // تحديد ما يجب عرضه وتغيير نص الرابط
        let newLinkText = 'إعادة إرسال بريد التحقق';
        let enableLink = true;
        let showSpinner = false;
        let showPrompt = true; // افتراضيا عرض prompt

        if (status === 'evSend') {
            newLinkText = 'جاري الإرسال...';
            enableLink = false;
            showSpinner = true; // إظهار السبينر
            showPrompt = false;
            messageContainerEmailUnverified.querySelector('.evMsg.evSend').style.display = 'block';
        } else if (status === 'evSent') {
            newLinkText = 'تم إرسال بريد التفعيل';
            enableLink = false;
            showSpinner = false;
            showPrompt = false;
            messageContainerEmailUnverified.querySelector('.evMsg.evSent').style.display = 'block';
        } else if (status === 'evError') {
            newLinkText = 'حدث خطأ. حاول مرة أخرى';
            enableLink = true;
            showSpinner = false;
            showPrompt = false;
            messageContainerEmailUnverified.querySelector('.evMsg.evError').style.display = 'block';
        } else if (status === 'evVerified') {
            newLinkText = 'البريد مؤكد بالفعل!';
            enableLink = false;
            showSpinner = false;
            showPrompt = false;
            messageContainerEmailUnverified.querySelector('.evMsg.evVerified').style.display = 'block';
        }
        // إذا كانت الحالة 'prompt' أو أي شيء آخر غير محدد، ستظل القيم الافتراضية
        // مما يعني أن promptContainer سيبقى مرئياً مع النص الافتراضي للرابط.

        // تطبيق التغييرات على الرابط وعناصره
        if (linkTextSpan) linkTextSpan.textContent = newLinkText;
        if (spinnerSpan) spinnerSpan.style.display = showSpinner ? 'inline-block' : 'none';

        if (resendLink) {
            if (!enableLink) {
                resendLink.classList.add('disabled'); // إضافة الكلاس لتعطيل الرابط
            } else {
                resendLink.classList.remove('disabled');
            }
        }

        // التحكم في عرض الـ evPrompt
        if (promptContainer) {
            promptContainer.style.display = showPrompt ? 'block' : 'none';
        }

        isSendingEmailVerification = (status === 'evSend');
    }
}

async function updateProtectedContentDisplay(user, userDataFromSource) {
    const protectedElements = document.querySelectorAll('.protected-content');

    // إذا كانت رسالة الخطأ الشاملة معروضة، لا تفعل شيئًا للمحتوى المحمي
    const notificationVisible = document.querySelector(".notification-error") && document.querySelector(".notification-error").style.display !== 'none';
    if (notificationVisible) {
        protectedElements.forEach(element => element.style.display = 'none'); // إخفاء المحتوى المحمي
        return;
    }

    if (protectedElements.length === 0) {
        hideAllRestrictionContainers();
        return;
    }

    // IMPORTANT: Ensure containers are retrieved before using them
    getMessageContainers();
    if (!messageContainerGeneral || !messageContainerEmailUnverified) {
        console.error("Message containers (mcG or mcE) not found in the DOM. This might happen if they are injected dynamically and not available yet.");
        protectedElements.forEach(element => {
            element.innerHTML = "<p>Error loading content: Message containers not found.</p>";
            element.style.display = 'block';
        });
        return;
    }

    let userData = userDataFromSource;
    let canAccessContent = false;
    let restrictionReason = null;

    if (!user) {
        restrictionReason = 'not-logged-in';
    } else if (!userData) {
        restrictionReason = 'data-error';
    } else {
        if (userData.isAdmin === true) {
            canAccessContent = true;
        } else if (userData.accountType === 'premium') {
            let needsEmailVerificationCheck = true;

            // استثناء مقدمي الخدمات الاجتماعية من التحقق من البريد الإلكتروني
            if (user.providerData && user.providerData.length > 0) {
                const providerId = user.providerData[0].providerId;
                // قائمة بمقدمي الخدمات الذين لا يتطلبون التحقق من البريد الإلكتروني (مثلاً Google, Facebook)
                if (providerId === 'google.com' || providerId === 'facebook.com') { // أضف هنا أي مقدمي خدمة آخرين لا تحتاج للتحقق
                    needsEmailVerificationCheck = false;
                }
            }

            if (needsEmailVerificationCheck && !user.emailVerified) {
                restrictionReason = 'email-unverified';
            } else {
                if (userData.premiumExpiry !== null && userData.premiumExpiry !== undefined) {
                    const expiryDate = typeof userData.premiumExpiry === 'number' ? new Date(userData.premiumExpiry) : (userData.premiumExpiry.toDate ? userData.premiumExpiry.toDate() : null);

                    if (expiryDate && !isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
                        restrictionReason = 'expired';
                    } else {
                        canAccessContent = true;
                    }
                } else {
                    canAccessContent = true;
                }
            }
        } else {
            restrictionReason = 'normal-account';
        }
    }

    if (canAccessContent) {
        protectedElements.forEach(element => {
            element.classList.remove('loading', 'restricted');
            element.classList.add('decrypted');
            element.style.display = 'block';

            const base64Ciphertext = element.dataset.text;

            if (!base64Ciphertext) {
                element.innerHTML = "<p>محتوى غير متوفر (خطأ في التكوين الفني للصفحة).</p>";
                return;
            }

            const decryptedText = decryptBase64AES(base64Ciphertext, ARTICLE_ENCRYPTION_KEY);

            if (decryptedText !== null) {
                element.innerHTML = decryptedText;
            } else {
                element.innerHTML = "<p>تعذر فك تشفير المحتوى. (خطأ فني)</p><p>يرجى التحقق من مفتاح التشفير أو محتوى البيانات.</p>";
            }
        });

        hideAllRestrictionContainers();

    } else {
        protectedElements.forEach(element => {
            element.innerHTML = '';
            element.classList.add('restricted');
            element.classList.remove('loading', 'decrypted');
            element.style.display = 'none';
        });

        if (restrictionReason) {
            showRestrictionMessage(restrictionReason, userData, user);
        } else {
            showRestrictionMessage('data-error', userData, user);
        }
    }
}

function setupAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
        let cachedUserData = null;
        let isCacheValid = false;
        const storedData = localStorage.getItem(localStorageUserKey);

        // Ensure containers are retrieved at the start of the listener
        getMessageContainers();
        if (!messageContainerGeneral || !messageContainerEmailUnverified) {
            console.error("Message containers (mcG or mcE) not found on auth state change.");
            return;
        }

        if (user) {
            if (storedData) {
                try {
                    const parsedData = JSON.parse(storedData);
                    if (parsedData && typeof parsedData === 'object' && parsedData.uid && parsedData.uid === user.uid) {
                        cachedUserData = parsedData;
                        isCacheValid = true;
                    } else {
                        localStorage.removeItem(localStorageUserKey);
                    }
                } catch (e) {
                    console.error("Error parsing cached user data:", e);
                    localStorage.removeItem(localStorageUserKey);
                }
            }

            if (isCacheValid && cachedUserData) {
                await updateProtectedContentDisplay(user, cachedUserData);
            } else {
                showRestrictionMessage('loading', null, user);
                document.querySelectorAll('.protected-content').forEach(element => {
                    element.style.display = 'none';
                });
            }

            try {
                if (!db) {
                    console.error("Firestore DB not initialized.");
                    if (!isCacheValid) {
                        await updateProtectedContentDisplay(user, null);
                    }
                    return;
                }

                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                let latestUserData = null;
                if (userDoc.exists()) {
                    latestUserData = { ...userDoc.data(), uid: user.uid };
                    // localStorage.setItem(localStorageUserKey, JSON.stringify(latestUserData)); // Uncomment to update cache with latest data
                    await updateProtectedContentDisplay(user, latestUserData);
                } else {
                    console.warn(`User document not found in Firestore for UID: ${user.uid}`);
                    await updateProtectedContentDisplay(user, null);
                }
            } catch (error) {
                console.error("Error fetching user data from Firestore:", error);
                if (!isCacheValid) {
                    await updateProtectedContentDisplay(user, null);
                }
            }

        } else {
            try {
                localStorage.removeItem(localStorageUserKey);
            } catch(e) {
                console.error("Error clearing cached data on logout:", e);
            }
            updateProtectedContentDisplay(null, null);
        }
    });
}

async function sendEmailVerificationHandler() {
    if (isSendingEmailVerification) {
        console.warn("Email verification already in progress.");
        return;
    }

    const user = auth ? auth.currentUser : null;
    if (!user) {
        console.warn("sendEmailVerification called but no user is logged in.");
        showEmailVerificationStatus('evError');
        return;
    }

    isSendingEmailVerification = true; // تعيين True لبدء عملية الإرسال
    showEmailVerificationStatus('evSend'); // عرض رسالة "جاري إرسال بريد التفعيل..." وتحديث الرابط

    try {
        await user.reload();
        const updatedUser = auth.currentUser;

        if (updatedUser && updatedUser.emailVerified) {
            console.warn("Email is already verified. No need to resend.");
            showEmailVerificationStatus('evVerified');
            return;
        }

        await sendEmailVerification(user);
        console.log("Email verification link sent successfully.");
        showEmailVerificationStatus('evSent');
    } catch (error) {
        console.error("Error sending email verification:", error);
        showEmailVerificationStatus('evError');
    } finally {
        // isSendingEmailVerification يتم إعادة تعيينها في showEmailVerificationStatus
    }
}

function setupEmailVerificationResendListener() {
    getMessageContainers();
    const resendLink = document.getElementById('resendEmailVerificationLink');
    if (resendLink) {
        resendLink.addEventListener('click', (event) => {
            event.preventDefault();
            sendEmailVerificationHandler();
        });
        console.log("Email verification resend listener attached.");
    } else {
        console.warn("Email verification resend link not found in DOM.");
    }
}
