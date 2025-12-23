import { Message, ModelInfo } from './chat';

export class ChatUI {
  private chatContainer: HTMLElement;
  private messageInput: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private messages: Message[] = [];

  constructor() {
    this.chatContainer = document.getElementById('chatContainer')!;
    this.messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
    this.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendBtn.click();
      }
    });
  }

  public onSendMessage(callback: (message: string) => void): void {
    this.sendBtn.addEventListener('click', () => {
      const message = this.messageInput.value.trim();
      if (message) {
        callback(message);
        this.messageInput.value = '';
      }
    });
  }

  public addUserMessage(content: string): void {
    this.messages.push({ role: 'user', content });
    this.appendMessage('user', content);
  }

  public startAssistantMessage(): HTMLElement {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  public completeAssistantMessage(content: string): void {
    this.messages.push({ role: 'assistant', content });
  }

  public showError(error: string): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message error';
    messageDiv.textContent = `Error: ${error}`;
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  private appendMessage(role: 'user' | 'assistant', content: string): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  public clearWelcome(): void {
    const welcome = document.getElementById('welcome');
    if (welcome) {
      welcome.remove();
    }
  }

  public setInputEnabled(enabled: boolean): void {
    this.messageInput.disabled = !enabled;
    this.sendBtn.disabled = !enabled;
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public clearMessages(): void {
    this.messages = [];
    this.chatContainer.innerHTML = '';
  }
}

export function showAuthenticatedUI(): void {
  document.getElementById('controls')?.classList.remove('hidden');
  document.getElementById('inputContainer')?.classList.remove('hidden');
  document.getElementById('authBtn')?.classList.add('hidden');
  document.getElementById('logoutBtn')?.classList.remove('hidden');
  document.getElementById('userInfo')?.classList.remove('hidden');

  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    userInfo.textContent = 'Authenticated';
  }
}

export function showUnauthenticatedUI(): void {
  document.getElementById('controls')?.classList.add('hidden');
  document.getElementById('inputContainer')?.classList.add('hidden');
  document.getElementById('authBtn')?.classList.remove('hidden');
  document.getElementById('logoutBtn')?.classList.add('hidden');
  document.getElementById('userInfo')?.classList.add('hidden');
}

function formatContextLength(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return `${tokens}`;
}

export function populateModelSelector(models: ModelInfo[]): void {
  const select = document.getElementById('modelSelect') as HTMLSelectElement;
  if (!select) return;

  select.innerHTML = '';

  let currentProvider = '';
  models.forEach(model => {
    if (model.provider !== currentProvider) {
      if (currentProvider !== '') {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '─────────────────';
        select.appendChild(separator);
      }
      currentProvider = model.provider;
    }

    const option = document.createElement('option');
    option.value = model.id;
    const contextInfo = model.contextLength ? ` [${formatContextLength(model.contextLength)}]` : '';
    option.textContent = `${model.provider}: ${model.name}${contextInfo}`;
    select.appendChild(option);
  });

  console.log(`Loaded ${models.length} models from ${new Set(models.map(m => m.provider)).size} providers`);
}
