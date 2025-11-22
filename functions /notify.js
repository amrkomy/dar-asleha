exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const APP_ID = process.env.ONESIGNAL_APP_ID;
  const REST_KEY = process.env.ONESIGNAL_REST_KEY;

  if (!APP_ID || !REST_KEY) {
    console.error('❌ Missing OneSignal environment variables');
    return { statusCode: 500, body: 'Server misconfiguration' };
  }

  try {
    const { complaint } = JSON.parse(event.body || '{}');

    const payload = {
      app_id: APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { ar: 'شكوى جديدة' },
      contents: {
        ar: `من: ${complaint.name || 'مجهول'}\n${(complaint.complaint || '').substring(0, 80)}...`
      },
      url: 'https://admin-complants-dar.netlify.app//', // ⚠️ غيّر هذا لرابطك الفعلي
      chrome_web_image: 'https://xqccuvhtrxhsrzqgktdj.supabase.co/storage/v1/object/public/sound/notification-icon.png'
    };

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${REST_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    return {
      statusCode: res.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('Error in notify function:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
