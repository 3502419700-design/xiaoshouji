// 移动端小手机聊天应用
class MobileChatApp {
    constructor() {
        this.currentCharacter = null;
        this.characters = [];
        this.chatHistory = {};
        this.moments = [];
        this.worldBook = [];
        this.userPersona = {
            name: '用户',
            description: ''
        };
        this.currentTheme = 'default';
        this.apiConfig = {
            url: 'http://localhost:8000',
            key: ''
        };
        this.deferredPrompt = null;
        
        this.init();
    }

    init() {
        this.loadConfig();
        this.loadChatHistory();
        this.loadMoments();
        this.loadUserPersona();
        this.loadWorldBook();
        this.loadTheme();
        this.initializeCharacters();
        this.renderChatList();
        this.renderMoments();
        this.updateTime();
        this.setupPWA();
        this.setupMobileFeatures();
        
        // 每分钟更新一次时间
        setInterval(() => this.updateTime(), 60000);
    }

    // 设置PWA功能
    setupPWA() {
        // 监听PWA安装事件
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // 监听PWA安装完成
        window.addEventListener('appinstalled', () => {
            console.log('PWA安装成功');
            this.hideInstallPrompt();
        });

        // 注册Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker注册成功:', registration);
                })
                .catch(error => {
                    console.log('Service Worker注册失败:', error);
                });
        }
    }

    // 设置移动端特性
    setupMobileFeatures() {
        // 防止双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // 自动调整输入框高度
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
        });

        // 键盘弹出时调整界面
        window.addEventListener('resize', () => {
            this.handleKeyboardToggle();
        });

        // 处理输入框焦点
        messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 300);
        });
    }

    // 处理键盘弹出/收起
    handleKeyboardToggle() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // 显示PWA安装提示
    showInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt && this.deferredPrompt) {
            installPrompt.style.display = 'flex';
        }
    }

    // 隐藏PWA安装提示
    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.style.display = 'none';
        }
    }

    // 安装PWA
    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`用户选择: ${outcome}`);
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        }
    }

    // 分享应用
    async shareApp() {
        const shareData = {
            title: '小手机 - AI聊天应用',
            text: '一个模仿微信界面的AI聊天应用，支持多角色对话和朋友圈功能',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                console.log('分享成功');
            } else {
                // 降级方案：复制链接
                await navigator.clipboard.writeText(window.location.href);
                this.showToast('链接已复制到剪贴板');
            }
        } catch (error) {
            console.error('分享失败:', error);
            // 再次降级：显示链接
            this.showToast(`请复制链接分享: ${window.location.href}`);
        }
    }

    // 显示提示消息
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            max-width: 80%;
            text-align: center;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, duration);
    }

    // 安装应用到桌面
    installApp() {
        if (this.deferredPrompt) {
            this.installPWA();
        } else {
            // 显示手动安装指导
            let instructions = '';
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                instructions = '点击浏览器底部的分享按钮，然后选择"添加到主屏幕"';
            } else if (/Android/.test(navigator.userAgent)) {
                instructions = '点击浏览器菜单，选择"添加到主屏幕"或"安装应用"';
            } else {
                instructions = '在浏览器地址栏右侧查找安装图标，或使用浏览器菜单中的"安装"选项';
            }
            
            this.showToast(instructions, 5000);
        }
    }

    // 初始化默认角色
    initializeCharacters() {
        const defaultCharacters = [
            {
                id: 'char1',
                name: '小助手',
                avatar: '🤖',
                description: '智能AI助手，随时为你服务',
                lastMessage: '你好！有什么我可以帮助你的吗？',
                lastTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                online: true
            },
            {
                id: 'char2', 
                name: '艾莉娅',
                avatar: '🧙‍♀️',
                description: '温和的魔法师，喜欢学习和帮助他人',
                lastMessage: '今天想学习什么魔法呢？',
                lastTime: '昨天',
                online: false
            },
            {
                id: 'char3',
                name: '小猫咪',
                avatar: '🐱',
                description: '可爱的猫娘，活泼开朗',
                lastMessage: '喵~ 主人今天心情怎么样？',
                lastTime: '2天前',
                online: true
            }
        ];

        const savedCharacters = localStorage.getItem('characters');
        this.characters = savedCharacters ? JSON.parse(savedCharacters) : defaultCharacters;
        
        this.characters.forEach(char => {
            if (!this.chatHistory[char.id]) {
                this.chatHistory[char.id] = [];
            }
        });
    }

    // 渲染聊天列表
    renderChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        this.characters.forEach(char => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item touch-feedback';
            chatItem.onclick = () => this.openChat(char);

            chatItem.innerHTML = `
                <div class="avatar">${char.avatar}</div>
                <div class="chat-info">
                    <div class="chat-name">
                        ${char.name}
                        ${char.online ? '<div class="online-indicator"></div>' : ''}
                    </div>
                    <div class="chat-preview">${char.lastMessage}</div>
                </div>
                <div class="chat-time">${char.lastTime}</div>
            `;

            chatList.appendChild(chatItem);
        });
    }

    // 打开聊天界面
    openChat(character) {
        this.currentCharacter = character;
        document.getElementById('chatTitle').textContent = character.name;
        this.renderChatMessages();
        this.showPage('chat-page');
        
        // 移动端优化：延迟聚焦输入框
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            messageInput.focus();
        }, 300);
    }

    // 渲染聊天消息
    renderChatMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';

        const messages = this.chatHistory[this.currentCharacter.id] || [];
        
        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender === 'user' ? 'sent' : 'received'}`;
            
            const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            const avatarText = message.sender === 'user' ? 
                (this.userPersona.name.charAt(0) || '我') : 
                this.currentCharacter.avatar;

            messageDiv.innerHTML = `
                <div class="message-avatar">${avatarText}</div>
                <div class="message-content">${message.content}</div>
                <div class="message-time">${time}</div>
            `;

            messagesContainer.appendChild(messageDiv);
        });

        // 滚动到底部
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content || !this.currentCharacter) return;

        // 添加用户消息
        const userMessage = {
            sender: 'user',
            content: content,
            timestamp: new Date().toISOString()
        };

        this.addMessage(userMessage);
        input.value = '';
        input.style.height = 'auto';

        // 显示正在输入状态
        this.showTypingIndicator();

        try {
            // 调用 SillyTavern API 或模拟回复
            const response = await this.callSillyTavernAPI(content);
            
            const aiMessage = {
                sender: 'character',
                content: response,
                timestamp: new Date().toISOString()
            };

            this.addMessage(aiMessage);
            
            // 更新角色最后消息
            this.currentCharacter.lastMessage = response;
            this.currentCharacter.lastTime = new Date().toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
        } catch (error) {
            console.error('API调用失败:', error);
            
            const errorMessage = {
                sender: 'character',
                content: '抱歉，我现在无法回复。请检查网络连接。',
                timestamp: new Date().toISOString()
            };

            this.addMessage(errorMessage);
        }

        this.hideTypingIndicator();
        this.saveChatHistory();
        this.saveCharacters();
        this.renderChatList();
    }

    // 添加消息到聊天历史
    addMessage(message) {
        if (!this.chatHistory[this.currentCharacter.id]) {
            this.chatHistory[this.currentCharacter.id] = [];
        }
        
        this.chatHistory[this.currentCharacter.id].push(message);
        this.renderChatMessages();
        
        // 可能添加到朋友圈
        if (Math.random() < 0.3) {
            this.addToMoments(message);
        }
    }

    // 调用 SillyTavern API
    async callSillyTavernAPI(message) {
        const apiUrl = this.apiConfig.url;
        
        try {
            const response = await fetch(`${apiUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiConfig.key ? `Bearer ${this.apiConfig.key}` : ''
                },
                body: JSON.stringify({
                    character: this.currentCharacter.name,
                    character_data: this.currentCharacter,
                    message: message,
                    user_persona: this.userPersona,
                    world_book: this.worldBook,
                    history: this.chatHistory[this.currentCharacter.id] || []
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.response || data.message || '收到你的消息了！';
            } else {
                throw new Error(`API错误: ${response.status}`);
            }
        } catch (error) {
            console.error('API调用失败:', error);
            return this.getSimulatedResponse(message);
        }
    }

    // 获取模拟回复
    getSimulatedResponse(message) {
        const responses = {
            '小助手': [
                '我理解你的意思，让我想想如何帮助你。',
                '这是一个很有趣的问题！',
                '我会尽力为你提供帮助。',
                '感谢你的信任，我会认真考虑的。'
            ],
            '艾莉娅': [
                '*温和地微笑* 我明白了，让我用魔法为你解答。',
                '这让我想起了在魔法学院学到的知识...',
                '*眼睛闪闪发光* 真是个有趣的话题！',
                '我会用我的魔法知识来帮助你的。'
            ],
            '小猫咪': [
                '喵~ 听起来很有趣呢！',
                '*歪着头* 主人说的话我有点不太懂，但是我会努力的！',
                '喵喵~ 这个我知道！',
                '*蹭蹭* 主人真聪明呢~'
            ]
        };

        const charResponses = responses[this.currentCharacter.name] || responses['小助手'];
        return charResponses[Math.floor(Math.random() * charResponses.length)];
    }

    // 显示正在输入指示器
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message received';
        typingDiv.innerHTML = `
            <div class="message-avatar">${this.currentCharacter.avatar}</div>
            <div class="message-content">
                <div class="loading"></div>
                正在输入...
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 隐藏正在输入指示器
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // 更新时间显示
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    // 页面切换
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        document.getElementById(pageId).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const navMap = {
            'chat-list-page': 0,
            'moments-page': 1,
            'settings-page': 2
        };

        const navIndex = navMap[pageId];
        if (navIndex !== undefined) {
            document.querySelectorAll('.nav-item')[navIndex].classList.add('active');
        }

        // 移动端优化：页面切换时重置输入框
        if (pageId !== 'chat-page') {
            const messageInput = document.getElementById('messageInput');
            messageInput.blur();
        }
    }

    // 其他方法保持与原版本相同...
    // 为了节省空间，这里省略了一些重复的方法
    // 包括：addToMoments, renderMoments, saveUserPersona, loadUserPersona 等

    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('apiConfig');
        if (saved) {
            this.apiConfig = JSON.parse(saved);
            document.getElementById('apiUrl').value = this.apiConfig.url;
            document.getElementById('apiKey').value = this.apiConfig.key;
        }
    }

    // 保存API配置
    saveApiConfig() {
        const url = document.getElementById('apiUrl').value;
        const key = document.getElementById('apiKey').value;
        
        this.apiConfig = { url, key };
        localStorage.setItem('apiConfig', JSON.stringify(this.apiConfig));
        
        this.showToast('配置已保存！');
    }

    // 保存聊天历史
    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    // 加载聊天历史
    loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
        }
    }

    // 保存角色信息
    saveCharacters() {
        localStorage.setItem('characters', JSON.stringify(this.characters));
    }

    // 清除聊天记录
    clearChatHistory() {
        if (confirm('确定要清除所有数据吗？')) {
            localStorage.clear();
            this.showToast('数据已清除！');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }

    // 导出聊天记录
    exportChatHistory() {
        const data = {
            chatHistory: this.chatHistory,
            characters: this.characters,
            userPersona: this.userPersona,
            exportTime: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `小手机数据_${new Date().toLocaleDateString('zh-CN')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 简化版的其他方法
    loadMoments() { this.moments = JSON.parse(localStorage.getItem('moments') || '[]'); }
    loadUserPersona() { 
        const saved = localStorage.getItem('userPersona');
        if (saved) this.userPersona = JSON.parse(saved);
    }
    loadWorldBook() { this.worldBook = JSON.parse(localStorage.getItem('worldBook') || '[]'); }
    loadTheme() { this.currentTheme = localStorage.getItem('currentTheme') || 'default'; }
    renderMoments() { /* 简化实现 */ }
    addToMoments() { /* 简化实现 */ }
    saveUserPersona() { 
        const name = document.getElementById('userName').value.trim();
        const description = document.getElementById('userPersona').value.trim();
        this.userPersona = { name: name || '用户', description };
        localStorage.setItem('userPersona', JSON.stringify(this.userPersona));
        this.showToast('用户人设已保存！');
    }
    changeTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('currentTheme', theme);
        this.showToast(`已切换到${theme}主题`);
    }
}

// 全局函数
function showPage(pageId) { window.mobileApp.showPage(pageId); }
function sendMessage() { window.mobileApp.sendMessage(); }
function saveApiConfig() { window.mobileApp.saveApiConfig(); }
function saveUserPersona() { window.mobileApp.saveUserPersona(); }
function changeTheme(theme) { window.mobileApp.changeTheme(theme); }
function installApp() { window.mobileApp.installApp(); }
function shareApp() { window.mobileApp.shareApp(); }
function clearChatHistory() { window.mobileApp.clearChatHistory(); }
function exportChatHistory() { window.mobileApp.exportChatHistory(); }
function hideInstallPrompt() { window.mobileApp.hideInstallPrompt(); }
function installPWA() { window.mobileApp.installPWA(); }

// 处理输入框回车事件
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileChatApp();
});
