const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');

// 🔐 Firebase Setup (GitHub Secrets से)
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});

const db = admin.database();

// 📲 WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth()
});

// QR Code Generate
client.on('qr', qr => {
  console.log("📱 Scan QR Code:");
  qrcode.generate(qr, { small: true });
});

// Ready
client.on('ready', () => {
  console.log('✅ Bot Ready!');
});

// 📩 Message Handler
client.on('message', async msg => {
  const text = msg.body.toLowerCase().trim();
  const user = msg.from;

  try {

    // 🟢 MENU
    if (text === "hi" || text === "menu") {
      return msg.reply(
`📚 School Bot Menu:
1️⃣ Attendance
2️⃣ Fees
3️⃣ Notice
4️⃣ Pay Fees
5️⃣ Holiday List

Reply with number`
      );
    }

    // 📊 ATTENDANCE
    if (text === "1") {
      const snap = await db.ref(`students/${user}/attendance`).once("value");
      const data = snap.val();

      return msg.reply(
        data ? `📊 Attendance:\n${JSON.stringify(data)}` : "❌ No attendance data found"
      );
    }

    // 💰 FEES STATUS
    if (text === "2") {
      const snap = await db.ref(`students/${user}/fees`).once("value");
      const data = snap.val();

      return msg.reply(
        data ? `💰 Fees:\n${JSON.stringify(data)}` : "❌ No fees data found"
      );
    }

    // 📢 NOTICE
    if (text === "3") {
      const snap = await db.ref(`notices`).once("value");
      const data = snap.val();

      if (!data) return msg.reply("❌ No notices");

      let message = "📢 Notices:\n";
      Object.values(data).forEach(n => message += `- ${n}\n`);

      return msg.reply(message);
    }

    // 💳 PAY FEES
    if (text === "4") {
      const code = Math.floor(100000 + Math.random() * 900000);

      await db.ref(`payments/${user}`).set({
        code,
        status: "pending",
        createdAt: Date.now()
      });

      return msg.reply(
`💳 Fees Payment

UPI ID: yourupi@upi
Amount: ₹1000

🆔 Your Code: ${code}

👉 Payment करने के बाद UPI Ref Number भेजें`
      );
    }

    // 🔍 VERIFY PAYMENT (UPI REF)
    if (/^\d{10,}$/.test(text)) {
      await db.ref(`payments/${user}`).update({
        upiRef: text,
        status: "verification_pending",
        submittedAt: Date.now()
      });

      return msg.reply("✅ Payment submitted. Verification pending.");
    }

    // 📅 HOLIDAYS
    if (text === "5") {
      const snap = await db.ref(`holidays`).once("value");
      const data = snap.val();

      if (!data) return msg.reply("❌ No holiday data");

      let message = "📅 Holidays:\n";
      Object.values(data).forEach(h => message += `- ${h}\n`);

      return msg.reply(message);
    }

  } catch (err) {
    console.error(err);
    msg.reply("⚠️ Error occurred, try again later");
  }
});

// Start Bot
client.initialize();
