const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// لیست کاربران آنلاین
const onlineUsers = new Set();

// حداکثر تعداد کاربران مجاز
const MAX_USERS = 10;

// ذخیره آخرین پیام‌ها
const messageHistory = [];
const MAX_HISTORY = 20;

// تابع امن‌سازی پیام‌ها
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

io.on("connection", (socket) => {
  if (onlineUsers.size >= MAX_USERS) {
    socket.emit("server message", "تعداد کاربران به حداکثر ظرفیت رسیده است.");
    socket.disconnect();
    return;
  }

  console.log("یک کاربر متصل شد.");

  // ارسال تاریخچه پیام‌ها به کاربر جدید
  socket.emit("message history", messageHistory);

  // ذخیره نام کاربری
  socket.on("set username", (username) => {
    username = escapeHTML(username || "ناشناس");
    socket.username = username;
    onlineUsers.add(socket.username);
    io.emit("update users", Array.from(onlineUsers));
  });

  // دریافت و ارسال پیام
  socket.on("chat message", (msg) => {
    msg = escapeHTML(msg);
    const time = new Date().toLocaleTimeString();
    const data = {
      username: socket.username || "ناشناس",
      message: msg,
      time,
    };

    // ذخیره پیام در تاریخچه
    messageHistory.push(data);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }

    io.emit("chat message", data);
  });

  // حذف کاربر هنگام قطع اتصال
  socket.on("disconnect", () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit("update users", Array.from(onlineUsers));
    }
    console.log("یک کاربر قطع شد.");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`سرور روی پورت ${PORT} اجرا شد.`);
});
