const form = document.getElementById("url-form");
const input = document.getElementById("url-input");
const errorMessage = document.getElementById("error-message");
const resultBox = document.getElementById("result");
const resultLink = document.getElementById("result-link");
const copyBtn = document.getElementById("copy-btn");
const urlList = document.getElementById("url-list");
const myUrlList = document.getElementById("my-url-list");


function resetMessages() {
  errorMessage.hidden = true;
  resultBox.hidden = true;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function copyToClipboard(url, button) {
  navigator.clipboard.writeText(url);
  const originalLabel = button.textContent;
  button.textContent = "Copied!";
  setTimeout(() => (button.textContent = originalLabel), 1500);
}


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


async function loadUrls() {
  const response = await fetch("/api/urls");
  const urls = await response.json();

  urlList.innerHTML = ""; 
  urls.forEach((url) => urlList.appendChild(createRow(url)));
}


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


document.addEventListener("auth-changed", loadMyUrls);

form.addEventListener("submit", async (event) => {
  event.preventDefault(); 
  resetMessages();

  const originalUrl = input.value.trim();

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
      
      showError(data.error || "Something went wrong.");
      return;
    }


    resultLink.href = `/${data.shortCode}`;
    resultLink.textContent = `${window.location.origin}/${data.shortCode}`;
    resultBox.hidden = false;

    input.value = "";
    loadUrls(); 
    loadMyUrls();
  } catch (err) {
    showError("Could not reach the server. Is it running?");
  }
});

copyBtn.addEventListener("click", () => {
  copyToClipboard(resultLink.href, copyBtn);
});


loadUrls();
loadMyUrls();
