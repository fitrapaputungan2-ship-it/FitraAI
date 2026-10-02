const GROQ_API_KEY = "MASUKIN_API_KEY_DISINI";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeScreen = document.getElementById("welcome");

// ============ STATE ============
let conversations = JSON.parse(localStorage.getItem("fitraConversations")) || [];
let activeId = localStorage.getItem("fitraActiveId") || null;

// ============ SIMPAN & LOAD ============
function saveState() {
    localStorage.setItem("fitraConversations", JSON.stringify(conversations));
    localStorage.setItem("fitraActiveId", activeId);
}

function createNewConversation() {
    const id = "conv-" + Date.now();
    const conv = {
        id: id,
        title: "Obrolan Baru",
        messages: [
            { role: "system", content: "Kamu adalah Fitra AI, asisten AI yang ramah, santai, dan helpful. Jawab dengan bahasa Indonesia yang natural." }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    conversations.unshift(conv);
    activeId = id;
    saveState();
    return conv;
}

function getActiveConversation() {
    return conversations.find(c => c.id === activeId);
}

// ============ RENDER SIDEBAR ============
function renderConversationList() {
    const list = document.getElementById("conversationList");
    list.innerHTML = "";
    
    if (conversations.length === 0) {
        list.innerHTML = '<div class="empty-state">Belum ada obrolan</div>';
        return;
    }
    
    conversations.forEach(conv => {
        const item = document.createElement("button");
        item.className = "conversation-item" + (conv.id === activeId ? " active" : "");
        item.innerHTML = `
            <span class="conv-title">${conv.title}</span>
            <span class="conv-delete" data-id="${conv.id}">🗑️</span>
        `;
        
        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("conv-delete")) {
                e.stopPropagation();
                deleteConversation(conv.id);
                return;
            }
            switchConversation(conv.id);
        });
        
        list.appendChild(item);
    });
}

function switchConversation(id) {
    activeId = id;
    saveState();
    renderConversationList();
    renderMessages();
    closeSidebar();
}

function deleteConversation(id) {
    if (!confirm("Hapus obrolan ini?")) return;
    conversations = conversations.filter(c => c.id !== id);
    if (activeId === id) {
        activeId = conversations.length > 0 ? conversations[0].id : null;
    }
    saveState();
    renderConversationList();
    renderMessages();
}

// ============ RENDER MESSAGES ============
function renderMessages() {
    chatContainer.innerHTML = "";
    
    if (!activeId) {
        chatContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = "flex";
        return;
    }
    
    const conv = getActiveConversation();
    if (!conv) return;
    
    const userMessages = conv.messages.filter(m => m.role !== "system");
    
    if (userMessages.length === 0) {
        chatContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = "flex";
    } else {
        welcomeScreen.style.display = "none";
        userMessages.forEach(msg => {
            renderMessage(msg.content, msg.role === "user" ? "user" : "ai");
        });
    }
}

function renderMessage(teks, tipe) {
    const div = document.createElement("div");
    div.className = `message ${tipe}-message`;
    div.innerHTML = `<div class="avatar"></div><div class="bubble">${teks}</div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ============ KIRIM PESAN ============
sendBtn.addEventListener("click", kirimPesan);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") kirimPesan();
});

async function kirimPesan() {
    const pesan = userInput.value.trim();
    if (!pesan) return;
    
    // Bikin percakapan baru kalau belum ada
    if (!activeId) {
        createNewConversation();
    }
    
    const conv = getActiveConversation();
    if (!conv) return;
    
    // Simpen pesan user
    conv.messages.push({ role: "user", content: pesan });
    conv.updatedAt = Date.now();
    
    // Set judul dari pesan pertama
    const userMessages = conv.messages.filter(m => m.role === "user");
    if (userMessages.length === 1) {
        conv.title = pesan.substring(0, 30) + (pesan.length > 30 ? "..." : "");
    }
    
    // Tampilin pesan user
    welcomeScreen.style.display = "none";
    renderMessage(pesan, "user");
    userInput.value = "";
    
    saveState();
    renderConversationList();
    
    // Typing indicator
    const typingId = "typing-" + Date.now();
    const typingDiv = document.createElement("div");
    typingDiv.className = "message ai-message";
    typingDiv.id = typingId;
    typingDiv.innerHTML = `<div class="avatar"></div><div class="typing"><span></span><span></span><span></span></div>`;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    updateStatus("Thinking...");
    
    try {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b",
                messages: conv.messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error("HTTP " + response.status + ": " + errText);
        }
        
        updateStatus("Generating...");
        
        const data = await response.json();
        const balasan = data.choices[0].message.content;
        
        document.getElementById(typingId).remove();
        conv.messages.push({ role: "assistant", content: balasan });
        conv.updatedAt = Date.now();
        saveState();
        
        renderMessage(balasan, "ai");
        updateStatus("Ready");
        
    } catch (error) {
        document.getElementById(typingId).remove();
        renderMessage("Error: " + error.message, "ai");
        updateStatus("Ready");
    }
}

// ============ SUGGESTION CHIPS ============
document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt");
        userInput.value = prompt;
        kirimPesan();
    });
});

// ============ UPDATE STATUS ============
function updateStatus(status) {
    const statusText = document.getElementById("statusText");
    const statusDot = document.querySelector(".status-dot");
    if (statusText) statusText.textContent = status;
    if (statusDot) {
        if (status === "Ready") {
            statusDot.style.background = "#22d3ee";
            statusDot.style.boxShadow = "0 0 8px #22d3ee";
        } else {
            statusDot.style.background = "#a855f7";
            statusDot.style.boxShadow = "0 0 8px #a855f7";
        }
    }
}

// ============ SIDEBAR CONTROL ============
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    sidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
    renderConversationList();
}

function closeSidebar() {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
}

document.getElementById("hamburgerBtn").addEventListener("click", openSidebar);
document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

document.getElementById("newChatBtn").addEventListener("click", () => {
    createNewConversation();
    renderConversationList();
    renderMessages();
    closeSidebar();
});

document.getElementById("menuBtn").addEventListener("click", () => {
    openSidebar();
});

// ============ INIT ============
renderConversationList();
renderMessages();
updateStatus("Ready");
