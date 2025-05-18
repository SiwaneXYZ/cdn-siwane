// --- Configuration: localStorage Keys and Points Page URL ---
// تأكد أن هذه المفاتيح تتطابق تمامًا مع المفاتيح المستخدمة في سكربت صفحة النقاط
const articleQuizConfig = {
    pointsPageUrl: '/p/points-6.html', // !!! عنوان URL الفعلي لصفحة النقاط الخاصة بك !!!
    localStorageKeys: {
        quizFlowStarted: 'articleQuizFlowStarted',
        currentQuizArticleId: 'currentQuizArticleId',
        quizCompletionSignal: 'quizCompletionSignal',
        completedArticleId: 'completedArticleId',
        // include old keys for robust cleanup if necessary
        oldFlowStarted: 'articlePointsFlow',
        oldStartTime: 'articleStartTime',
        oldCompleted: 'articleCompleted'
    },
    quizContainerId: 'quiz-container', // !!! ID العنصر في HTML المقال الذي سيتم عرض الاختبار بداخله !!!
    quizDataPrefix: 'quiz-data-post-' // !!! البادئة لـ ID العنصر الذي يحتوي على بيانات الاختبار في HTML المقال (يتبعها معرف المقال) !!!
};

// --- Helper Function to Clear Quiz Flow Start Flags ---
// هذه الدالة تمسح العلامات التي تشير إلى أن المستخدم بدأ عملية الاختبار (يتم استدعاؤها عند النجاح أو الفشل أو الخروج المبكر)
function clearQuizStartFlags() {
    console.log("Article Script (Quiz Flow): Clearing quiz start localStorage flags.");
    try {
        localStorage.removeItem(articleQuizConfig.localStorageKeys.quizFlowStarted);
        localStorage.removeItem(articleQuizConfig.localStorageKeys.currentQuizArticleId);
        // Clear old flow start flags for robust cleanup just in case
        localStorage.removeItem(articleQuizConfig.localStorageKeys.oldFlowStarted);
        localStorage.removeItem(articleQuizConfig.localStorageKeys.oldStartTime);
        console.log("Article Script (Quiz Flow): Quiz start flags cleared.");
    } catch(e) {
        console.error("Article Script (Quiz Flow): Error clearing quiz start flags:", e);
    }
}

// --- Helper Function to Clear ALL relevant Article-related Flags ---
// تستخدم لتنظيف شامل إذا لزم الأمر (مثل على الزيارات العادية لتنظيف البقايا)
function clearAllArticleRelatedFlags() {
     console.log("Article Script: Clearing ALL relevant article localStorage flags.");
      try {
          for (const key in articleQuizConfig.localStorageKeys) {
              localStorage.removeItem(articleQuizConfig.localStorageKeys[key]);
          }
          console.log("Article Script: ALL relevant article localStorage flags cleared.");
      } catch(e) {
          console.error("Article Script: Error clearing ALL relevant article localStorage flags:", e);
      }
}


// --- Helper Function to Render Quiz UI ---
// تقوم ببناء واجهة الاختبار (النموذج، الأسئلة، الخيارات، زر الإرسال) وإضافتها إلى العنصر الحاوية
function renderQuiz(quizDefinition, containerElement, articleId) {
    console.log("Article Script (Quiz Flow): Rendering quiz UI.");
    containerElement.innerHTML = '<h3>اختبار فهم المقال</h3><p>أجب عن الأسئلة التالية المتعلقة بالمقال الذي قرأته لكسب نقطتك.</p>';

    const quizForm = document.createElement('form');
    quizForm.id = 'article-quiz-form'; // ID لنموذج الاختبار

    // بناء الأسئلة والخيارات بناءً على بيانات الاختبار
    quizDefinition.questions.forEach((q, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('quiz-question'); // كلاس لتقسيم الأسئلة
        questionDiv.style.marginBottom = '15px';

        const questionText = document.createElement('p');
        questionText.textContent = `${qIndex + 1}. ${q.text}`; // رقم السؤال ونص السؤال
        questionText.style.fontWeight = 'bold';
        questionDiv.appendChild(questionText);

        const optionsList = document.createElement('div');
        optionsList.classList.add('quiz-options');

        q.options.forEach((option, oIndex) => {
            const optionId = `q${qIndex}-opt${oIndex}`; // ID فريد لكل خيار
            const optionLabel = document.createElement('label');
            optionLabel.style.display = 'block';
            optionLabel.style.marginBottom = '5px';

            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `question-${qIndex}`; // اسم موحد لكل خيارات نفس السؤال
            optionInput.value = oIndex; // قيمة الخيار (موقعه في المصفوفة)
            optionInput.required = true; // جعل الإجابة على السؤال إلزامية
            optionInput.style.marginInlineEnd = '10px';

            const optionText = document.createTextNode(option); // نص الخيار

            optionLabel.appendChild(optionInput);
            optionLabel.appendChild(optionText);
            optionsList.appendChild(optionLabel);
        });
        questionDiv.appendChild(optionsList);
        quizForm.appendChild(questionDiv);
    });

    // زر إرسال الإجابات
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'إرسال الإجابات والحصول على النقطة';
    // أضف هنا كلاسات CSS لتنسيق الزر بناءً على تصميم موقعك
    // submitButton.classList.add('btn', 'btn-primary');
    submitButton.style.marginTop = '20px';
    submitButton.style.padding = '10px 15px';
    submitButton.style.backgroundColor = '#28a745'; // لون أخضر افتراضي
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = 'pointer';


    quizForm.appendChild(submitButton);
    containerElement.appendChild(quizForm);

    // --- Add Event Listener for Quiz Submission ---
    // معالجة إرسال النموذج والتحقق من الإجابات
    quizForm.addEventListener('submit', (event) => {
        event.preventDefault(); // منع إرسال النموذج بالطريقة التقليدية

        console.log("Article Script (Quiz Flow): Quiz form submitted. Checking answers.");

        let correctAnswersCount = 0;
        let allQuestionsAnswered = true;

        // التحقق من إجابات المستخدم مقارنة بالبيانات
        quizDefinition.questions.forEach((q, qIndex) => {
            const selectedOption = quizForm.querySelector(`input[name="question-${qIndex}"]:checked`);

            if (selectedOption) {
                const userAnswerIndex = parseInt(selectedOption.value);
                if (userAnswerIndex === q.correct) { // مقارنة بالإجابة الصحيحة من بيانات الاختبار
                    correctAnswersCount++;
                }
            } else {
                allQuestionsAnswered = false; // هناك سؤال لم يتم الإجابة عليه
            }
        });

        // التحقق مما إذا تم الإجابة على جميع الأسئلة
        if (!allAnswered) {
            // البحث عن أي رسالة خطأ سابقة وإزالتها لتجنب التكرار
            const existingErrorMessage = quizForm.querySelector('.quiz-error-message');
            if(existingErrorMessage) existingErrorMessage.remove();

            const errorMessage = document.createElement('p');
            errorMessage.classList.add('quiz-error-message'); // أضف كلاس لتحديدها لاحقًا
            errorMessage.style.color = 'orange';
            errorMessage.textContent = "الرجاء الإجابة على جميع الأسئلة قبل الإرسال.";
            quizForm.insertBefore(errorMessage, submitButton); // ضع الرسالة قبل زر الإرسال

            console.warn("Article Script (Quiz Flow): User did not answer all questions.");
            return; // إيقاف العملية
        } else {
             // إزالة أي رسالة خطأ سابقة إذا تم الإجابة على الكل الآن
             const existingErrorMessage = quizForm.querySelector('.quiz-error-message');
             if(existingErrorMessage) existingErrorMessage.remove();
        }


        // التحقق مما إذا اجتاز المستخدم الاختبار بناءً على عدد الإجابات الصحيحة والحد الأدنى المطلوب
        if (correctAnswersCount >= quizDefinition.pass_threshold) {
            console.log(`Article Script (Quiz Flow): Quiz passed! Correct answers: ${correctAnswersCount}/${quizDefinition.questions.length}. Required: ${quizDefinition.pass_threshold}`);

            // --- إجراءات النجاح ---
            try {
                // تعيين علامات الإكمال في localStorage لتستقبلها صفحة النقاط
                localStorage.setItem(articleQuizConfig.localStorageKeys.quizCompletionSignal, 'true');
                localStorage.setItem(articleQuizConfig.localStorageKeys.completedArticleId, articleId); // تخزين معرف المقال الذي تم اجتيازه

                // مسح علامات البدء من localStorage
                clearQuizStartFlags();

                console.log(`Article Script (Quiz Flow): localStorage set: ${articleQuizConfig.localStorageKeys.quizCompletionSignal}='true', ${articleQuizConfig.localStorageKeys.completedArticleId}='${articleId}'. Start flags cleared.`);
                // ملاحظة: صفحة النقاط هي المسؤولة عن قراءة علامات الإكمال هذه ومسحها بعد منح النقطة.

                // تحديث الواجهة وإعادة التوجيه
                containerElement.innerHTML = '<p style="color: green; font-weight: bold;">تهانينا! لقد اجتزت الاختبار بنجاح.</p><p>سيتم منحك النقطة عند عودتك لصفحة النقاط.</p>';

                 // خيار: إعادة التوجيه تلقائياً بعد بضع ثوانٍ
                 console.log("Article Script (Quiz Flow): Redirecting to points page in 3 seconds...");
                 setTimeout(() => {
                      window.location.href = articleQuizConfig.pointsPageUrl;
                 }, 3000);

                 // أو خيار: عرض زر للعودة بدل إعادة التوجيه التلقائي
                 /*
                 const returnButton = document.createElement('a');
                 returnButton.href = articleQuizConfig.pointsPageUrl;
                 returnButton.textContent = 'العودة إلى صفحة النقاط';
                 returnButton.style.marginTop = '20px'; returnButton.style.padding = '10px 15px';
                 returnButton.style.backgroundColor = '#28a745'; returnButton.style.color = 'white';
                 returnButton.style.border = 'none'; returnButton.style.borderRadius = '5px';
                 returnButton.style.textDecoration = 'none'; returnButton.style.display = 'inline-block';
                 containerElement.appendChild(returnButton);
                 */


            } catch(e) {
                 console.error("Article Script (Quiz Flow): Error setting completion flags or redirecting after pass:", e);
                 containerElement.innerHTML += `<p style="color: red; font-weight: bold;">حدث خطأ فني في تسجيل إكمال الاختبار. يرجى محاولة العودة لصفحة النقاط يدوياً.</p>`;
                 // عرض زر للعودة يدوياً في حالة الخطأ
                 const returnButton = document.createElement('a');
                 returnButton.href = articleQuizConfig.pointsPageUrl;
                 returnButton.textContent = 'العودة إلى صفحة النقاط';
                 returnButton.style.marginTop = '20px'; returnButton.style.padding = '10px 15px';
                 returnButton.style.backgroundColor = '#dc3545'; returnButton.style.color = 'white';
                 returnButton.style.border = 'none'; returnButton.style.borderRadius = '5px';
                 returnButton.style.textDecoration = 'none'; returnButton.style.display = 'inline-block';
                 containerElement.appendChild(returnButton);
                 // clearQuizStartFlags(); // لا نمسح علامات البدء هنا إذا كان هناك خطأ في التسجيل، ربما يحتاج المستخدم لإعادة المحاولة من صفحة النقاط
            }


        } else {
            // --- إجراءات الفشل ---
            console.log(`Article Script (Quiz Flow): Quiz failed. Correct answers: ${correctAnswersCount}/${quizDefinition.questions.length}. Required: ${quizDefinition.pass_threshold}`);
            containerElement.innerHTML = '<p style="color: red; font-weight: bold;">للأسف، لم تجتز الاختبار.</p><p>الرجاء قراءة المقال بعناية أكبر ومحاولة كسب نقطة مرة أخرى من صفحة النقاط (سيكون هناك مقال آخر).</p>';

            // مسح علامات البدء حتى لا يعلق المستخدم في محاولة الاختبار لهذا المقال
            clearQuizStartFlags();

            // عرض زر للعودة
             const returnButton = document.createElement('a');
            returnButton.href = articleQuizConfig.pointsPageUrl;
            returnButton.textContent = 'العودة إلى صفحة النقاط';
            // أضف كلاسات لتنسيق الزر
             returnButton.style.marginTop = '20px'; returnButton.style.padding = '10px 15px';
             returnButton.style.backgroundColor = '#dc3545'; returnButton.style.color = 'white';
             returnButton.style.border = 'none'; returnButton.style.borderRadius = '5px';
             returnButton.style.textDecoration = 'none'; returnButton.style.display = 'inline-block';
            containerElement.appendChild(returnButton);
        }
    });
}


// ==============================================================
// Main Script Execution on DOMContentLoaded
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Article Script: DOMContentLoaded fired.");

    // --- التحقق مما إذا كان المستخدم جاء من صفحة النقاط لعمل اختبار ---
    const quizFlowStarted = localStorage.getItem(articleQuizConfig.localStorageKeys.quizFlowStarted) === 'true';
    const currentQuizArticleId = localStorage.getItem(articleQuizConfig.localStorageKeys.currentQuizArticleId); // نحتاجه لجلب بيانات الاختبار

    console.log("Article Script: Checking localStorage for quiz flow flags:", {
        quizFlowStarted: quizFlowStarted,
        currentQuizArticleId: currentQuizArticleId
    });

    if (quizFlowStarted && currentQuizArticleId) {
        console.log(`Article Script: Quiz flow detected for article ID: ${currentQuizArticleId}.`);

        // *** العثور على العنصر الذي سيتم عرض الاختبار بداخله ***
        const quizContainer = document.getElementById(articleQuizConfig.quizContainerId);

        // *** العثور على العنصر الذي يحتوي على بيانات الاختبار لهذا المقال المحدد ***
        const quizDataElement = document.getElementById(articleQuizConfig.quizDataPrefix + currentQuizArticleId);


        if (!quizContainer) {
             console.error(`Article Script: Quiz container element with ID '${articleQuizConfig.quizContainerId}' not found in the HTML. Cannot display quiz or error message.`);
             // لا يمكن عرض رسالة خطأ للمستخدم إذا لم يتم العثور على الحاوية
             // فقط نقوم بالتسجيل ومسح علامات البدء لمنع تعليق المستخدم في التدفق
             clearQuizStartFlags();
             return; // إيقاف التنفيذ
        }

        // --- إذا تم العثور على الحاوية، نتحقق من بيانات الاختبار ---
        if (!quizDataElement) {
            console.error(`Article Script: Quiz data element with ID '${articleQuizConfig.quizDataPrefix + currentQuizArticleId}' not found in the HTML.`);
            // عرض رسالة خطأ للمستخدم في الحاوية المخصصة
            quizContainer.innerHTML = '<p style="color: red; font-weight: bold;">حدث خطأ: تعذر العثور على بيانات الاختبار لهذا المقال. يرجى العودة لصفحة النقاط والمحاولة مرة أخرى.</p>';
            // عرض زر العودة
             const returnButton = document.createElement('a');
             returnButton.href = articleQuizConfig.pointsPageUrl;
             returnButton.textContent = 'العودة إلى صفحة النقاط';
             returnButton.style.marginTop = '20px'; returnButton.style.padding = '10px 15px';
             returnButton.style.backgroundColor = '#dc3545'; returnButton.style.color = 'white';
             returnButton.style.border = 'none'; returnButton.style.borderRadius = '5px';
             returnButton.style.textDecoration = 'none'; returnButton.style.display = 'inline-block';
             quizContainer.appendChild(returnButton);

            clearQuizStartFlags(); // مسح علامات البدء على الخطأ
            return; // إيقاف التنفيذ
        }

        try {
            // العثور على وسم السكربت الذي يحتوي على بيانات JSON داخل عنصر بيانات الاختبار
            const quizDataScript = quizDataElement.querySelector('script[type="application/json"]');
             if (!quizDataScript) {
                  throw new Error("No <script type='application/json'> tag found inside the quiz data element.");
             }
            // تحليل بيانات JSON
            const quizDefinition = JSON.parse(quizDataScript.textContent);

            // التحقق من أن البيانات صالحة وتحتوي على الأسئلة وعتبة النجاح
            if (!quizDefinition || !quizDefinition.questions || !Array.isArray(quizDefinition.questions) || quizDefinition.questions.length === 0 || typeof quizDefinition.pass_threshold !== 'number') {
                 throw new Error("Invalid or missing quiz data structure inside the JSON.");
            }

            console.log("Article Script (Quiz Flow): Quiz data loaded successfully:", quizDefinition);

            // --- عرض وبناء واجهة الاختبار ---
             renderQuiz(quizDefinition, quizContainer, currentQuizArticleId);
             console.log("Article Script (Quiz Flow): Quiz UI rendered.");

        } catch (e) {
            console.error("Article Script (Quiz Flow): Error loading, parsing, or validating quiz data:", e);
             // عرض رسالة خطأ للمستخدم في الحاوية
             if (quizContainer) {
                 quizContainer.innerHTML = `<p style="color: red; font-weight: bold;">حدث خطأ في معالجة بيانات الاختبار: ${e.message}. يرجى العودة لصفحة النقاط والمحاولة مرة أخرى.</p>`;
                  // عرض زر العودة
                  const returnButton = document.createElement('a');
                  returnButton.href = articleQuizConfig.pointsPageUrl;
                  returnButton.textContent = 'العودة إلى صفحة النقاط';
                  returnButton.style.marginTop = '20px'; returnButton.style.padding = '10px 15px';
                  returnButton.style.backgroundColor = '#dc3545'; returnButton.style.color = 'white';
                  returnButton.style.border = 'none'; returnButton.style.borderRadius = '5px';
                  returnButton.style.textDecoration = 'none'; returnButton.style.display = 'inline-block';
                  quizContainer.appendChild(returnButton);
             }
            clearQuizStartFlags(); // مسح علامات البدء على الخطأ
        }

    } else {
        console.log("Article Script: Not in quiz flow. Page loading normally.");
        // --- تنظيف علامات التدفق القديمة المتبقية على الزيارات العادية ---
        // هذه الخطوة للحفاظ على نظافة localStorage من أي بقايا من النظام القديم أو محاولات غير مكتملة
        const oldFlowStarted = localStorage.getItem(articleQuizConfig.localStorageKeys.oldFlowStarted);
        const oldCompleted = localStorage.getItem(articleQuizConfig.localStorageKeys.oldCompleted);
         if (oldFlowStarted === 'true' || oldCompleted === 'true') {
             console.log("Article Script: Found residual old timed reading flags during non-quiz flow. Cleaning up.");
             // استخدام clearQuizStartFlags هنا سيمسح أيضًا علامات البدء الجديدة إذا كانت موجودة بالخطأ، وهو أمر جيد
             clearQuizStartFlags(); // هذه الدالة تمسح علامات البدء (القديمة والجديدة)
             // لا تمسح علامات الإكمال (القديمة أو الجديدة) هنا، فصفحة النقاط هي المسؤولة عن قراءتها ومسحها
         }
         // هنا، دع إعلانات AdSense والمحتوى يظهران بشكل طبيعي. لا تعرض واجهة الاختبار.

         // أضف مستمع beforeunload لمسح علامات البدء القديمة المتبقية إذا غادر المستخدم في زيارة عادية
         window.addEventListener('beforeunload', () => {
              console.log("Article Script: window.beforeunload fired (not in quiz flow). Clearing any residual old start flags.");
               try {
                  localStorage.removeItem(articleQuizConfig.localStorageKeys.oldFlowStarted);
                  localStorage.removeItem(articleQuizConfig.localStorageKeys.oldStartTime);
                   console.log("Article Script: Residual old start flags cleared on normal exit.");
               } catch(e) {
                   console.error("Article Script: Error clearing residual old start flags on normal exit:", e);
               }
         });
    }
});

// --- Add beforeunload listener for cleanup of start flags IF in quiz flow ---
// يتم تسجيل هذا المستمع فقط إذا تم الكشف عن تدفق الاختبار في بداية السكربت
if (quizFlowStarted && currentQuizArticleId) {
    window.addEventListener('beforeunload', () => {
        console.log("Article Script (Quiz Flow): window.beforeunload fired. Clearing start flags.");
        // Clear start flags but NOT completion signals on premature exit
        clearQuizStartFlags();
        // Note: Completion signal is set only AFTER quiz pass and is read/cleared by the points page
    });
}


console.log("Article page script loaded.");
