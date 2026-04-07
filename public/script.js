// --- 1. TRACKER & MAINTENANCE LOGIC (Updated for 4 Slots) ---
async function updateLiveSlots() {
    try {
        const res = await fetch('/get-status');
        const data = await res.json();

        // 1. Maintenance Check
        if (data.maintenance) {
            if (!window.location.pathname.includes('admin-dashboard')) {
                document.body.innerHTML = `
                    <div style="background:#050505; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:'Orbitron', sans-serif; text-align:center;">
                        <h1 style="color:#ff6600; font-size:3rem; margin-bottom:10px;">⚠️ UNDER MAINTENANCE</h1>
                        <p style="font-size:1.2rem; color:#888;">Updating the battleground. Registrations will resume shortly!</p>
                        <div style="margin-top:20px; width:50px; height:50px; border:5px solid #333; border-top:5px solid #ff6600; border-radius:50%; animation: spin 1s linear infinite;"></div>
                        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                    </div>`;
                return;
            }
        }

        // 2. Schedule Text Updates (For all 4 slots)
        for (let i = 1; i <= 4; i++) {
            const schEl = document.getElementById(`matchSchedule${i}`);
            if (schEl) schEl.innerText = "Match Timing: " + (data[`schedule${i}`] || "TBA");
        }

        const count = data.count;
        const limit = data.limit; // This is 25

        // UI Elements uthana
        // --- Slot 1 ---
const fill1 = document.getElementById('fill1');
const count1 = document.getElementById('count1');
const status1 = document.getElementById('slot1StatusTag');

// --- Slot 2 ---
const fill2 = document.getElementById('fill2');
const count2 = document.getElementById('count2');
const status2 = document.getElementById('slot2StatusTag');

// --- Slot 3 (Naya add kiya) ---
const fill3 = document.getElementById('fill3');
const count3 = document.getElementById('count3');
const status3 = document.getElementById('slot3StatusTag');

// --- Slot 4 (Naya add kiya) ---
const fill4 = document.getElementById('fill4');
const count4 = document.getElementById('count4');
const status4 = document.getElementById('slot4StatusTag');

// --- Common Elements ---
const activeTitle = document.getElementById('activeSlotTitle');
const activeJoined = document.getElementById('slotsJoined');
const activeFill = document.getElementById('activeFill');
const btn = document.getElementById("openModal");

        // 3. Loop through 4 Slots to update Progress Bars & Tags
        for (let i = 1; i <= 4; i++) {
            const fill = document.getElementById(`fill${i}`);
            const countText = document.getElementById(`count${i}`);
            const statusTag = document.getElementById(`slot${i}StatusTag`);

            if (!fill) continue;

            // Calculate teams specifically in THIS slot
            // Example: If count is 30, Slot 1 is 25 (Full), Slot 2 is 5
            let teamsInThisSlot = Math.min(Math.max(count - (limit * (i - 1)), 0), limit);

            if (teamsInThisSlot >= limit) {
                // SLOT FULL
                fill.style.width = "100%";
                fill.style.background = "linear-gradient(90deg, #00f2ff, #0072ff)";
                if (countText) countText.innerText = "FULL";
                if (statusTag) {
                    statusTag.innerText = "CLOSED";
                    statusTag.style.background = "#555";
                }
            } else {
                // SLOT OPEN or EMPTY
                fill.style.width = `${(teamsInThisSlot / limit) * 100}%`;
                if (countText) countText.innerText = `${teamsInThisSlot} / ${limit}`;
                if (statusTag) {
                    statusTag.innerText = "OPEN";
                    statusTag.style.background = "#00f2ff";
                }
            }
        }

        if (count < (limit * 4)) {
            let currentSlot = Math.floor(count / limit) + 1;
            let currentSlotCount = count % limit;

            if (activeTitle) activeTitle.innerText = `REGISTERING FOR SLOT ${currentSlot}`;
            if (activeJoined) activeJoined.innerText = `${currentSlotCount} / ${limit}`;
            if (activeFill) activeFill.style.width = `${(currentSlotCount / limit) * 100}%`;
        } else {
            // ALL 4 SLOTS ARE FULL
            if (activeTitle) {
                activeTitle.innerText = "ALL SLOTS FULL";
                activeTitle.style.color = "#ff0000";
            }
            if (activeJoined) activeJoined.innerText = `${limit * 4} / ${limit * 4}`;
            if (activeFill) {
                activeFill.style.width = "100%";
                activeFill.style.background = "#555";
            }
            if (btn) {
                btn.innerText = "REGISTRATIONS CLOSED";
                btn.style.background = "#333";
                btn.style.cursor = "not-allowed";
                btn.disabled = true;
            }
        }

    } catch (err) {
        console.log("Tracker Error:", err);
    }
}
window.onload = updateLiveSlots;

// --- 2. FORM & MODAL LOGIC ---
const yearSelect = document.getElementById('birthYear');
if(yearSelect) {
    const currentYear = new Date().getFullYear();
    const latestAllowedYear = currentYear - 18;
    for (let i = latestAllowedYear; i >= 1950; i--) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        yearSelect.appendChild(opt);
    }
}

const modal = document.getElementById("regModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.querySelector(".close-btn");

if(openBtn) openBtn.onclick = () => modal.style.display = "flex";
if(closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

// Registration Form Submit
const regForm = document.getElementById("registrationForm");
if(regForm) {
    regForm.onsubmit = async (e) => {
        e.preventDefault();

        const birthYear = parseInt(document.getElementById('birthYear').value);
        const currentYear = new Date().getFullYear();
        
        if ((currentYear - birthYear) < 18) {
            alert("🚨 ACCESS DENIED: 18+ Only!");
            return; 
        }

        const submitBtn = e.target.querySelector('.submit-btn');
        submitBtn.innerText = "UPLOADING & REGISTERING...";
        submitBtn.disabled = true;

        const formData = new FormData();
formData.append('teamName', document.getElementById('teamName').value);
formData.append('leaderIGN', document.getElementById('leaderIGN').value);
formData.append('leaderID', document.getElementById('leaderID').value);
formData.append('whatsapp', document.getElementById('whatsapp').value);
formData.append('player2Name', document.getElementById('player2Name').value); // Naya
formData.append('player3Name', document.getElementById('player3Name').value); // Naya
formData.append('player4Name', document.getElementById('player4Name').value); // Naya
formData.append('birthYear', birthYear);
        
        const fileInput = document.getElementById('screenshot');
        if (fileInput && fileInput.files.length > 0) {
            formData.append('screenshot', fileInput.files[0]);
        } else {
            alert("Please upload payment screenshot!");
            submitBtn.disabled = false;
            submitBtn.innerText = "CONFIRM REGISTRATION";
            return;
        }

        try {
            const response = await fetch('/register', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) { 
                alert("✅ Registration Successful! Slot #" + result.slot + " Reserved.");
                location.reload(); 
            } else { 
                alert(result.message); 
                submitBtn.innerText = "CONFIRM REGISTRATION";
                submitBtn.disabled = false; 
            }
        } catch (err) { 
            alert("Server Error! Check backend."); 
            submitBtn.disabled = false; 
        }
    };
}

// --- 3. UI EXTRAS (CURSOR, RULES, ADMIN) ---
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
});

let adminClickCount = 0;
const ADMIN_PASSWORD = "jerry730"; // Apna password yahan set karo

document.addEventListener('keydown', (e) => {
    // Shift + A combination
    if (e.shiftKey && e.key === 'A') {
        adminClickCount++;
        
        if (adminClickCount === 4) {
            let pass = prompt("⚠️ ADMIN ACCESS REQUIRED\nEnter Secret Key:");

            if (pass === ADMIN_PASSWORD) {
                // 1. Session Start Karo (1 Hour Expiry)
                localStorage.setItem("isAdmin", "true");
                localStorage.setItem("adminExpiry", Date.now() + 3600000);
                
                alert("✅ ACCESS GRANTED! Redirecting to Dashboard...");
                
                // 2. AUTO REDIRECT (Yahan apne admin page ka sahi naam dalo)
                window.location.href = "admin-dashboard.html"; 
                
            } else {
                alert("❌ ACCESS DENIED: Galat password hai!");
                adminClickCount = 0; // Reset count
            }
        }
    }
});

const rulesModal = document.getElementById("rulesModal");
const openRulesNav = document.getElementById("openRulesNav");
const openRulesLink = document.getElementById("openRulesLink");
const closeRules = document.querySelector(".close-rules");

if(openRulesNav) openRulesNav.onclick = () => rulesModal.style.display = "flex";
if(openRulesLink) openRulesLink.onclick = () => rulesModal.style.display = "flex";
if(closeRules) closeRules.onclick = () => rulesModal.style.display = "none";
