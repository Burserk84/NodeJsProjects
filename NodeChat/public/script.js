const socket = io();

// نام کاربری را تنظیم کن
const username = prompt("نام کاربری خود را وارد کنید:") || "ناشناس";
socket.emit("set username", username);

// نمایش پیام‌ها
socket.on("chat message", (data) => {
  const { username, message, time } = data;
  const messagesDiv = document.getElementById("messages");
  const messageDiv = document.createElement("div");
  messageDiv.innerHTML = `<strong>${username}:</strong> ${message} <span style="font-size: 0.8em; color: gray;">[${time}]</span>`;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// تعداد کاربران آنلاین
socket.on("update users", (users) => {
  document.getElementById("online-count").textContent = users.length;
});

// ارسال پیام
const form = document.getElementById("chat-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (message) {
    socket.emit("chat message", message);
    input.value = "";
  }
});
