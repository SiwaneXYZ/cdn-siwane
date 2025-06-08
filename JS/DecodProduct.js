document.addEventListener('DOMContentLoaded', function () {
    // تعريف معرف المشاركة من العنصر article
    var articleElement = document.querySelector('article.ntry.ps.post');
    var postId = articleElement ? articleElement.getAttribute('data-id') : null;

    // التحقق من وجود postId
    if (!postId) {
        console.error('معرف المشاركة غير موجود.');
        return;
    }

    // التحقق من النطاق
    var userMeta = document.querySelector('meta[property="og:url"]');
    if (!userMeta) {
        console.error('لم يتم العثور على عنصر meta الخاص بـ og:url');
        return;
    }

    var mContent = userMeta.getAttribute('content');
    var splitmContent = mContent.split('://')[1].split('/')[0];
    var expectedDomain = 'www.siwane.xyz';

    if (splitmContent !== expectedDomain) {
        window.location.reload();
        return;
    }

    // التحقق من تسجيل الدخول باستخدام المفتاح الجديد
    var userData = localStorage.getItem('firebaseUserProfileData');
    if (!userData) {
        displayError(`
            <p class='note wr'>
                <strong>لم تسجل الدخول بعد.</strong><br />
                 يجب عليك <a href='/p/login.html'>تسجيل الدخول</a> لفحص البيانات و تحليلها ادا كانت لديك صلاحية الوصول للمنتج.
            </p>
        `);
        return;
    }

    var user = JSON.parse(userData);
    var email = user.email;
    var isAdmin = user.isAdmin; // الحصول على قيمة isAdmin من بيانات المستخدم
    var usrPswKey = 'Rawan05@*#$'; // مفتاح التشفير
    var url = 'https://script.google.com/macros/s/AKfycbxM-2JZWsDwG-Qdf0e_CVClR42hBkHarq-xPD9U2ImA75qOufdvntQAUJcTJIPfJhkZ0g/exec';

    // طباعة بيانات البريد الإلكتروني ومعرف المقالة للتحقق
    console.log('البريد الإلكتروني للمستخدم:', email);
    console.log('معرف المقالة:', postId);
    console.log('هل المستخدم مشرف؟', isAdmin); // طباعة قيمة isAdmin للتحقق

    // --- إضافة الشرط الجديد هنا ---
    if (isAdmin) {
        // إذا كان المستخدم مشرفًا، اعرض المحتوى مباشرةً
        console.log('المستخدم مشرف، يتم عرض المحتوى مباشرةً.');
        // هنا يمكنك تمرير أي بيانات "وهمية" أو استخدام طريقة أخرى لجلب المحتوى
        // بناءً على سياق تطبيقك. في هذا المثال، سنقوم بفك تشفير المحتوى مباشرةً.
        // تأكد أن displayArticle يمكنها التعامل مع هذه الحالة.
        displayArticle({}, usrPswKey); // نمرر كائنًا فارغًا لأننا لا نحتاج بيانات المنتج هنا
        return; // توقف عن تنفيذ بقية الكود
    }
    // --- نهاية الإضافة ---

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`خطأ في الشبكة: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('البيانات المستلمة:', data); // طباعة البيانات المستلمة للتحقق

            // تصفية البيانات لجلب فقط em و ad
            var userProducts = data.filter(u => u.em && u.ad); // التحقق من وجود em و ad فقط

            console.log("المنتجات الخاصة بالمستخدم:", userProducts); // طباعة المنتجات الخاصة بالمستخدم

            // البحث عن المنتج المطابق للبريد الإلكتروني ومعرف المقالة
            var matchingProduct = userProducts.find(u => {
                var decryptedAd, decodedEmail;

                // فك تشفير ad
                try {
                    decryptedAd = CryptoJS.AES.decrypt(u.ad, usrPswKey).toString(CryptoJS.enc.Utf8);
                } catch (error) {
                    console.error('فشل في فك تشفير معرّف المنتج:', error);
                    return false;
                }

                // فك تشفير البريد الإلكتروني
                try {
                    decodedEmail = decodeEmail(u.em);
                } catch (error) {
                    console.error('فشل في فك تشفير البريد الإلكتروني:', error);
                    return false;
                }

                return decodedEmail === email && decryptedAd === postId;
            });

            if (matchingProduct) {
                displayArticle(matchingProduct, usrPswKey);
            } else {
                displayError(`
                    <p class='note wr'>
                        <strong>ليس لديك صلاحية للوصول إلى هذه المقالة.</strong><br />
                        يرجى <a href='https://www.siwane.xyz/search/label/منتجاتي'>شراء المنتج</a> للوصول إلى المحتوى.
                    </p>
                `);
            }
        })
        .catch(error => {
            console.error('خطأ في جلب البيانات:', error);
            displayError('حدث خطأ أثناء جلب بياناتك. يرجى المحاولة لاحقًا.');
        });


    function decodeEmail(encoded) {
        return atob(encoded).toLowerCase();
    }

    function displayArticle(product, key) {
        // فك تشفير محتوى المقالة المخزن في data-text
        var encryptedContentElement = document.getElementById('encryptedContent');
        if (!encryptedContentElement) {
            console.error('العنصر #encryptedContent غير موجود.');
            displayError('حدث خطأ: لا يمكن العثور على محتوى المقالة المشفر.');
            return;
        }

        var encryptedContentBase64 = encryptedContentElement.getAttribute('data-text').trim();
        if (!encryptedContentBase64) {
            console.error('خاصية data-text فارغة أو غير موجودة في #encryptedContent.');
            displayError('حدث خطأ: محتوى المقالة المشفر فارغ.');
            return;
        }

        // تحويل النص من Base64 إلى نص مشفر
        var encryptedContent = atob(encryptedContentBase64); // تحويل Base64 إلى نص مشفر
        var decryptedContent = CryptoJS.AES.decrypt(encryptedContent, key).toString(CryptoJS.enc.Utf8);

        if (decryptedContent) {
            // عرض المحتوى
            document.getElementById('articleContent').innerHTML = decryptedContent;
            document.getElementById('articleContent').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        } else {
            displayError('فشل في فك تشفير المحتوى.');
        }
    }

    function displayError(message) {
        document.getElementById('loading').innerHTML = message;
    }
});
