const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  messageDiv.appendChild(bubble);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message typing-indicator';
  indicator.id = 'typingIndicator';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = 'Thinking...';

  indicator.appendChild(bubble);
  messagesContainer.appendChild(indicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, true);
  userInput.value = '';
  sendBtn.disabled = true;
  userInput.disabled = true;
  showTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    removeTypingIndicator();

    if (response.ok) {
      addMessage(data.reply, false);
    } else {
      addMessage(data.error || 'Something went wrong. Please try again.', false);
    }
  } catch (error) {
    removeTypingIndicator();
    addMessage('Unable to reach the server. Please check your connection and try again.', false);
  } finally {
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

userInput.focus();
