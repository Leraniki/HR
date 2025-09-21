// =========================================================================
// ОБЩАЯ ЛОГИКА И УПРАВЛЕНИЕ ДАННЫМИ
// =========================================================================

const newEmployeeTemplate = { name: 'Новый пользователь', role: 'Должность не указана', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto-format=fit=crop', interests: { backend: 0, frontend: 0, dataScience: 0, devops: 0, mobileDev: 0, qa: 0 }, skills: [], achievements: { xp: 0, badges: 0, rating: 999 }, careerPath: [], applications: [] };
const DB = { get: () => JSON.parse(localStorage.getItem('careerAutopilotData')), set: (data) => localStorage.setItem('careerAutopilotData', JSON.stringify(data)), getEmployeeData: () => DB.get().users.employee, getCurrentUser: () => { const data = DB.get(); const loggedInAs = localStorage.getItem('loggedInAs'); return data.users[loggedInAs]; }, setCurrentUser: (userData) => { const data = DB.get(); const loggedInAs = localStorage.getItem('loggedInAs'); data.users[loggedInAs] = userData; DB.set(data); }, setEmployeeData: (employeeData) => { const data = DB.get(); data.users.employee = employeeData; DB.set(data); } };

function initializeData() {
    if (!DB.get()) {
        const defaultData = {
            users: {
                employee: { name: 'Alexey Ivanov', role: 'Middle Backend Developer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto-format=fit-crop', interests: { backend: 8, frontend: 4, dataScience: 7, devops: 5, mobileDev: 2, qa: 3 }, skills: [ { name: 'Python', level: 'Proficient' }, { name: 'Django', level: 'Advanced' }, { name: 'Docker', level: 'Intermediate' } ], achievements: { xp: 4850, badges: 12, rating: 23 }, careerPath: [ { year: '2023 - Present', role: 'Middle Developer', project: 'Project "Omega"' } ], applications: [ { id: 1, position: 'Senior Backend Developer', project: 'Project "Phoenix"', details: 'Мы ищем опытного разработчика для работы над новой высоконагруженной системой.\nТребования: Python, Django, PostgreSQL, Docker.', department: 'Product Development', date: '2023-10-25', status: 'Active', viewedByEmployee: true, response: 'pending' } ] },
                hr: { name: 'Maria Petrova', role: 'HR Manager', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto-format=fit-crop' }
            },
            hrChatHistory: [
                { sender: 'ai', text: 'Hello! I\'m here to help you. Try asking: "Find a senior python developer for project "Phoenix" with skills Docker, Django"' }
            ],
            employeeChatHistory: [
                { sender: 'ai', text: 'Здравствуйте! Чем могу помочь в планировании вашей карьеры?' }
            ],
            rewards: [ { id: 1, title: "Промокод 30% на курс 'Advanced Python'", cost: 1000, img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto-format=fit-crop' }, { id: 2, title: "День дополнительного отпуска", cost: 2500, img: 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?q=80&w=2070&auto=format=fit-crop' }, { id: 3, title: "Сертификат на 50$ для онлайн-библиотеки", cost: 500, img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto-format=fit-crop' } ]
        };
        DB.set(defaultData);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    const pageId = document.body.id;
    if (!['page-landing', 'page-login', 'page-register'].includes(pageId)) { renderHeader(); }
    switch (pageId) {
        case 'page-login': initLoginPage(); break;
        case 'page-register': initRegisterPage(); break;
        case 'page-profile': initProfilePage(); break;
        case 'page-edit-profile': initEditProfilePage(); break;
        case 'page-applications': initApplicationsPage(); break;
        case 'page-gifts': initGiftsPage(); break;
        case 'page-hr-panel': initHrPanelPage(); break;
        case 'page-hr-profile': initHrProfilePage(); break;
        case 'page-hr-applications': initHrApplicationsPage(); break;
        case 'page-hr-edit-profile': initHrEditProfilePage(); break;
    }
});

function renderHeader() { const headerContainer = document.getElementById('header-container'); if (!headerContainer) return; const loggedInAs = localStorage.getItem('loggedInAs'); const viewingAsHR = sessionStorage.getItem('viewingAsHR'); const user = viewingAsHR ? DB.get().users.hr : DB.getCurrentUser(); const effectiveRole = viewingAsHR ? 'hr' : loggedInAs; const employeeData = DB.getEmployeeData(); const hasUnreadEmployee = employeeData.applications.some(app => !app.viewedByEmployee); const hasUnreadHR = employeeData.applications.some(app => app.response !== 'pending' && !app.viewedByHR); const employeeNotification = hasUnreadEmployee ? `<span class="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block notification-dot"></span>` : ''; const hrNotification = hasUnreadHR ? `<span class="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block notification-dot"></span>` : ''; let navLinks = ''; if (effectiveRole === 'employee') { navLinks = `<a href="profile.html" class="text-gray-500 hover:text-accent transition-colors" data-link="profile">My Profile</a> <a href="applications.html" class="text-gray-500 hover:text-accent transition-colors" data-link="applications">Applications${employeeNotification}</a> <a href="gifts.html" class="text-gray-500 hover:text-accent transition-colors" data-link="gifts">Gifts</a>`; } else if (effectiveRole === 'hr') { navLinks = `<a href="hr-panel.html" class="text-gray-500 hover:text-accent transition-colors" data-link="hr-panel">Candidate Search</a> <a href="hr-applications.html" class="text-gray-500 hover:text-accent transition-colors" data-link="hr-applications">Applications${hrNotification}</a>`; } headerContainer.innerHTML = `<nav class="container mx-auto px-6 py-4 flex justify-between items-center"> <a href="${effectiveRole === 'employee' ? 'profile.html' : 'hr-panel.html'}" class="text-xl font-bold text-text-dark">Career on Autopilot</a> <div class="flex items-center space-x-8">${navLinks}</div> <div class="flex items-center space-x-6"> ${effectiveRole === 'hr' ? `<a href="hr-profile.html"><img class="h-10 w-10 rounded-full object-cover" src="${user.avatar}" alt="User Avatar"></a>` : `<img class="h-10 w-10 rounded-full object-cover" src="${user.avatar}" alt="User Avatar">`} <button id="logout-btn" class="text-sm text-gray-500 hover:text-accent">Выйти</button> </div> </nav>`; const currentPage = window.location.pathname.split('/').pop().replace('.html', ''); const activeLink = headerContainer.querySelector(`[data-link*="${currentPage}"]`); if (activeLink) { activeLink.classList.remove('text-gray-500'); activeLink.classList.add('text-accent', 'font-bold', 'border-b-2', 'border-accent', 'pb-1'); } document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('loggedInAs'); sessionStorage.clear(); window.location.href = 'login.html'; }); }

// =========================================================================
// ЛОГИКА СТРАНИЦ
// =========================================================================

function initLoginPage() { document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); const email = document.getElementById('email_login').value; if (email.includes('hr')) { localStorage.setItem('loggedInAs', 'hr'); window.location.href = 'hr-panel.html'; } else { localStorage.setItem('loggedInAs', 'employee'); window.location.href = 'profile.html'; } }); }
function initRegisterPage() { document.getElementById('register-form').addEventListener('submit', (e) => { e.preventDefault(); const selectedRole = document.querySelector('input[name="role"]:checked').value; if (selectedRole === 'hr') { localStorage.setItem('loggedInAs', 'hr'); alert('Вы успешно зарегистрированы как HR-менеджер!'); window.location.href = 'hr-panel.html'; } else { const data = DB.get(); data.users.employee = JSON.parse(JSON.stringify(newEmployeeTemplate)); DB.set(data); localStorage.setItem('loggedInAs', 'employee'); alert('Регистрация прошла успешно! Пожалуйста, заполните ваш профиль.'); window.location.href = 'edit-profile.html'; } }); }

function initEmployeeChat() {
    const chatWindow = document.getElementById('employee-chat-window');
    const chatInput = document.getElementById('employee-chat-input');
    const sendBtn = document.getElementById('employee-chat-send-btn');
    if (!chatWindow || !chatInput || !sendBtn) return;

    const addMessage = (text, sender, persist = true) => {
        const message = document.createElement('div');
        message.className = `flex ${sender === 'user' ? 'justify-end' : ''}`;
        message.innerHTML = `<div class="${sender === 'user' ? 'bg-accent text-white' : 'bg-gray-100'} rounded-lg p-3 max-w-sm"><p>${text}</p></div>`;
        chatWindow.appendChild(message);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        if (persist) {
            const data = DB.get();
            if (!data.employeeChatHistory) data.employeeChatHistory = [];
            data.employeeChatHistory.push({ sender, text });
            DB.set(data);
        }
    };

    const loadChatHistory = () => {
        const data = DB.get();
        chatWindow.innerHTML = '';
        if (data.employeeChatHistory && data.employeeChatHistory.length > 0) {
            data.employeeChatHistory.forEach(msg => addMessage(msg.text, msg.sender, false));
        }
    };

    const getAiResponse = (query) => {
        query = query.toLowerCase();
        if (query.includes('team lead') || query.includes('тимлид')) {
            return 'Чтобы стать Team Lead, важно развивать не только технические, но и "soft skills": лидерство, менторство, умение решать конфликты. Рекомендую пройти курс по управлению командой и взять на себя больше ответственности в текущих проектах.';
        } else if (query.includes('python') || query.includes('пайтон')) {
            return 'Python - отличный выбор! Чтобы улучшить навыки, советую поучаствовать в open-source проектах на GitHub или изучить фреймворки, такие как FastAPI для асинхронных API. Также в нашем магазине наград есть скидки на курсы.';
        } else if (query.includes('навыки') || query.includes('развивать')) {
            return 'Для персональных рекомендаций по развитию, пожалуйста, убедитесь, что ваш профиль в разделе "Skills" и "IT Interests" актуален. Система использует эти данные для подбора курсов и проектов.';
        } else {
            return 'Я могу помочь с вопросами о карьерном росте, развитии навыков и следующих шагах в вашей профессии. Попробуйте переформулировать ваш вопрос.';
        }
    };
    
    const handleSend = () => {
        const query = chatInput.value.trim();
        if (!query) return;
        addMessage(query, 'user');
        chatInput.value = '';
        setTimeout(() => {
            const response = getAiResponse(query);
            addMessage(response, 'ai');
        }, 800);
    };
    
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    loadChatHistory();
}

function initProfilePage() { const viewingAsHR = sessionStorage.getItem('viewingAsHR'); const user = viewingAsHR ? DB.getEmployeeData() : DB.getCurrentUser(); document.getElementById('user-avatar-main').src = user.avatar; document.getElementById('user-name').textContent = user.name; document.getElementById('user-role').textContent = user.role; const careerPathContainer = document.getElementById('career-path-container'); careerPathContainer.innerHTML = user.careerPath.map(p => `<div class="mb-8"><div class="absolute -left-3.5 mt-1.5 h-6 w-6 bg-accent rounded-full border-4 border-white"></div><p class="text-sm text-gray-500">${p.year}</p><h4 class="font-bold">${p.role}</h4><p class="text-sm text-gray-600">${p.project}</p></div>`).join(''); const interestsContainer = document.getElementById('interests-container'); interestsContainer.innerHTML = Object.entries(user.interests).map(([key, value]) => `<div class="flex items-center gap-4"><span class="w-32 capitalize">${key.replace('dataScience', 'Data Science').replace('mobileDev', 'Mobile Dev')}</span><div class="w-full bg-secondary-bg rounded-full h-2.5"><div class="bg-accent h-2.5 rounded-full" style="width: ${value * 10}%"></div></div><span class="font-bold">${value}/10</span></div>`).join(''); const skillsContainer = document.getElementById('skills-container'); skillsContainer.innerHTML = user.skills.map(skill => { const levelWidths = { 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Proficient': 100 }; return `<div><div class="flex justify-between mb-1"><span class="font-bold">${skill.name}</span><span class="text-sm text-gray-500">${skill.level}</span></div><div class="w-full bg-secondary-bg rounded-full h-2.5"><div class="bg-accent h-2.5 rounded-full" style="width: ${levelWidths[skill.level] || 10}%"></div></div></div>`; }).join(''); if (user.skills.length === 0) { skillsContainer.innerHTML = `<p class="text-gray-500">Навыки еще не добавлены. <a href="edit-profile.html" class="text-accent underline">Добавить</a>.</p>` } document.getElementById('badges-count').textContent = user.achievements.badges; document.getElementById('xp-count').textContent = user.achievements.xp.toLocaleString('ru-RU'); document.getElementById('rating-position').textContent = `#${user.achievements.rating}`; const level = Math.floor(user.achievements.xp / 1000) + 1; const xpForLevel = user.achievements.xp % 1000; document.getElementById('level-text').textContent = `Level Progress (Lv. ${level})`; document.getElementById('level-xp-text').textContent = `${xpForLevel} / 1000 XP`; document.getElementById('level-progress-bar').style.width = `${xpForLevel / 10}%`; if (viewingAsHR) { document.getElementById('edit-profile-link').style.display = 'none'; document.getElementById('ai-advisor-chat-block').style.display = 'none'; sessionStorage.removeItem('viewingAsHR'); } else { initEmployeeChat(); } }
function sendOfferToEmployee(position, project, details) { const employee = DB.getEmployeeData(); const today = new Date().toISOString().slice(0, 10); const hasExistingOffer = employee.applications.some(app => app.position === position && app.status === 'Active'); if (hasExistingOffer) { alert(`Предложение на позицию "${position}" уже было отправлено.`); return; } employee.applications.unshift({ id: Date.now(), position, project, details, department: 'Internal Mobility', date: today, status: 'Active', viewedByEmployee: false, viewedByHR: true, response: 'pending' }); DB.setEmployeeData(employee); alert(`Предложение успешно отправлено кандидату ${employee.name}!`); renderHeader(); }
function initEditProfilePage() { const user = DB.getCurrentUser(); let tempUser = JSON.parse(JSON.stringify(user)); const avatarPreview = document.getElementById('avatar-preview'); const nameInput = document.getElementById('name-input'); const roleInput = document.getElementById('role-input'); const interestsContainer = document.getElementById('interests-edit-container'); const skillsContainer = document.getElementById('skills-container'); avatarPreview.src = tempUser.avatar; nameInput.value = tempUser.name; roleInput.value = tempUser.role; interestsContainer.innerHTML = Object.entries(tempUser.interests).map(([key, value]) => `<div class="flex items-center gap-4"><span class="w-32 capitalize">${key.replace('dataScience', 'Data Science').replace('mobileDev', 'Mobile Dev')}</span><input type="range" min="0" max="10" value="${value}" data-interest="${key}" class="w-full interest-slider"><span class="font-bold w-10 text-center">${value}/10</span></div>`).join(''); const renderSkills = () => { skillsContainer.innerHTML = tempUser.skills.map((skill, index) => ` <div class="flex items-center gap-4 p-3 bg-secondary-bg rounded-xl"><span class="font-medium flex-grow">${skill.name}</span><select data-index="${index}" class="skill-level-select border border-gray-300 rounded-lg"><option ${skill.level === 'Beginner' ? 'selected' : ''}>Beginner</option><option ${skill.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option><option ${skill.level === 'Advanced' ? 'selected' : ''}>Advanced</option><option ${skill.level === 'Proficient' ? 'selected' : ''}>Proficient</option></select><button data-index="${index}" class="delete-skill-btn text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button></div>`).join(''); }; renderSkills(); document.getElementById('avatar-upload').addEventListener('change', e => { const reader = new FileReader(); const file = e.target.files[0]; if (file) reader.readAsDataURL(file); reader.onload = () => avatarPreview.src = tempUser.avatar = reader.result; }); interestsContainer.addEventListener('input', e => { if (e.target.classList.contains('interest-slider')) { const key = e.target.dataset.interest; const value = e.target.value; tempUser.interests[key] = parseInt(value); e.target.nextElementSibling.textContent = `${value}/10`; } }); document.getElementById('add-skill-btn').addEventListener('click', () => { const input = document.getElementById('new-skill-input'); if (input.value) { tempUser.skills.push({ name: input.value, level: 'Beginner' }); input.value = ''; renderSkills(); } }); skillsContainer.addEventListener('click', e => { if (e.target.closest('.delete-skill-btn')) { tempUser.skills.splice(e.target.closest('.delete-skill-btn').dataset.index, 1); renderSkills(); } }); skillsContainer.addEventListener('change', e => { if (e.target.classList.contains('skill-level-select')) { tempUser.skills[e.target.dataset.index].level = e.target.value; } }); document.getElementById('save-profile-btn').addEventListener('click', () => { tempUser.name = nameInput.value; tempUser.role = roleInput.value; DB.setCurrentUser(tempUser); alert('Профиль сохранен!'); window.location.href = 'profile.html'; }); }
function initApplicationsPage() { const user = DB.getCurrentUser(); const tbody = document.getElementById('applications-tbody'); const modal = document.getElementById('application-modal'); const modalContent = document.getElementById('modal-content'); user.applications.forEach(app => app.viewedByEmployee = true); DB.setCurrentUser(user); renderHeader(); const statusClasses = { Active: 'bg-blue-100 text-blue-800', Accepted: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' }; const renderApplications = (filter) => { const filteredApps = user.applications.filter(app => app.status === filter); tbody.innerHTML = filteredApps.map(app => `<tr data-id="${app.id}" class="border-t clickable-row"><td class="p-4 font-bold">${app.position}</td><td class="p-4">${app.department}</td><td class="p-4">${app.date}</td><td class="p-4"><span class="px-2 py-1 text-xs font-bold rounded-full ${statusClasses[app.status] || ''}">${app.status === 'Active' ? 'Ожидает ответа' : app.status}</span></td></tr>`).join(''); if(filteredApps.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-500">Заявок в этой категории нет.</td></tr>`; }; const openModal = (app) => { modal.querySelector('#modal-title').textContent = app.position; modal.querySelector('#modal-project').textContent = app.project; modal.querySelector('#modal-details').textContent = app.details; const actionsContainer = modal.querySelector('#modal-actions'); if (app.status === 'Active') { actionsContainer.innerHTML = `<button data-id="${app.id}" data-action="reject" class="modal-action-btn px-6 py-2 rounded-xl bg-secondary-bg text-text-dark font-bold hover:bg-gray-200">Отклонить</button><button data-id="${app.id}" data-action="accept" class="modal-action-btn px-6 py-2 rounded-xl bg-accent text-white font-bold hover:bg-blue-600">Принять предложение</button>`; } else { actionsContainer.innerHTML = ''; } modal.classList.remove('hidden'); setTimeout(() => modalContent.classList.add('scale-100', 'opacity-100'), 10); }; const closeModal = () => { modalContent.classList.remove('scale-100', 'opacity-100'); setTimeout(() => modal.classList.add('hidden'), 200); }; tbody.addEventListener('click', e => { const row = e.target.closest('tr'); if (!row || !row.dataset.id) return; const app = user.applications.find(a => a.id == row.dataset.id); if (app) openModal(app); }); modal.addEventListener('click', e => { if (e.target.id === 'modal-close-btn' || e.target.id === 'application-modal') closeModal(); const actionBtn = e.target.closest('.modal-action-btn'); if (actionBtn) { const appId = actionBtn.dataset.id; const action = actionBtn.dataset.action; const app = user.applications.find(a => a.id == appId); if(app) { app.status = action === 'accept' ? 'Accepted' : 'Rejected'; app.response = action === 'accept' ? 'accepted' : 'rejected'; app.viewedByHR = false; DB.setCurrentUser(user); renderApplications(document.querySelector('.filter-btn.text-accent').dataset.filter); closeModal(); } } }); document.getElementById('filter-tabs').addEventListener('click', e => { if (e.target.classList.contains('filter-btn')) { document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('text-accent', 'border-accent')); e.target.classList.add('text-accent', 'border-accent'); renderApplications(e.target.dataset.filter); } }); renderApplications('Active'); }
function initGiftsPage() { const user = DB.getCurrentUser(); const data = DB.get(); const xpBalanceEl = document.getElementById('xp-balance'); const rewardsGrid = document.getElementById('rewards-grid'); const render = () => { xpBalanceEl.textContent = user.achievements.xp.toLocaleString('ru-RU'); rewardsGrid.innerHTML = data.rewards.map(reward => { const canAfford = user.achievements.xp >= reward.cost; return `<div class="bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col"><img src="${reward.img}" alt="${reward.title}" class="w-full h-40 object-cover"><div class="p-6 flex-grow flex flex-col"><h3 class="text-lg font-bold flex-grow">${reward.title}</h3><p class="text-gray-500 mt-2">Cost: <span class="font-bold text-text-dark">${reward.cost.toLocaleString('ru-RU')} XP</span></p><button data-cost="${reward.cost}" ${!canAfford ? 'disabled' : ''} class="claim-reward-btn w-full mt-4 py-2 text-white font-bold rounded-xl transition-colors ${canAfford ? 'bg-accent hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}">Claim Reward</button></div></div>`; }).join(''); }; rewardsGrid.addEventListener('click', e => { if (e.target.classList.contains('claim-reward-btn')) { const cost = parseInt(e.target.dataset.cost); if (user.achievements.xp >= cost) { user.achievements.xp -= cost; DB.setCurrentUser(user); alert('Поздравляем с приобретением!'); render(); } } }); render(); }

// ИСПРАВЛЕННАЯ ФУНКЦИЯ
function initHrPanelPage() {
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const resultsContainer = document.getElementById('search-results-container');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    
    let currentSearchQuery = {};

    const addMessage = (text, sender, persist = true) => {
        const message = document.createElement('div');
        message.className = `flex ${sender === 'user' ? 'justify-end' : ''}`;
        message.innerHTML = `<div class="${sender === 'user' ? 'bg-accent text-white' : 'bg-gray-100'} rounded-lg p-3 max-w-lg"><p>${text}</p></div>`;
        chatWindow.appendChild(message);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        if (persist) {
            const data = DB.get();
            data.hrChatHistory.push({ sender, text });
            DB.set(data);
        }
    };
    
    const loadChatHistory = () => {
        const data = DB.get();
        chatWindow.innerHTML = '';
        if (data.hrChatHistory && data.hrChatHistory.length > 0) {
            data.hrChatHistory.forEach(msg => addMessage(msg.text, msg.sender, false));
        }
    };
    
    function parseHrQuery(query) { query = query.toLowerCase(); const parsed = { position: 'Новая должность', project: 'Внутренний проект', details: `Полное описание вакансии на основе вашего запроса:\n"${query}"` }; const positionMatch = query.match(/(?:a|an)?\s*(senior|junior|middle|lead)?\s*([\w\s]+?)\s*(developer|engineer|manager|lead)/); if (positionMatch) { parsed.position = positionMatch[0].trim().replace(/\b\w/g, l => l.toUpperCase()); } const projectMatch = query.match(/for project\s+(['"]?)([\w\s]+)\1/); if (projectMatch) { parsed.project = projectMatch[2].trim().replace(/\b\w/g, l => l.toUpperCase()); } const skillsMatch = query.match(/(?:needs|with skills|requiring)\s+([\w\s,]+)/); if (skillsMatch) { parsed.details += `\n\nКлючевые требования: ${skillsMatch[1].trim()}`; } return parsed; }
    
    const renderResults = (employee) => {
        resultsContainer.innerHTML = `<div class="p-4 rounded-xl border flex items-center justify-between group hover:bg-blue-50 transition-colors"><div class="flex items-center gap-4"><img class="h-12 w-12 rounded-full object-cover" src="${employee.avatar}" alt="Candidate"><div><p class="font-bold">${employee.name}</p><p class="text-sm text-gray-500">${employee.role}</p></div></div><div class="flex items-center gap-2"><button class="view-profile-btn px-4 py-2 text-sm rounded-xl bg-secondary-bg font-bold">View Profile</button><button class="send-offer-btn px-4 py-2 text-sm rounded-xl bg-accent text-white font-bold">Send Offer</button></div></div>`;
        document.querySelector('.view-profile-btn').addEventListener('click', () => { sessionStorage.setItem('viewingAsHR', 'true'); window.location.href = 'profile.html'; });
        document.querySelector('.send-offer-btn').addEventListener('click', () => { sendOfferToEmployee(currentSearchQuery.position, currentSearchQuery.project, currentSearchQuery.details); });
    };
    
    const performSearch = (query) => {
        currentSearchQuery = parseHrQuery(query);
        setTimeout(() => {
            const employee = DB.getEmployeeData();
            const keywords = query.toLowerCase().split(/\s*,\s*|\s+/);
            const employeeSkills = employee.skills.map(s => s.name.toLowerCase());
            const isMatch = keywords.some(kw => employeeSkills.includes(kw) || employee.role.toLowerCase().includes(kw));
            
            if (isMatch) {
                addMessage(`Нашла подходящего кандидата для позиции "${currentSearchQuery.position}".`, 'ai');
                renderResults(employee);
                sessionStorage.setItem('lastHrSearchQuery', query);
            } else {
                addMessage('Извините, по вашему запросу никого не найдено. Попробуйте уточнить требования.', 'ai');
                resultsContainer.innerHTML = `<div class="text-center py-20 text-gray-500"><p>No candidates found...</p></div>`;
                sessionStorage.removeItem('lastHrSearchQuery');
            }
        }, 500);
    };

    const handleSend = () => {
        const query = chatInput.value.trim();
        if (!query) return;
        addMessage(query, 'user');
        chatInput.value = '';
        performSearch(query);
    };

    clearChatBtn.addEventListener('click', () => {
        const data = DB.get();
        data.hrChatHistory = [ { sender: 'ai', text: 'Hello! I\'m here to help you. Try asking: "Find a senior python developer for project "Phoenix" with skills Docker, Django"' } ];
        DB.set(data);
        loadChatHistory();
        resultsContainer.innerHTML = `<div class="text-center py-20 text-gray-500"><p>Ask AI Assistant to find candidates</p></div>`;
        sessionStorage.removeItem('lastHrSearchQuery');
    });

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    // ИЗМЕНЕННАЯ ЛОГИКА ЗАГРУЗКИ
    loadChatHistory(); // 1. Сначала загружаем чат
    const savedQuery = sessionStorage.getItem('lastHrSearchQuery');
    if (savedQuery) {
        // 2. Если был поиск, просто рендерим результат без добавления в чат
        currentSearchQuery = parseHrQuery(savedQuery);
        renderResults(DB.getEmployeeData());
    }
}

function initHrProfilePage() { const user = DB.getCurrentUser(); document.getElementById('hr-avatar').src = user.avatar; document.getElementById('hr-name').textContent = user.name; document.getElementById('hr-role').textContent = user.role; }
function initHrApplicationsPage() { let employeeData = DB.getEmployeeData(); const tbody = document.getElementById('hr-applications-tbody'); employeeData.applications.forEach(app => { if (app.response !== 'pending') app.viewedByHR = true; }); DB.setEmployeeData(employeeData); renderHeader(); const responseClasses = { pending: 'bg-gray-100 text-gray-800', accepted: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }; const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1); const renderApplications = (filter) => { const filterMap = { Pending: 'pending', Accepted: 'accepted', Rejected: 'rejected' }; const filteredApps = employeeData.applications.filter(app => app.response === filterMap[filter]); tbody.innerHTML = filteredApps.map(app => `<tr class="border-t"><td class="p-4 font-bold">${employeeData.name}</td><td class="p-4">${app.position}</td><td class="p-4">${app.date}</td><td class="p-4"><span class="px-2 py-1 text-xs font-bold rounded-full ${responseClasses[app.response] || ''}">${capitalize(app.response)}</span></td></tr>`).join(''); if(filteredApps.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-500">Заявок в этой категории нет.</td></tr>`; }; document.getElementById('filter-tabs').addEventListener('click', e => { if (e.target.classList.contains('filter-btn')) { document.querySelectorAll('.filter-btn').forEach(btn => { btn.classList.remove('text-accent', 'border-b-2', 'border-accent'); btn.classList.add('text-gray-500'); }); e.target.classList.add('text-accent', 'border-b-2', 'border-accent'); e.target.classList.remove('text-gray-500'); renderApplications(e.target.dataset.filter); } }); renderApplications('Pending'); }
function initHrEditProfilePage() { const user = DB.getCurrentUser(); let tempUser = JSON.parse(JSON.stringify(user)); const avatarPreview = document.getElementById('hr-avatar-preview'); const nameInput = document.getElementById('hr-name-input'); const roleInput = document.getElementById('hr-role-input'); const saveBtn = document.getElementById('save-hr-profile-btn'); const uploadInput = document.getElementById('hr-avatar-upload'); avatarPreview.src = tempUser.avatar; nameInput.value = tempUser.name; roleInput.value = tempUser.role; uploadInput.addEventListener('change', e => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = () => { const result = reader.result; avatarPreview.src = result; tempUser.avatar = result; }; reader.readAsDataURL(file); } }); saveBtn.addEventListener('click', () => { tempUser.name = nameInput.value; tempUser.role = roleInput.value; DB.setCurrentUser(tempUser); alert('Профиль HR сохранен!'); window.location.href = 'hr-profile.html'; }); }