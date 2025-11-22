// functions/notify.js
exports.handler = async (event) => {
  // تأكد من أن الطلب POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  // احصل على المفاتيح من Netlify Environment Variables
  const APP_ID = process.env.ONESIGNAL_APP_ID;
  const REST_KEY = process.env.ONESIGNAL_REST_KEY;

  // تحقق من وجود المفاتيح
  if (!APP_ID || !REST_KEY) {
    console.error('❌ Missing OneSignal environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: missing OneSignal keys' })
    };
  }

  try {
    // تحليل جسم الطلب
    const body = JSON.parse(event.body || '{}');
    const complaint = body.complaint;

    if (!complaint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing complaint data' })
      };
    }

    // تحضير حمولة الإشعار
    const payload = {
      app_id: APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { ar: 'شكوى جديدة' },
      contents: {
        ar: `من: ${complaint.name || 'مجهول'}\n${(complaint.complaint || '').substring(0, 80)}...`
      },
      url: 'https://admin-complants-dar.netlify.app/', // ← غيّر هذا إذا غيرت الرابط
      chrome_web_image: 'https://xqccuvhtrxhsrzqgktdj.supabase.co/storage/v1/object/public/sound/notification-icon.png',
      web_push_topic: 'new-complaint' // لتجنب تكرار الإشعارات
    };

    // إرسال الطلب إلى OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${REST_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // إرجاع النتيجة إلى العميل (اختياري لأغراض التصحيح)
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('💥 Error in notify function:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
};
