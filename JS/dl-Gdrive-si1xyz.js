/**
 * أداة تنزيل ملفات Google Drive المحسنة
 * تعمل مع العناصر الموجودة في HTML دون إضافة عناصر جديدة
 */

// --- 1. الحصول على الإعدادات من وسم السكريبت ---
function getScriptSettings() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        if (script.src.includes('https://cdn.siwane.xyz/JS/dl-Gdrive-si1xyz.js')) { 
            return {
                googleAppsScriptUrl: script.getAttribute('data-google-apps-script-url'),
                googleDriveFileId: script.getAttribute('data-google-drive-file-id')
            };
        }
    }
    console.error("لم يتم العثور على سمات الإعدادات في وسم السكريبت.");
    return null;
}

const settings = getScriptSettings();
if (!settings || !settings.googleAppsScriptUrl || !settings.googleDriveFileId) {
    console.error("إعدادات Google Apps Script URL أو Google Drive File ID مفقودة.");
    const errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = "خطأ في تهيئة الأداة. يرجى الاتصال بالدعم.";
        errorMessageElement.style.display = 'block';
    }
    throw new Error("Configuration Error: Missing Apps Script URL or Drive File ID.");
}

const GOOGLE_APPS_SCRIPT_URL = settings.googleAppsScriptUrl;
const GOOGLE_DRIVE_FILE_ID = settings.googleDriveFileId;

// --- 2. دوال مساعدة للتحقق من المصادقة ---
function getFirebaseUserData() {
    try {
        const userData = localStorage.getItem('firebaseUserProfileData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error("خطأ في قراءة بيانات المستخدم من localStorage:", error);
        return null;
    }
}

function validateProvider(providerData) {
    const supportedProviders = ['google.com', 'github.com', 'facebook.com', 'twitter.com'];
    
    if (!providerData || !providerData.providerId) {
        return { valid: false, reason: "مزود الخدمة غير محدد" };
    }
    
    const providerId = providerData.providerId.toLowerCase();
    const isSupported = supportedProviders.some(provider => providerId.includes(provider));
    
    if (!isSupported) {
        return { valid: false, reason: "مزود الخدمة غير مدعوم. المزودون المدعومون: Google, GitHub, Facebook, X (Twitter)" };
    }
    
    return { valid: true };
}

function validateEmail(email) {
    if (!email) {
        return { valid: false, reason: "البريد الإلكتروني غير محدد" };
    }
    
    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return { valid: false, reason: "يجب أن ينتهي البريد الإلكتروني بـ @gmail.com" };
    }
    
    return { valid: true };
}

// --- 3. دالة طلب الوصول والتنزيل ---
async function requestAccessAndDownload(userData) {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'requestAccess',
                fileId: GOOGLE_DRIVE_FILE_ID,
                userEmail: userData.email,
                userName: userData.displayName || userData.name || 'مستخدم غير معروف',
                providerId: userData.providerData?.[0]?.providerId || 'unknown'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log("تم منح الوصول بنجاح:", result);
            
            // تحديث رابط التنزيل
            const downloadLink = document.getElementById('downloadLink');
            if (downloadLink && result.downloadUrl) {
                downloadLink.href = result.downloadUrl;
                downloadLink.style.pointerEvents = 'auto';
                downloadLink.style.opacity = '1';
            }
            
            // إخفاء رسائل الخطأ
            hideAllMessages();
            
            return { success: true, downloadUrl: result.downloadUrl };
        } else {
            throw new Error(result.error || "فشل في منح الوصول");
        }
    } catch (error) {
        console.error("خطأ في طلب الوصول:", error);
        throw error;
    }
}

// --- 4. دوال إدارة الرسائل ---
function showMessage(elementId, message, show = true) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = show ? 'block' : 'none';
    }
}

function hideAllMessages() {
    const messageIds = ['errorMessage', 'loginRequirementMessage'];
    messageIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// --- 5. دالة التحقق الرئيسية ---
async function checkAndSetDownloadLink() {
    const errorMessageElement = document.getElementById('errorMessage');
    const loginRequirementElement = document.getElementById('loginRequirementMessage');
    const downloadLink = document.getElementById('downloadLink');
    
    // إخفاء جميع الرسائل في البداية
    hideAllMessages();
    
    // عرض رسالة التحميل
    showMessage('loginRequirementMessage', 'جاري التحقق من الصلاحيات...');
    
    try {
        const userData = getFirebaseUserData();
        
        if (!userData) {
            showMessage('loginRequirementMessage', 'للوصول إلى هذا الملف، يرجى التأكد من أنك سجلت الدخول بحساب Google.');
            showMessage('errorMessage', 'لم يتم تسجيل الدخول بعد.');
            
            // تعطيل رابط التنزيل
            if (downloadLink) {
                downloadLink.href = '#';
                downloadLink.style.pointerEvents = 'none';
                downloadLink.style.opacity = '0.5';
            }
            return;
        }
        
        console.log("بيانات المستخدم:", userData);
        
        // التحقق من مزود الخدمة
        const providerValidation = validateProvider(userData.providerData?.[0]);
        if (!providerValidation.valid) {
            showMessage('errorMessage', providerValidation.reason);
            if (downloadLink) {
                downloadLink.href = '#';
                downloadLink.style.pointerEvents = 'none';
                downloadLink.style.opacity = '0.5';
            }
            return;
        }
        
        // التحقق من البريد الإلكتروني
        const emailValidation = validateEmail(userData.email);
        if (!emailValidation.valid) {
            showMessage('errorMessage', emailValidation.reason);
            if (downloadLink) {
                downloadLink.href = '#';
                downloadLink.style.pointerEvents = 'none';
                downloadLink.style.opacity = '0.5';
            }
            return;
        }
        
        // طلب الوصول والحصول على رابط التنزيل
        const accessResult = await requestAccessAndDownload(userData);
        
        if (accessResult.success) {
            console.log("تم تفعيل رابط التنزيل بنجاح");
            // تم تحديث الرابط في دالة requestAccessAndDownload
        }
        
    } catch (error) {
        console.error("خطأ في التحقق من الصلاحيات:", error);
        showMessage('errorMessage', 'حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى.');
        
        if (downloadLink) {
            downloadLink.href = '#';
            downloadLink.style.pointerEvents = 'none';
            downloadLink.style.opacity = '0.5';
        }
    }
}

// --- 6. دالة إعادة المحاولة ---
function retryDownload() {
    console.log("إعادة محاولة التحقق من الصلاحيات...");
    checkAndSetDownloadLink();
}

// --- 7. تصدير الدوال للاستخدام العام ---
window.GDriveDownloader = {
    retryDownload: retryDownload,
    checkAndSetDownloadLink: checkAndSetDownloadLink
};

// --- 8. تشغيل التحقق عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', () => {
    // تعيين قيمة data-text إلى محتوى العنصر fT
    const fTElement = document.querySelector('.fT');
    if (fTElement && fTElement.dataset.text) {
        fTElement.textContent = fTElement.dataset.text.toUpperCase();
    }
    
    // بدء التحقق من الصلاحيات
    checkAndSetDownloadLink();
});

// --- 9. معالجة الأخطاء العامة ---
window.addEventListener('error', function(e) {
    console.error('خطأ عام في الصفحة:', e.error);
    showMessage('errorMessage', 'حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('خطأ غير معالج في Promise:', e.reason);
    showMessage('errorMessage', 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
});

