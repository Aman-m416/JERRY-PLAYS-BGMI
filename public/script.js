// --- 1. TRACKER & MAINTENANCE LOGIC ---
async function updateLiveSlots() {
    try {
        const res = await fetch('/get-status');
        const data = await res.json();

        // 1. Maintenance Check (Fix kiya hua bracket)
        if (data.maintenance) {
            if (!window.location.pathname.includes('admin-dashboard')) {
                document.body.innerHTML = `
                    <div style="background:#050505; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:'Orbitron', sans-serif; text-align:center;">
                        <h1 style="color:#ff6600; font-size:3rem; margin-bottom:10px;">⚠️ UNDER MAINTENANCE</h1>
                        <p style="font-size:1.2rem; color:#888;">Updating the battleground. Registrations will resume shortly!</p>
                        <div style="margin-top:20px; width:50px; height:50px; border:5px solid #333; border-top:5px solid #ff6600; border-radius:50%; animation: spin 1s linear infinite;"></div>
                        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                    </div>`;
                return; // Yahin ruk jayega agar maintenance ON hai
            }
        } // <--- Ye bracket maintenance ke liye hai

        // --- AB YAHAN SE PROGRESS BAR KA CODE CHALEGA ---

        // Schedule Text Update
        const schedule1 = document.getElementById('matchSchedule1');
        const schedule2 = document.getElementById('matchSchedule2');
        if(schedule1) schedule1.innerText = "Match Timing: " + (data.schedule1 || "TBA");
        if(schedule2) schedule2.innerText = "Match Timing: " + (data.schedule2 || "TBA");

        const count = data.count;
        const limit = data.limit;

        // UI Elements uthana
        const fill1 = document.getElementById('fill1');
        const count1 = document.getElementById('count1');
        const status1 = document.getElementById('slot1StatusTag');

        const fill2 = document.getElementById('fill2');
        const count2 = document.getElementById('count2');
        const status2 = document.getElementById('slot2StatusTag');

        const activeTitle = document.getElementById('activeSlotTitle');
        const activeJoined = document.getElementById('slotsJoined');
        const activeFill = document.getElementById('activeFill');
        const btn = document.getElementById("openModal");

        // Safety check
        if (!fill1 || !btn) return;

        // SLOT 1 LOGIC
        if (count < limit) {
            fill1.style.width = `${(count / limit) * 100}%`;
            count1.innerText = `${count} / ${limit}`;
            
            if(activeTitle) activeTitle.innerText = "REGISTERING FOR SLOT 1";
            if(activeJoined) activeJoined.innerText = `${count} / ${limit}`;
            if(activeFill) activeFill.style.width = `${(count / limit) * 100}%`;
        } else {
            fill1.style.width = "100%";
            fill1.style.background = "linear-gradient(90deg, #00f2ff, #0072ff)";
            count1.innerText = "FULL";
            if(status1) {
                status1.innerText = "CLOSED";
                status1.style.background = "#555";
            }

            // SLOT 2 LOGIC
            let slot2Count = count - limit;
            if (slot2Count < limit) {
                if(fill2) fill2.style.width = `${(slot2Count / limit) * 100}%`;
                if(count2) count2.innerText = `${slot2Count} / ${limit}`;

                if(activeTitle) activeTitle.innerText = "REGISTERING FOR SLOT 2";
                if(activeJoined) activeJoined.innerText = `${slot2Count} / ${limit}`;
                if(activeFill) activeFill.style.width = `${(slot2Count / limit) * 100}%`;
            } else {
                // BOTH FULL
                if(fill2) {
                    fill2.style.width = "100%";
                    fill2.style.background = "linear-gradient(90deg, #00f2ff, #0072ff)";
                }
                if(count2) count2.innerText = "FULL";
                if(status2) {
                    status2.innerText = "CLOSED";
                    status2.style.background = "#555";
                }

                if(activeTitle) {
                    activeTitle.innerText = "ALL SLOTS FULL";
                    activeTitle.style.color = "#ff0000";
                }
                if(activeJoined) activeJoined.innerText = `${limit * 2} / ${limit * 2}`;
                if(activeFill) {
                    activeFill.style.width = "100%";
                    activeFill.style.background = "#555";
                }

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
document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'A') {
        adminClickCount++;
        if (adminClickCount === 4) {
            const adminBtn = document.getElementById('hiddenAdminBtn');
            if(adminBtn) {
                adminBtn.style.display = "block";
                alert("⚠️ ADMIN ACCESS GRANTED");
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