document.addEventListener('DOMContentLoaded', () => {
    // กำหนดค่าเริ่มต้นและสถานะของอุปกรณ์
    const mdbButtons = document.querySelectorAll('[id^="MDB"]');
    
    mdbButtons.forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
            const currentStatus = btn.textContent.trim();
            const mdbName = btn.id;
            const outputLog = document.querySelector('.System-Logic---Interconnection-Output-Log, div[style*="Log"]');
            
            if (currentStatus === 'NORMAL' || currentStatus === 'ONLINE') {
                // จำลองเหตุการณ์ Trip / Fault
                btn.textContent = mdbName + ' TRIP';
                btn.style.backgroundColor = '#d9534f'; // สีแดงแจ้งเตือน
                btn.style.borderColor = '#d9534f';
                btn.classList.add('trip-active');
                
                // อัปเดตสถานะ ATS ที่เกี่ยวข้องให้สอดคล้องกัน
                updateAtsStatus(mdbName, 'FAULT');
                updateCounters(1, 0); // เพิ่ม Critical Fault
                
                if(outputLog) {
                    outputLog.innerHTML += `<br>[Alert] ตู้ ${mdbName} เกิดเหตุการณ์ Trip/Fault ระบบป้องกันตัดวงจรทำงาน!`;
                }
            } else {
                // รีเซ็ตกลับเป็นปกติ
                btn.textContent = mdbName + ' NORMAL';
                btn.style.backgroundColor = '#28a745'; // สีเขียวปกติ
                btn.style.borderColor = '#28a745';
                btn.classList.remove('trip-active');
                
                updateAtsStatus(mdbName, 'NORMAL');
                updateCounters(-1, 0);
                
                if(outputLog) {
                    outputLog.innerHTML += `<br>[Normal] ตู้ ${mdbName} กลับเข้าสู่สภาวะปกติ (Normal)`;
                }
            }
        });
    });

    function updateAtsStatus(mdbSource, state) {
        // ค้นหา ATS ที่ผูกกับ MDB นั้นๆ (เช่น MDB1A -> ATS1A)
        const targetAtsId = mdbSource.replace('MDB', 'ATS');
        const atsElement = document.getElementById(targetAtsId) || Array.from(document.querySelectorAll('div')).find(el => el.textContent.includes(targetAtsId));
        
        if (atsElement) {
            if (state === 'FAULT') {
                atsElement.textContent = targetAtsId + ' TRANSFER';
                atsElement.style.backgroundColor = '#f0ad4e'; // สีส้ม (สลับแหล่งจ่าย)
            } else {
                atsElement.textContent = targetAtsId + ' SYNC OK';
                atsElement.style.backgroundColor = '#28a745';
            }
        }
    }

    function updateCounters(critAdd, majAdd) {
        // อัปเดตตัวเลขแจ้งเตือนด้านบน
        const critElem = document.querySelector('div:contains("CRITICAL")') || document.querySelector('.critical-counter');
        // อัปเดตค่าตัวเลขบนหน้าจอตามต้องการ
    }
});