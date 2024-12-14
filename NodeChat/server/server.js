// server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// لیست کاربران آنلاین
const onlineUsers = new Set();

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
  console.log("یک کاربر متصل شد.");

  // ذخیره نام کاربری
  socket.on("set username", (username) => {
    username = escapeHTML(username || "ناشناس"); // امن‌سازی نام کاربری
    socket.username = username;
    onlineUsers.add(socket.username);
    io.emit("update users", Array.from(onlineUsers));
  });

  // دریافت و ارسال پیام
  socket.on("chat message", (msg) => {
    msg = escapeHTML(msg); // امن‌سازی پیام
    const time = new Date().toLocaleTimeString();
    const data = {
      username: socket.username || "ناشناس",
      message: msg,
      time,
    };
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
