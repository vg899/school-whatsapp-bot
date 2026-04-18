const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_URL
});

const db = admin.database();

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  console.log("Scan QR Code:");
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot Ready!');
});

client.on('message', async msg => {
  const text = msg.body.toLowerCase();
  const user = msg.from;

  if (text === "hi") {
    msg.reply("Reply:\n1 Attendance\n2 Fees\n3 Notice\n4 Pay Fees\n5 Holiday");
  }

  if (text === "1") {
    const snap = await db.ref(`students/${user}/attendance`).once("value");
    msg.reply("Attendance: " + JSON.stringify(snap.val()));
  }

  if (text === "2") {
    const snap = await db.ref(`students/${user}/fees`).once("value");
    msg.reply("Fees: " + JSON.stringify(snap.val()));
  }

  if (text === "3") {
    const snap = await db.ref(`notices`).once("value");
    msg.reply("Notices: " + JSON.stringify(snap.val()));
  }

  if (text === "4") {
    const code = Math.floor(100000 + Math.random() * 900000);
    await db.ref(`payments/${user}`).set({ code, status: "pending" });

    msg.reply(`Pay to UPI: yourupi@upi\nCode: ${code}`);
  }

  if (/^\d+$/.test(text)) {
    await db.ref(`payments/${user}`).update({
      upiRef: text,
      status: "submitted"
    });

    msg.reply("Payment Submitted");
  }

  if (text === "5") {
    const snap = await db.ref(`holidays`).once("value");
    msg.reply("Holidays: " + JSON.stringify(snap.val()));
  }
});

client.initialize();
