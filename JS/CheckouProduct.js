
    // لا نحتاج customBank هنا، سيتم تحديد طرق الدفع في صفحة Checkout
    // var customBank = ['Paypal', 'CIH BANK'];

    // إضافة حدث النقر لزر "اشتري الآن"
    document.getElementById('buyNowButton').addEventListener('click', function() {
        // *** **** الحصول على postId من السمة data-id للعنصر <article> الأقرب **** ****
        // نبدأ من العنصر الحاوي fastCheckoutPost ونصعد في شجرة DOM للعثور على أقرب <article>
        const fastCheckoutPostDiv = document.querySelector('.fastCheckoutPost');
        // نستخدم .closest() للعثور على العنصر الأب أو النفس المطابق للمحدد 'article.ps.post'
        const articleElement = fastCheckoutPostDiv ? fastCheckoutPostDiv.closest('article.ps.post') : null;

        // نقرأ قيمة السمة data-id من عنصر المقال الذي وجدناه
        const postId = articleElement ? articleElement.getAttribute('data-id') : null;
        console.log("Attempting to read Post ID from article data-id:", postId); // سجل القيمة التي تم قراءتها
        // *******************************************************************

        // نحصل على قيمة رابط الموقع من حقل الإدخال
        const websiteLinkInput = document.getElementById('websiteLinkInput');
        const websiteLink = websiteLinkInput ? websiteLinkInput.value : '';

        // نحصل على قيمة ونص الخيار المختار من قائمة التحديد
        const packageSelect = document.getElementById('select-package');
        const selectedPackageValue = packageSelect ? packageSelect.value : null; // القيمة الرقمية للسعر (ستكون نصية من قيمة الـ option)
        const selectedPackageText = packageSelect && packageSelect.options[packageSelect.selectedIndex] ? packageSelect.options[packageSelect.selectedIndex].text : ''; // نص الخيار


        // **** جمع بيانات المنتج الإضافية (اسم المنتج، عنوان المقال، رابط المقال، التصنيف) ****

        // 1. رابط صفحة مقال المنتج هو ببساطة URL الصفحة الحالية
        const articleLink = window.location.href;
        console.log("Collected Article Link:", articleLink);

        // 2. عنوان مقال المنتج (نحاول العثور على أول h1، وإذا لم نجد نستخدم عنوان الصفحة)
        let articleTitle = document.title; // الافتراضي هو عنوان الصفحة
        const h1Element = document.querySelector('h1');
        if (h1Element && h1Element.textContent.trim() !== '') {
            articleTitle = h1Element.textContent.trim();
        }
        console.log("Collected Article Title:", articleTitle);


        // 3. اسم المنتج (افتراض: أول h2 داخل عنصر المقال الأقرب، وإذا لم نجد نستخدم عنوان المقال كبديل)
        let productName = articleTitle; // الافتراضي هو عنوان المقال
        if (articleElement) { // إذا وجدنا عنصر المقال الأب
             const h2Element = articleElement.querySelector('h2'); // ابحث عن h2 داخله
            if (h2Element && h2Element.textContent.trim() !== '') {
                productName = h2Element.textContent.trim();
            } else {
                 console.warn("Could not find an H2 inside the article element for Product Name, falling back to Article Title.");
            }
        } else {
             console.warn("Could not find the closest article element. Product Name defaults to Article Title.");
        }
         console.log("Collected Product Name (based on assumption):", productName);


        // **** 4. COLLECT CATEGORY (ASSUMPTION - ADJUST AS NEEDED FOR YOUR TEMPLATE) ****
        // !!! هام: تحتاج إلى تعديل السطور التالية بناءً على كيفية توفير التصنيف في قالب بلوجر الخاص بك.
        // طرق شائعة للحصول على التصنيف:
        // - سمة data على عنصر المقال: articleElement.getAttribute('data-category')
        // - سمة data على div الحاوي fastCheckoutPost: fastCheckoutPostDiv.getAttribute('data-category')
        // - وسم meta مخصص: document.querySelector('meta[name="category"]') ? document.querySelector('meta[name="category"]').content : null;
        // - محتوى نصي لعنصر معين له فئة معروفة (مثلاً، رابط التصنيف)
        let category = null; // القيمة الافتراضية إذا لم يتم العثور على التصنيف

        // محاولة القراءة من سمة data-category على عنصر المقال
        if (articleElement) {
            category = articleElement.getAttribute('data-category');
            console.log("Attempted to read Category from article data-category:", category);
        }

        // إذا لم يتم العثور عليه، محاولة القراءة من سمة data-category على div الحاوي
        if (!category && fastCheckoutPostDiv) {
             category = fastCheckoutPostDiv.getAttribute('data-category');
             console.log("Attempted to read Category from fastCheckoutPost data-category:", category);
        }

        // إذا لم يتم العثور عليه، محاولة القراءة من وسم meta
        if (!category) {
           const categoryMetaTag = document.querySelector('meta[name="category"]');
           if (categoryMetaTag) {
              category = categoryMetaTag.content;
              console.log("Attempted to read Category from meta tag:", category);
           }
        }

        // القيمة النهائية إذا لم يتم العثور على التصنيف بعد كل المحاولات
        if (!category || category.trim() === '') {
           console.warn("Product Category could not be found using common methods or is empty. It will be sent as 'غير متوفر'.");
           category = 'غير متوفر'; // استخدم قيمة افتراضية إذا لم يتم العثور على التصنيف أو كان فارغاً
        } else {
             // لإزالة أي مسافات بيضاء زائدة إذا تم العثور عليه
             category = category.trim();
        }

        // ***************************************************************************


        // التحقق من أن حقل رابط الموقع مملوء إذا كان مطلوبا&#1611;
        if (websiteLinkInput && websiteLinkInput.required && websiteLink.trim() === '') {
            alert(websiteLinkInput.placeholder + ' مطلوب.');
            websiteLinkInput.focus();
            return; // إيقاف العملية
        }

        // *** التحقق من البيانات الأساسية التي سنحتاج لحفظها ***
        // تم تعديل التحقق ليشمل التصنيف إذا كنت تعتبره مطلوباً
         if (!postId || postId.includes('<data:post.id') || selectedPackageValue == null || !selectedPackageText ||
             !productName || !articleTitle || !articleLink // البيانات القديمة
             // إذا كان التصنيف مطلوباً دائماً، قم بإلغاء التعليق عن السطر التالي:
             // || !category // <-- Add category to validation check if mandatory
         ) {
             console.error("Missing or invalid essential product details before saving to sessionStorage:", { postId, websiteLink, selectedPackageValue, selectedPackageText, productName, articleTitle, articleLink, category });
             alert("حدث خطأ داخلي في جمع تفاصيل المنتج المطلوبة. يرجى المحاولة مرة أخرى. (Error Code: DATA_MISSING_ESSENTIAL)"); // رسالة خطأ محدثة
             return; // إيقاف إذا كانت البيانات ناقصة
         }


        // --- الجزء الذي يتطلب فحص تسجيل الدخول من الخادم ---
        // هذه الدالة يجب أن تتفاعل مع نظام المستخدمين الخاص بمنصتك
        checkUserLoginStatus(function(isLoggedIn) {
            if (!isLoggedIn) {
                // عرض رسالة الخطأ للمستخدم
                const loginMessageDiv = document.getElementById('loginRequiredMessage');
                if(loginMessageDiv) loginMessageDiv.style.display = 'block';
                // يمكنك هنا إعادة توجيه المستخدم لصفحة تسجيل الدخول بعد فترة قصيرة
                 setTimeout(() => { window.location.href = '/p/login.html'; }, 2000);
            } else {
                // إخفاء رسالة الخطأ إذا كانت ظاهرة
                 const loginMessageDiv = document.getElementById('loginRequiredMessage');
                 if(loginMessageDiv) loginMessageDiv.style.display = 'none';


                // *** 1. جمع البيانات في كائن - تم إضافة الحقول الجديدة هنا (بما في ذلك التصنيف) ***
                const orderDetails = {
                    postId: postId, // هذه القيمة يجب أن تكون الآن الـ ID الحقيقي من <article>
                    websiteLink: websiteLink,
                    packageValue: selectedPackageValue, // نمررها كما هي (كنص) ليتم تحويلها في صفحة الدفع
                    packageText: selectedPackageText,
                    // **** إضافة بيانات المنتج الجديدة إلى الكائن (بما في ذلك التصنيف) ****
                    productName: productName,
                    category: category, // <-- إضافة التصنيف هنا
                    articleTitle: articleTitle,
                    articleLink: articleLink
                    // *********************************************
                };

                // *** 2. حفظ البيانات في sessionStorage ***
                try {
                    const orderDetailsJson = JSON.stringify(orderDetails);
                    // نستخدم المفتاح 'checkoutOrderDetails' كما حددنا لصفحة الدفع لقراءته منه
                    sessionStorage.setItem('checkoutOrderDetails', orderDetailsJson);
                    console.log("Order details saved to sessionStorage:", orderDetails); // سجل الكائن بما في ذلك التصنيف

                    // *** 3. إعادة التوجيه إلى صفحة Checkout باستخدام الرابط القصير ***
                    // لا نمرر URL Parameters هنا، لأن البيانات في sessionStorage
                    window.location.href = '/p/checkout.html';

                } catch (e) {
                    console.error("Error saving order details to sessionStorage or navigating:", e);
                    alert("حدث خطأ أثناء إعداد عملية الدفع. يرجى المحاولة مرة أخرى.");
                }
            }
        });
    });

    // --- دالة وهمية لفحص تسجيل الدخول (تحتاج تطبيق حقيقي على الخادم) ---
    // يجب استبدال هذه الدالة باستدعاء حقيقي لنظام المستخدمين الخاص بمنصتك
    function checkUserLoginStatus(callback) {
        console.log("Checking login status (requires backend)...");
        // مثال: استدعاء Fetch API لنقطة نهاية على خادمك تتحقق من تسجيل الدخول
        
        fetch('/api/is-user-logged-in')
            .then(response => response.json())
            .then(data => {
                callback(data.isLoggedIn); // يفترض أن الـ API يرد بـ { isLoggedIn: true/false }
            })
            .catch(error => {
                console.error('Error checking login status:', error);
                callback(false); // نفترض عدم تسجيل الدخول في حالة الخطأ
            });
        

        // لأغراض العرض، نفترض أن المستخدم مسجل الدخول دائما
        setTimeout(() => {
             console.log("User is assumed logged in (for demo purposes).");
             callback(true); // قم بتغيير هذا إلى false لاختبار رسالة عدم تسجيل الدخول
        }, 100); // تأخير بسيط لمحاكاة طلب شبكة
    }


