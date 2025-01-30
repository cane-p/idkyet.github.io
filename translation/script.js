// Language Selection
const fromLanguage = document.getElementById('fromLanguage');
const toLanguage = document.getElementById('toLanguage');
const flipLanguagesBtn = document.getElementById('flipLanguages');

const languages = [
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
];

// Populate Language Dropdowns
function populateLanguages() {
  languages.forEach((lang) => {
    const option1 = document.createElement('option');
    option1.value = lang.code;
    option1.textContent = lang.name;
    fromLanguage.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = lang.code;
    option2.textContent = lang.name;
    toLanguage.appendChild(option2);
  });

  // Set default languages
  fromLanguage.value = 'fr'; // French
  toLanguage.value = 'en'; // English
}

populateLanguages(); // Call this function to populate the dropdowns

flipLanguagesBtn.addEventListener('click', () => {
  const temp = fromLanguage.value;
  fromLanguage.value = toLanguage.value;
  toLanguage.value = temp;
});

// Translation Services
document.querySelectorAll('.service-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const service = button.getAttribute('data-service');
    const text = document.getElementById('sourceText').value;
    const fromLang = fromLanguage.value;
    const toLang = toLanguage.value;

    let url = '';
    switch (service) {
      case 'google':
        url = `https://translate.google.com/?sl=${fromLang}&tl=${toLang}&text=${encodeURIComponent(text)}`;
        break;
      case 'deepl':
        url = `https://www.deepl.com/translator#${fromLang}/${toLang}/${encodeURIComponent(text)}`;
        break;
      case 'reverso':
        url = `https://www.reverso.net/text-translation#sl=${fromLang}&tl=${toLang}&text=${encodeURIComponent(text)}`;
        break;
      case 'bing':
        url = `https://www.bing.com/translator?from=${fromLang}&to=${toLang}&text=${encodeURIComponent(text)}`;
        break;
      default:
        console.error('Unknown service');
        return;
    }
    window.open(url, '_blank');
  });
});

// Divide Text into Chunks
document.getElementById('divideTextBtn').addEventListener('click', () => {
  const text = document.getElementById('sourceText').value;
  const charLimit = parseInt(document.getElementById('charLimit').value) || 2000;
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + charLimit, text.length);
    if (end < text.length) {
      const spaceIndex = text.lastIndexOf(' ', end);
      if (spaceIndex > start) end = spaceIndex;
    }
    chunks.push(text.substring(start, end).trim());
    start = end;
  }

  const chunksContainer = document.getElementById('chunksContainer');
  chunksContainer.innerHTML = chunks
    .map(
      (chunk, index) => `
      <div class="chunk-box">
        <textarea readonly>${chunk}</textarea>
        <textarea placeholder="Enter translation..." class="translation-box"></textarea>
        <button class="copy-btn">Copy</button>
        <button class="paste-btn">Paste</button>
      </div>
    `
    )
    .join('');

  updateProgress();
  addCopyPasteFunctionality();
});

// Add Copy and Paste Functionality
function addCopyPasteFunctionality() {
  document.querySelectorAll('.chunk-box').forEach((chunkBox) => {
    const copyBtn = chunkBox.querySelector('.copy-btn');
    const pasteBtn = chunkBox.querySelector('.paste-btn');
    const translationBox = chunkBox.querySelector('.translation-box');

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(translationBox.value);
        alert('Copied to clipboard!');
      } catch (err) {
        alert('Failed to copy!');
      }
    });

    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        translationBox.value = text;
      } catch (err) {
        alert('Failed to paste!');
      }
    });
  });
}

// Combine Translations
document.getElementById('combineBtn').addEventListener('click', async () => {
  const text = document.getElementById('sourceText').value;
  const summarize = document.getElementById('summarizeCheckbox').checked;

  if (summarize) {
    const summary = await summarizeText(text);
    document.getElementById('sourceText').value = summary;
  }

  await translateText();
  saveTranslation(text, document.getElementById('combinedTranslation').value);
  updateProgress();
  updateFinalCharCount();
});

// Save Translation History
function saveTranslation(sourceText, translation) {
  const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
  if (!sourceText || !translation) return; // Fix the translation glitch
  history.push({
    sourceText,
    translation,
    timestamp: new Date().toLocaleString(),
  });
  localStorage.setItem('translationHistory', JSON.stringify(history));
  displayHistory();
}

// Display Translation History
function displayHistory() {
  const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = history
    .map(
      (entry) => `
      <li>
        <strong>${entry.timestamp}</strong><br>
        <span><strong>Source:</strong> ${entry.sourceText}</span><br>
        <span><strong>Translation:</strong> ${entry.translation}</span>
        <button class="delete-history-item" data-timestamp="${entry.timestamp}">Delete</button>
      </li>
    `
    )
    .join('');

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-history-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const timestamp = e.target.getAttribute('data-timestamp');
      deleteHistoryItem(timestamp);
    });
  });
}

// Load History on Page Load
displayHistory();

// Export as PDF
document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const originalText = document.getElementById('sourceText').value;
  const translatedText = document.getElementById('combinedTranslation').value;

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Original Text", 10, 10);
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  let lines = doc.splitTextToSize(originalText, 180);
  let y = 20;
  lines.forEach(line => {
    if (y > 280) { // Check if we need to add a new page
      doc.addPage();
      y = 10;
    }
    doc.text(line, 10, y);
    y += 10;
  });

  doc.addPage();
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Translated Text", 10, 10);
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  lines = doc.splitTextToSize(translatedText, 180);
  y = 20;
  lines.forEach(line => {
    if (y > 280) { // Check if we need to add a new page
      doc.addPage();
      y = 10;
    }
    doc.text(line, 10, y);
    y += 10;
  });

  doc.save('translation.pdf');
});

// Export as TXT
document.getElementById('exportTxtBtn').addEventListener('click', () => {
  const text = document.getElementById('combinedTranslation').value;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'translation.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Character Counters
document.getElementById('sourceText').addEventListener('input', (e) => {
  document.getElementById('sourceCharCount').textContent = `Character count: ${e.target.value.length}`;
});

document.getElementById('combinedTranslation').addEventListener('input', (e) => {
  updateFinalCharCount();
});

function updateFinalCharCount() {
  const finalCharCount = document.getElementById('combinedTranslation').value.length;
  document.getElementById('finalCharCount').textContent = `Character count: ${finalCharCount}`;
}

// Session management
if (localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// Copy Combined Translation (Modern Clipboard API)
document.getElementById('copyCombinedBtn').addEventListener('click', async () => {
  const text = document.getElementById('combinedTranslation').value;
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (err) {
    alert('Failed to copy!');
  }
});

// Reset Everything Properly
document.getElementById('resetBtn').addEventListener('click', () => {
  // Clear inputs
  document.getElementById('sourceText').value = '';
  document.getElementById('charLimit').value = '';
  document.getElementById('combinedTranslation').value = '';
  
  // Clear chunks
  document.getElementById('chunksContainer').innerHTML = '';
  
  // Reset counters and progress
  document.getElementById('sourceCharCount').textContent = 'Character count: 0';
  document.getElementById('finalCharCount').textContent = 'Character count: 0';
  document.getElementById('progressText').textContent = '0%';
  
  // Reset progress circle color
  document.getElementById('progressCircle').style.backgroundColor = '#3b82f6';
});

// Toggle Translation History Visibility
document.getElementById('toggleHistoryBtn').addEventListener('click', () => {
  const historySection = document.querySelector('.history-section');
  const historyList = document.getElementById('historyList');
  const historyTitle = document.getElementById('historyTitle');
  if (historyList.style.display === 'none') {
    historyList.style.display = 'block';
    historyTitle.style.display = 'block';
    document.getElementById('toggleHistoryBtn').textContent = 'Hide History';
  } else {
    historyList.style.display = 'none';
    historyTitle.style.display = 'none';
    document.getElementById('toggleHistoryBtn').textContent = 'Show History';
  }
});

// Delete Translation History
document.getElementById('resetHistoryBtn').addEventListener('click', () => {
  localStorage.removeItem('translationHistory');
  displayHistory();
});

// Delete individual history item
function deleteHistoryItem(timestamp) {
  let history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
  history = history.filter(item => item.timestamp !== timestamp);
  localStorage.setItem('translationHistory', JSON.stringify(history));
  displayHistory();
}

// Update Progress
function updateProgress() {
  const totalChunks = document.querySelectorAll('.chunk-box').length;
  const translatedChunks = Array.from(document.querySelectorAll('.translation-box')).filter(textarea => textarea.value.trim() !== '').length;
  const progress = totalChunks === 0 ? 0 : Math.round((translatedChunks / totalChunks) * 100);

  document.getElementById('progressText').textContent = `${progress}%`;
  document.getElementById('progressCircle').style.backgroundColor = progress === 100 ? '#10b981' : '#3b82f6';
}

// Logout Button
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.setItem('isLoggedIn', 'false');
  window.location.href = 'index.html';
});

// Speech-to-Text
let isRecording = false;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const startRecordingBtn = document.getElementById('startRecording');
const sourceText = document.getElementById('sourceText');

recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map((result) => result[0].transcript)
    .join('');
  sourceText.value = transcript;
};

startRecordingBtn.addEventListener('click', () => {
  if (!isRecording) {
    recognition.start();
    startRecordingBtn.style.color = 'red';
    isRecording = true;
  } else {
    recognition.stop();
    startRecordingBtn.style.color = 'black';
    isRecording = false;
  }
});

// Check browser support for Speech-to-Text
if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
  startRecordingBtn.style.display = 'none';
  alert("Speech-to-Text is not supported in your browser.");
}

// Multi-format Translation
document.getElementById('fileInput').addEventListener('change', handleFileUpload);

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target.result;
    let text = '';

    if (file.type === 'application/pdf') {
      const pdf = await pdfjsLib.getDocument({ data: content }).promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      text = textContent.items.map(item => item.str).join(' ');
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await mammoth.extractRawText({ arrayBuffer: content }).then(result => result.value);
    } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      // Handle audio/video processing with server-side code
      alert('Audio/Video processing requires server-side implementation.');
      return;
    }

    document.getElementById('sourceText').value = text;
    document.getElementById('sourceCharCount').textContent = `Character count: ${text.length}`;
  };

  reader.readAsArrayBuffer(file);
}

// Integrating Multiple Translation Engines
class TranslationEngine {
  constructor(apiKey, service) {
    this.apiKey = apiKey;
    this.service = service;
  }

  async translate(text, fromLang, toLang) {
    let url = '';
    switch (this.service) {
      case 'google':
        url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
        break;
      case 'deepl':
        url = `https://api.deepl.com/v2/translate?auth_key=${this.apiKey}`;
        break;
      case 'reverso':
        url = `https://api.reverso.net/translate/v1/translation?key=${this.apiKey}`;
        break;
      default:
        throw new Error('Unknown service');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fromLang, toLang })
    });

    const data = await response.json();
    return data.translations[0].text;
  }
}

const googleEngine = new TranslationEngine('YOUR_GOOGLE_API_KEY', 'google');
const deeplEngine = new TranslationEngine('YOUR_DEEPL_API_KEY', 'deepl');
const reversoEngine = new TranslationEngine('YOUR_REVERSO_API_KEY', 'reverso');

async function translateText() {
  const text = document.getElementById('sourceText').value;
  const fromLang = fromLanguage.value;
  const toLang = toLanguage.value;

  const googleTranslation = await googleEngine.translate(text, fromLang, toLang);
  const deeplTranslation = await deeplEngine.translate(text, fromLang, toLang);
  const reversoTranslation = await reversoEngine.translate(text, fromLang, toLang);

  // Display translations side by side
  document.getElementById('combinedTranslation').value = `Google: ${googleTranslation}\n\nDeepL: ${deeplTranslation}\n\nReverso: ${reversoTranslation}`;
}

// AI-powered Summarization
async function summarizeText(text) {
  const response = await fetch('https://api.openai.com/v1/engines/gpt-3.5-turbo/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer YOUR_OPENAI_API_KEY`
    },
    body: JSON.stringify({
      prompt: `Summarize the following text:\n\n${text}`,
      max_tokens: 150
    })
  });

  const data = await response.json();
  return data.choices[0].text.trim();
}

// Multilingual UI Support
i18next.init({
  lng: 'en',
  resources: {
    en: { translation: { "key": "value" } },
    fr: { translation: { "key": "valeur" } }
  }
}, (err, t) => {
  if (err) return console.error(err);
  updateContent();
});

function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = i18next.t(element.getAttribute('data-i18n'));
  });
}

document.getElementById('languageSwitcher').addEventListener('change', (e) => {
  i18next.changeLanguage(e.target.value, updateContent);
});