import { isAuthenticated, initiateLogin, handleCallback, logout } from './auth';
import { sendMessage, getAvailableModels } from './chat';
import { ChatUI, showAuthenticatedUI, showUnauthenticatedUI, populateModelSelector } from './ui';

const chatUI = new ChatUI();

async function initialize(): Promise<void> {
  // Load models early, even before authentication
  console.log('Loading available models...');
  const models = await getAvailableModels();
  populateModelSelector(models);

  const hasAuthCode = await handleCallback();

  if (hasAuthCode || isAuthenticated()) {
    showAuthenticatedUI();
    chatUI.clearWelcome();
  } else {
    showUnauthenticatedUI();
  }

  const authBtn = document.getElementById('authBtn');
  authBtn?.addEventListener('click', async () => {
    console.log('Login button clicked');
    try {
      await initiateLogin();
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  });

  chatUI.onSendMessage(async (message) => {
    chatUI.addUserMessage(message);
    chatUI.setInputEnabled(false);

    const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
    const selectedModel = modelSelect.value;

    const assistantMessageDiv = chatUI.startAssistantMessage();
    let fullResponse = '';

    try {
      const response = await sendMessage(
        chatUI.getMessages(),
        selectedModel,
        (chunk) => {
          fullResponse += chunk;
          assistantMessageDiv.textContent = fullResponse;
        }
      );

      chatUI.completeAssistantMessage(response);
    } catch (error) {
      assistantMessageDiv.remove();
      chatUI.showError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      chatUI.setInputEnabled(true);
    }
  });
}

initialize();
