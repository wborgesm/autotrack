import admin from "firebase-admin";

let initialized = false;

export function initFirebase() {
  if (initialized) return;
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccount)) });
      initialized = true;
    }
  }
}

export async function sendPushNotification(token: string, title: string, body: string) {
  initFirebase();
  if (!admin.apps.length) return { error: "Firebase não configurado" };
  try {
    const message = { notification: { title, body }, token };
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error: any) {
    return { error: error.message };
  }
}
