// Handles signup, login, and logout in the browser.
//
// The JWT we get back from the server is saved in localStorage so it
// survives a page refresh. Other scripts (like script.js) read it via
// getToken() and send it as "Authorization: Bearer <token>" on requests
// that require a logged-in user.

const TOKEN_KEY = "url-shortener-token";
const EMAIL_KEY = "url-shortener-email";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getLoggedInEmail() {
  return localStorage.getItem(EMAIL_KEY);
}

function isLoggedIn() {
  return Boolean(getToken());
}

function saveSession(token, email) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loggedOutView = document.getElementById("logged-out-view");
const loggedInView = document.getElementById("logged-in-view");
const loggedInEmailLabel = document.getElementById("logged-in-email");

// Swaps between the "log in / sign up" form and the "logged in as X" view.
// Other scripts can call this too (e.g. after checking auth on page load).
function updateAuthUI() {
  if (isLoggedIn()) {
    loggedOutView.hidden = true;
    loggedInView.hidden = false;
    loggedInEmailLabel.textContent = getLoggedInEmail();
  } else {
    loggedOutView.hidden = false;
    loggedInView.hidden = true;
  }
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = false;
}

// Shared by signup and login - they only differ in which endpoint they hit.
async function submitAuth(endpoint) {
  authError.hidden = true;

  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  try {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(data.error || "Something went wrong.");
      return;
    }

    saveSession(data.token, data.email);
    authEmailInput.value = "";
    authPasswordInput.value = "";
    updateAuthUI();

    // Tell the rest of the app that login state changed, so script.js can
    // load (or clear) the "My URLs" list without these two files needing
    // to know about each other's internals.
    document.dispatchEvent(new Event("auth-changed"));
  } catch (err) {
    showAuthError("Could not reach the server. Is it running?");
  }
}

signupBtn.addEventListener("click", () => submitAuth("signup"));
loginBtn.addEventListener("click", () => submitAuth("login"));

logoutBtn.addEventListener("click", () => {
  clearSession();
  updateAuthUI();
  document.dispatchEvent(new Event("auth-changed"));
});

// Show the correct view as soon as the page loads (e.g. still logged in
// from a previous visit, since the token was saved in localStorage).
updateAuthUI();
