const GROQ_API_KEY = "MASUKIN_API_KEY_DISINI";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";


const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let conversationHistory = [
    { role: "system", content: "Kamu adalah Fitra AI, asisten AI yang ramah, santai, dan helpful. Jawab dengan bahasa Indonesia yang natural." }
];

sendBtn.addEventListener("click", kirimPesan);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") kirimPesan();
});

async function kirimPesan() {
    const pesan = userInput.value.trim();
    if (!pesan) return;

    tambahPesan(pesan, "user");
    userInput.value = "";
    conversationHistory.push({ role: "user", content: pesan });

    const loadingId = tambahPesan("...", "ai");

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


        const data = await response.json();
        const balasan = data.choices[0].message.content;

        document.getElementById(loadingId).remove();
        tambahPesan(balasan, "ai");
        conversationHistory.push({ role: "assistant", content: balasan });

    } catch (error) {
        document.getElementById(loadingId).remove();
        tambahPesan("Error : " + error.message + " | " + JSON.stringify(error), "ai");
    }
}

function tambahPesan(teks, tipe) {
    const id = "msg-" + Date.now();
    const div = document.createElement("div");
    div.className = `message ${tipe}-message`;
    div.id = id;
    const avatar = tipe === "ai" ? "🤖" : "👤";
div.innerHTML = `
<div class="avatar">${avatar}</div>
<div class="bubble">${teks}</div>

`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
}
