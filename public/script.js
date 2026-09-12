// This file handles all the browser-side behavior:
// - submitting the form to create a new short URL
// - loading the list of existing URLs and displaying them in the table
//
// It talks to the backend using fetch(), which is the built-in way
// browsers make HTTP requests from JavaScript.

const form = document.getElementById("url-form");
const input = document.getElementById("url-input");
const errorMessage = document.getElementById("error-message");
const resultBox = document.getElementById("result");
const resultLink = document.getElementById("result-link");
const copyBtn = document.getElementById("copy-btn");
const urlList = document.getElementById("url-list");
const myUrlList = document.getElementById("my-url-list");

// Hides both the error box and the success box. Called before every
// new submission so old messages don't linger.
function resetMessages() {
  errorMessage.hidden = true;
  resultBox.hidden = true;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

// Copies a short URL to the clipboard and briefly changes the button's
// text to "Copied!" so the user gets feedback that it worked.
// Shared by both the "just created" copy button and each row's copy button.
function copyToClipboard(url, button) {
  navigator.clipboard.writeText(url);
  const originalLabel = button.textContent;
  button.textContent = "Copied!";
  setTimeout(() => (button.textContent = originalLabel), 1500);
}

// Builds one <tr> for a single shortened URL entry.
// We use createElement/textContent (instead of building an HTML string)
// so that a pasted URL can never be interpreted as HTML/script - it's
// always treated as plain text.
function createRow(url) {
  const row = document.createElement("tr");

  const shortCell = document.createElement("td");
  const shortLink = document.createElement("a");
  shortLink.href = `/${url.shortCode}`;
  shortLink.textContent = `/${url.shortCode}`;
  shortLink.target = "_blank";
  shortCell.appendChild(shortLink);

  const originalCell = document.createElement("td");
  originalCell.className = "original-url";
  originalCell.textContent = url.originalUrl;
  originalCell.title = url.originalUrl; // full URL on hover

  const clicksCell = document.createElement("td");
  clicksCell.textContent = url.clicks;

  const createdCell = document.createElement("td");
  createdCell.textContent = new Date(url.createdAt).toLocaleDateString();

  const copyCell = document.createElement("td");
  const rowCopyBtn = document.createElement("button");
  rowCopyBtn.type = "button";
  rowCopyBtn.textContent = "Copy";
  rowCopyBtn.addEventListener("click", () => {
    copyToClipboard(`${window.location.origin}/${url.shortCode}`, rowCopyBtn);
  });
  copyCell.appendChild(rowCopyBtn);

  row.append(shortCell, originalCell, clicksCell, createdCell, copyCell);
  return row;
}

// Fetches every shortened URL from the backend and redraws the table.
async function loadUrls() {
  const response = await fetch("/api/urls");
  const urls = await response.json();

  urlList.innerHTML = ""; // clear old rows before redrawing
  urls.forEach((url) => urlList.appendChild(createRow(url)));
}

// Fetches only the logged-in user's own URLs and redraws that table.
// If nobody's logged in, we just clear it instead of calling the API
// (which would reject the request anyway since it's protected).
async function loadMyUrls() {
  if (!isLoggedIn()) {
    myUrlList.innerHTML = "";
    return;
  }

  const response = await fetch("/api/urls/mine", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const urls = await response.json();

  myUrlList.innerHTML = "";
  urls.forEach((url) => myUrlList.appendChild(createRow(url)));
}

// Whenever auth.js reports that login state changed (login/signup/logout),
// refresh "My URLs" to match - either loading it for the first time or
// clearing it out.
document.addEventListener("auth-changed", loadMyUrls);

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the browser from doing a full page reload
  resetMessages();

  const originalUrl = input.value.trim();

  // Creating a link now requires being logged in. Check client-side first
  // so the user gets an immediate, friendly message instead of waiting on
  // a network round-trip just to be told the same thing by the server.
  if (!isLoggedIn()) {
    showError("Please log in or sign up before shortening a URL.");
    return;
  }

  try {
    const response = await fetch("/api/urls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ originalUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      // The server sends back { error: "..." } when something's invalid
      // (bad URL, not logged in, rate limited, etc.).
      showError(data.error || "Something went wrong.");
      return;
    }

    // Show the new short link and let the user copy it.
    resultLink.href = `/${data.shortCode}`;
    resultLink.textContent = `${window.location.origin}/${data.shortCode}`;
    resultBox.hidden = false;

    input.value = "";
    loadUrls(); // refresh the public table
    loadMyUrls(); // refresh "My URLs" so the new link shows up there too
  } catch (err) {
    showError("Could not reach the server. Is it running?");
  }
});

copyBtn.addEventListener("click", () => {
  copyToClipboard(resultLink.href, copyBtn);
});

// Load the existing lists as soon as the page opens.
loadUrls();
loadMyUrls();
