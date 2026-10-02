const GROQ_API_KEY = "MASUKIN_API_KEY_DISINI";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let conversationHistory = [
    { role: "system", content: "Kamu adalah Fitra AI, asisten AI yang ramah, santai, dan helpful. Jawab dengan bahasa Indonesia yang natural." }
];

// ============ KIRIM PESAN ============
sendBtn.addEventListener("click", kirimPesan);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") kirimPesan();
});

async function kirimPesan() {
    const pesan = userInput.value.trim();
    if (!pesan) return;

    // Hide welcome screen
    const welcome = document.getElementById("welcome");
    if (welcome) welcome.style.display = "none";

    tambahPesan(pesan, "user");
    userInput.value = "";
    conversationHistory.push({ role: "user", content: pesan });

    // Tampilin typing indicator
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
                messages: conversationHistory,
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
        tambahPesan(balasan, "ai");
        conversationHistory.push({ role: "assistant", content: balasan });

        updateStatus("Ready");

    } catch (error) {
        document.getElementById(typingId).remove();
        tambahPesan("Error: " + error.message, "ai");
        updateStatus("Ready");
    }
}

// ============ TAMBAH PESAN ============
function tambahPesan(teks, tipe) {
    const id = "msg-" + Date.now();
    const div = document.createElement("div");
    div.className = `message ${tipe}-message`;
    div.id = id;
    div.innerHTML = `<div class="avatar"></div><div class="bubble">${teks}</div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
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

// ============ MENU BUTTON ============
document.getElementById("menuBtn").addEventListener("click", () => {
    if (confirm("Hapus semua obrolan?")) {
        chatContainer.innerHTML = "";
        conversationHistory = [
            { role: "system", content: "Kamu adalah Fitra AI, asisten AI yang ramah, santai, dan helpful. Jawab dengan bahasa Indonesia yang natural." }
        ];
        location.reload();
    }
});
