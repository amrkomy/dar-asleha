// netlify/functions/notify/notify.js
exports.handler = async (event) => {
  // تمكين CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // التعامل مع طلبات OPTIONS لـ CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // تأكد من أن الطلب POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
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
      headers,
      body: JSON.stringify({ 
        error: 'Server configuration error: missing OneSignal keys',
        details: `APP_ID: ${!!APP_ID}, REST_KEY: ${!!REST_KEY}`
      })
    };
  }

  try {
    // تحليل جسم الطلب
    const body = JSON.parse(event.body || '{}');
    const complaint = body.complaint;

    console.log('📨 Received complaint:', complaint);

    if (!complaint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing complaint data' })
      };
    }

    // تحضير حمولة الإشعار
    const payload = {
      app_id: APP_ID,
      included_segments: ['All'],
      headings: { en: 'New Complaint', ar: 'شكوى جديدة' },
      contents: {
        en: `From: ${complaint.name || 'Unknown'}\n${(complaint.complaint || '').substring(0, 80)}...`,
        ar: `من: ${complaint.name || 'مجهول'}\n${(complaint.complaint || '').substring(0, 80)}...`
      },
      url: 'https://admin-complants-dar.netlify.app/',
      chrome_web_icon: 'https://cdn.pixabay.com/photo/2016/08/25/07/30/red-1618916_1280.png',
      priority: 10
    };

    console.log('🚀 Sending to OneSignal:', payload);

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
    
    console.log('📬 OneSignal response:', {
      status: response.status,
      result: result
    });

    // إرجاع النتيجة
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify({
        success: response.status === 200,
        oneSignalResponse: result
      })
    };
  } catch (err) {
    console.error('💥 Error in notify function:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: err.message 
      })
    };
  }
};
