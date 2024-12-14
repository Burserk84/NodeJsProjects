const socket = io();

const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username");

const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

let username = "";

// نمایش پیام در صفحه
function appendMessage(data) {
  const item = document.createElement("div");
  item.innerHTML = `<strong>${data.username}</strong> [${data.time}]: ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

// دریافت تاریخچه پیام‌ها
socket.on("message history", (history) => {
  messages.innerHTML = "";
  history.forEach(appendMessage);
});

// دریافت پیام جدید از سرور
socket.on("chat message", (data) => {
  appendMessage(data);
});

// مدیریت لاگین
loginBtn.addEventListener("click", () => {
  const enteredUsername = usernameInput.value.trim();
  if (!enteredUsername) {
    alert("لطفاً نام کاربری وارد کنید!");
    return;
  }

  username = enteredUsername;
  socket.emit("set username", username);

  loginContainer.style.display = "none";
  chatContainer.style.display = "block";
});

// ارسال پیام به سرور
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});
