
  // تأكد من تطابق هذه المفاتيح مع تلك الموجودة في سكربت صفحة النقاط
  const articleAppConfig = {
    pointsPageUrl: '/p/points-5.html', // !!! عنوان URL الفعلي لصفحة النقاط الخاصة بك !!! تأكد من صحته !!!
    requiredDurationMillis: 60 * 1000, // المدة المطلوبة بالمللي ثانية لقراءة المقال (1 دقيقة)
    localStorageKeys: {
        flowStarted: 'articlePointsFlow',
        startTime: 'articleStartTime',
        completed: 'articleCompleted'
    },
    notificationId: 'articlePointsNotification',
    notificationMessageId: 'notificationMessage'
  };

  let redirectTimeout;
  let notificationElement = null;
  let notificationMessageElement = null;
  let durationCheckInterval;

  // تأخير إضافي قبل إعادة التوجيه بعد اكتمال المدة (10 ثوانٍ)
  const additionalRedirectDelayMillis = 10 * 1000;


  function clearArticleStartLocalStorageFlags() {
       console.log("Article Script: Clearing article START localStorage flags (flowStarted, startTime).");
      try {
          localStorage.removeItem(articleAppConfig.localStorageKeys.flowStarted);
          localStorage.removeItem(articleAppConfig.localStorageKeys.startTime);
           console.log("Article Script: Article START localStorage flags cleared.");
      } catch(e) {
          console.error("Article Script: Error clearing article START localStorage flags:", e);
      }
  }

   function clearAllArticleLocalStorageFlags() {
       console.log("Article Script: Clearing ALL article localStorage flags.");
        try {
            localStorage.removeItem(articleAppConfig.localStorageKeys.flowStarted);
            localStorage.removeItem(articleAppConfig.localStorageKeys.startTime);
            localStorage.removeItem(articleAppConfig.localStorageKeys.completed);
             console.log("Article Script: ALL article localStorage flags cleared.");
        } catch(e) {
            console.error("Article Script: Error clearing ALL article localStorage flags:", e);
        }
    }

    function formatMillisToMinutesSeconds(millis) {
        const totalSeconds = Math.ceil(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

   function createAndAppendNotification() {
       console.log("Article Script: Creating and appending notification element.");
       notificationElement = document.createElement('div');
       notificationElement.id = articleAppConfig.notificationId;
        // تحسينات تنسيق CSS للإشعار
        notificationElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            left: 20px; /* لتحسين العرض على الجوال */
            max-width: 400px; /* تحديد عرض أقصى */
            margin: 0 auto; /* توسيط */
            background-color: #f8f9fa;
            color: #212529;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
            text-align: center;
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            transform: translateY(100%);
            opacity: 0;
            display: none; /* إخفاء مبدئي باستخدام display */
            flex-direction: column; /* ترتيب المحتوى عمودياً */
        `;


       notificationMessageElement = document.createElement('p');
       notificationMessageElement.id = articleAppConfig.notificationMessageId;
        notificationMessageElement.style.cssText = `
            margin: 0;
            font-size: 0.9em;
            font-weight: bold;
        `;


       notificationElement.appendChild(notificationMessageElement);
       document.body.appendChild(notificationElement);

        // إضافة CSS بسيط للتحكم في ظهور الإشعار
        const style = document.createElement('style');
        style.innerHTML = `
            #${articleAppConfig.notificationId}.is-visible {
                transform: translateY(0);
                opacity: 1;
                 display: flex; /* للتأكد من الظهور كـ flex عند is-visible */
            }
        `;
        document.head.appendChild(style);


        console.log("Article Script: Notification element created and appended.");
   }

   function showNotification() {
       if (notificationElement) {
            notificationElement.style.display = 'flex'; // اجعله flex للسماح بالانتقال
            setTimeout(() => { // إضافة تأخير بسيط للسماح بتطبيق display
                 notificationElement.classList.add('is-visible');
                 console.log("Article Script: Showing notification.");
            }, 50); // تأخير صغير جداً كافٍ عادةً
       }
   }

   function hideAndRemoveNotification() {
        if (notificationElement) {
             // تأكد من أنه مرئي قبل محاولة إخفائه بالانتقال
            if (notificationElement.classList.contains('is-visible')) {
                notificationElement.classList.remove('is-visible');
                 console.log("Article Script: Hiding notification.");
                notificationElement.addEventListener('transitionend', function handler() {
                    if (notificationElement && notificationElement.parentNode) {
                         notificationElement.parentNode.removeChild(notificationElement);
                         console.log("Article Script: Notification element removed from DOM after transition.");
                    }
                    notificationElement.removeEventListener('transitionend', handler);
                     notificationElement = null;
                     notificationMessageElement = null;
                });
                 // Fallback لإزالة العنصر من DOM إذا لم يحدث transitionend
                setTimeout(() => {
                     if (notificationElement && notificationElement.parentNode) {
                         // تحقق مرة أخرى للتأكد من أنه لم يتم إزالته بالفعل بواسطة transitionend
                         if (!notificationElement.classList.contains('is-visible')) {
                              notificationElement.parentNode.removeChild(notificationElement);
                               console.log("Article Script: Notification element fallback removed from DOM.");
                               notificationElement = null;
                               notificationMessageElement = null;
                         }
                     }
                }, 500); // أطول قليلاً من مدة الانتقال في CSS
            } else {
                 // إذا لم يكن مرئياً باستخدام is-visible، فقط قم بإزالته من DOM مباشرة
                 if (notificationElement.parentNode) {
                      notificationElement.parentNode.removeChild(notificationElement);
                      console.log("Article Script: Notification element removed from DOM (was not visible).");
                       notificationElement = null;
                       notificationMessageElement = null;
                 }
            }
        }
   }


  document.addEventListener('DOMContentLoaded', () => {
      console.log("Article Page: DOMContentLoaded fired.");

      notificationElement = document.getElementById(articleAppConfig.notificationId); // حاول العثور عليه أولاً إذا كان موجوداً
      notificationMessageElement = document.getElementById(articleAppConfig.notificationMessageId);


      const flowStarted = localStorage.getItem(articleAppConfig.localStorageKeys.flowStarted);
      const startTimeString = localStorage.getItem(articleAppConfig.localStorageKeys.startTime);


      console.log("Article Page: Checking localStorage for flow flags:", {
          flowStarted: flowStarted,
          startTime: startTimeString
      });

      if (flowStarted === 'true' && startTimeString) {
          console.log("Article Page: Article points flow detected. Initializing tracking and notification.");

          const startTime = parseInt(startTimeString);
          // !!! إضافة فحص إضافي لقيمة startTime بعد التحويل !!!
          if (isNaN(startTime) || startTime <= 0) {
              console.error("Article Script: startTime from localStorage is invalid or zero. Clearing flags and exiting flow.", startTime);
               clearAllArticleLocalStorageFlags();
               // إخفاء أو إزالة الإشعار إذا تم إنشاؤه ولكن التدفق غير صالح
               if (notificationElement) hideAndRemoveNotification();
              return;
          }
           console.log("Article Script: Using valid startTime:", startTime);


           if (!notificationElement || !notificationMessageElement) {
                createAndAppendNotification();
           }
           showNotification();


           notificationMessageElement.textContent = `اقرأ لمدة دقيقة واحدة لكسب نقطة. ستتم إعادة التوجيه تلقائياً بعد قضاء الوقت المطلوب.`;

           // !!! إضافة تسجيل داخل setInterval !!!
           durationCheckInterval = setInterval(() => {
               const currentTime = Date.now();
               const timeSpent = currentTime - startTime; // حساب المدة المنقضية
               const timeRemainingMillis = Math.max(0, articleAppConfig.requiredDurationMillis - timeSpent);
               const formattedTimeRemaining = formatMillisToMinutesSeconds(timeRemainingMillis);

                // تسجيل القيم الهامة في كل ثانية
               console.log(`Article Script (Interval): startTime=${startTime}, currentTime=${currentTime}, timeSpent=${timeSpent}, requiredDuration=${articleAppConfig.requiredDurationMillis}, timeRemaining=${timeRemainingMillis}`);


                notificationMessageElement.textContent = `اقرأ لمدة دقيقة واحدة لكسب نقطة. الوقت المتبقي: ${formattedTimeRemaining}. ستتم إعادة التوجيه تلقائياً.`;

               // التحقق من اكتمال المدة
               if (timeSpent >= articleAppConfig.requiredDurationMillis) {
                   console.log("Article Script: Required duration met!");

                   // مسح interval لمنع تحديثات المؤقت بعد انتهاء المدة
                   clearInterval(durationCheckInterval);
                   console.log("Article Script: Duration check interval cleared.");


                   // *** تسجيل وفحص حالة علامة الإكمال قبل محاولة تعيينها ***
                   const currentCompletedState = localStorage.getItem(articleAppConfig.localStorageKeys.completed);
                   console.log(`Article Script: Current '${articleAppConfig.localStorageKeys.completed}' state before setting: ${currentCompletedState}`);


                   // Set the completion flag in localStorage if not already set
                   if (currentCompletedState !== 'true') {
                       try {
                           localStorage.setItem(articleAppConfig.localStorageKeys.completed, 'true');
                            console.log(`Article Script: ✅ localStorage flag '${articleAppConfig.localStorageKeys.completed}' set to 'true'.`); // تسجيل إضافي للنجاح

                           // تأكيد القيمة بعد التعيين مباشرة
                           const confirmedCompletedState = localStorage.getItem(articleAppConfig.localStorageKeys.completed);
                            console.log(`Article Script: Confirmed '${articleAppConfig.localStorageKeys.completed}' state AFTER setting: ${confirmedCompletedState}`);


                           notificationMessageElement.textContent = `تهانينا! لقد قضيت الوقت المطلوب. سيتم إعادة توجيهك خلال ${additionalRedirectDelayMillis / 1000} ثوانٍ لكسب النقطة.`; // تحديث الرسالة لتشمل التأخير

                       } catch(e) {
                           console.error("Article Script: ❌ Error setting completion flag in localStorage:", e);
                            notificationMessageElement.textContent = `حدث خطأ في تسجيل الإكمال. يرجى العودة لصفحة النقاط يدوياً.`;
                       }
                   } else {
                       console.log(`Article Script: '${articleAppConfig.localStorageKeys.completed}' was already 'true'. Skipping setItem.`);
                        // Update message even if already true
                        notificationMessageElement.textContent = `تهانينا! لقد قضيت الوقت المطلوب. سيتم إعادة توجيهك خلال ${additionalRedirectDelayMillis / 1000} ثوانٍ لكسب النقطة.`; // تحديث الرسالة لتشمل التأخير
                   }


                   // *** تحديد تأخير إضافي قبل الإعادة التوجيه ***
                   // نحسب الوقت الذي يجب أن تتم فيه الإعادة التوجيه المطلوبة
                   const requiredRedirectTime = startTime + articleAppConfig.requiredDurationMillis + additionalRedirectDelayMillis;
                   // نحسب التأخير من اللحظة الحالية إلى ذلك الوقت
                   const finalRedirectDelay = Math.max(1000, requiredRedirectTime - Date.now()); // نضمن على الأقل 1 ثانية إجمالي تأخير لتشغيل setTimeout


                   console.log(`Article Script: Setting final automatic redirect timer for ${finalRedirectDelay}ms ( redirect should happen at timestamp ${requiredRedirectTime} ).`);

                   // *** تسجيل حالة جميع علامات المقال قبل مسح علامات البدء والإعادة التوجيه ***
                    console.log(`Article Script: localStorage state BEFORE clearing start flags and redirect:`, { ...localStorage });


                   redirectTimeout = setTimeout(() => {
                        console.log("Article Script: Automatic redirect timer expired. Proceeding with cleanup and redirect.");

                       // *** إخفاء وإزالة الإشعار هنا، قبل التنظيف والإعادة التوجيه مباشرة ***
                        hideAndRemoveNotification();


                       // نضيف تأخير بسيط جداً للسماح ببدء الانتقال المرئي للإشعار قبل تغيير الصفحة
                       setTimeout(() => {
                            clearArticleStartLocalStorageFlags();
                            console.log("Article Script: Performing automatic redirect to points page.");
                            window.location.href = articleAppConfig.pointsPageUrl;
                       }, 50); // تأخير صغير جداً، يمكن تعديله إذا لم يظهر الانتقال بشكل كامل


                   }, finalRedirectDelay);


               } // نهاية if (timeSpent >= requiredDurationMillis)
           }, 1000); // نهاية setInterval


           // مستمع لحدث المغادرة اليدوية (إغلاق الصفحة، الانتقال لرابط آخر)
           window.addEventListener('beforeunload', handleBeforeUnload);


       } else {
           console.log("Article Page: Not in article points flow. No tracking or dynamic notification set.");
           // قم بتنظيف جميع علامات المقال إذا لم يتم الكشف عن التدفق لسبب ما
           clearAllArticleLocalStorageFlags();
           if (notificationElement) hideAndRemoveNotification(); // إخفاء وإزالة الإشعار إذا كان موجوداً
       }
    });


    // دالة تُنفذ عند محاولة مغادرة الصفحة
    function handleBeforeUnload() {
        console.log("Article Script: window.onbeforeunload fired. Checking duration for potential completion save and clearing start flags.");

        // مسح العدادات لمنع تشغيلها بعد المغادرة (هذا مهم جداً)
        if (durationCheckInterval) {
            clearInterval(durationCheckInterval);
            console.log("Article Script: Duration check interval cleared on beforeunload.");
        }
         if (redirectTimeout) {
             clearTimeout(redirectTimeout);
              console.log("Article Script: Redirect timeout cleared on beforeunload.");
         }

         // محاولة إخفاء الإشعار عند المغادرة اليدوية ليكون الانتقال أقل حدة
         if(notificationElement) {
             // لا نستخدم hideAndRemoveNotification هنا لأننا لا نريد الانتظار لإزالة DOM قبل المغادرة
             notificationElement.style.display = 'none'; // إخفاء فوري
             notificationElement.classList.remove('is-visible'); // إزالة الفئة المرئية
             console.log("Article Script: Hiding notification on beforeunload.");
         }


        const flowStarted = localStorage.getItem(articleAppConfig.localStorageKeys.flowStarted);
        const startTimeString = localStorage.getItem(articleAppConfig.localStorageKeys.startTime);
        const completed = localStorage.getItem(articleAppConfig.localStorageKeys.completed);

        console.log(`Article Script: onbeforeunload state check: flowStarted=${flowStarted}, startTime=${startTimeString}, completed=${completed}`);


        // إذا كان التدفق قد بدأ، ولديك وقت بدء صالح، ولم يتم الإكمال بالفعل
        if (flowStarted === 'true' && startTimeString && completed !== 'true') {
            const startTime = parseInt(startTimeString);
            const currentTime = Date.now();
            const duration = currentTime - startTime;
            const requiredDuration = articleAppConfig.requiredDurationMillis;

            console.log(`Article Script: onbeforeunload duration check - ${duration}ms spent, Required: ${requiredDuration}ms`);

            // تحقق إذا قضى المستخدم المدة المطلوبة
            // نستخدم > هنا في حالة المغادرة المبكرة جدا بعد اكتمال المدة لتجنب مشاكل التوقيت الدقيقة
            if (!isNaN(startTime) && startTime > 0 && duration >= requiredDuration) {
                console.log("Article Script: Required duration met on beforeunload. Attempting to set completion flag.");
                try {
                    // حاول تعيين علامة الإكمال في Local Storage لتقرأها صفحة النقاط عند العودة
                    localStorage.setItem(articleAppConfig.localStorageKeys.completed, 'true');
                     console.log(`Article Script: ✅ (onbeforeunload) localStorage flag '${articleAppConfig.localStorageKeys.completed}' set to 'true'.`);
                } catch(e) {
                    console.error("Article Script: ❌ (onbeforeunload) Error setting completion flag in localStorage:", e);
                }
            } else {
                console.log("Article Script: Required duration NOT met on beforeunload.");
            }
        } else {
            console.log("Article Script: Not in active article flow, already completed, or invalid state. No special action on beforeunload save.");
        }

         // !!! دائماً قم بمسح علامات البدء عند المغادرة لتجنب بقائها في Local Storage بشكل قديم !!!
         // لا تمسح علامة 'completed' هنا في onbeforeunload، يجب أن تبقى لتقرأها صفحة النقاط عند عودة المستخدم
         console.log(`Article Script: localStorage state BEFORE clearing start flags in beforeunload:`, { ...localStorage });

         clearArticleStartLocalStorageFlags(); // مسح علامات البدء (flowStarted, startTime)
         console.log("Article Script: Article start localStorage flags cleared on beforeunload.");
    }


    // دالة تُنفذ عند إلغاء تحميل الصفحة بالكامل
    window.addEventListener('unload', () => {
      console.log("Article Script: window.unload fired. Cleaning up timers and listeners.");
       // هذه تحدث غالباً بعد onbeforeunload، وهي فرصة أخيرة لتنظيف المؤقتات والمستمعات
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
         console.log("Article Script: Redirect timeout cleared on unload.");
      }
      if (durationCheckInterval) {
          clearInterval(durationCheckInterval);
           console.log("Article Script: Duration check interval cleared on unload.");
      }
       window.removeEventListener('beforeunload', handleBeforeUnload); // إزالة المستمع لتجنب تشغيله مرة أخرى بالخطأ
        console.log("Article Script: Beforeunload listener removed on unload.");

         // لا تقم بمسح Local Storage هنا أيضاً، دعه لصفحة النقاط لتقرأه
    });


    console.log("Article page script loaded."); // تسجيل عند تحميل السكربت



