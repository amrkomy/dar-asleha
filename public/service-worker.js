// أضف هذا الكود لإجبار تحديث Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            registration.unregister();
            console.log('🗑️ تم إلغاء تسجيل Service Worker القديم');
        });
    }).then(() => {
        // إعادة التسجيل بعد التأخير
        setTimeout(() => {
            registerServiceWorker();
        }, 1000);
    });
}
