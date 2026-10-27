export const DOWN_MESSAGE = 'ระบบขัดข้องชั่วคราว กรุณากดลิงก์ LINE ด้านล่างเพื่อติดต่อแอดมิน';

function downError(status) {
  const err = new Error(DOWN_MESSAGE);
  err.network = true;
  err.status = status;
  return err;
}

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // เช่น "Failed to fetch" — เน็ตหลุดหรือเซิร์ฟเวอร์ไม่ตอบ
    throw downError(0);
  }
  if (res.status >= 500) throw downError(res.status);

  let data;
  try {
    data = await res.json();
  } catch {
    throw downError(res.status);
  }
  if (!res.ok) {
    const err = new Error(data?.error || DOWN_MESSAGE);
    err.status = res.status;
    if (!data?.error) err.network = true;
    throw err;
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body ?? {}),
  patch: (url, body) => request('PATCH', url, body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
};
