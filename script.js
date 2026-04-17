let employees = JSON.parse(localStorage.getItem('nado_v4_emps')) || [];
let logs = JSON.parse(localStorage.getItem('nado_v4_logs')) || [];
let expenses = JSON.parse(localStorage.getItem('nado_v4_exps')) || [];
let companyLogo = localStorage.getItem('nado_v4_logo') || "";

// التعامل مع الشعار
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            companyLogo = e.target.result;
            localStorage.setItem('nado_v4_logo', companyLogo);
            alert("تم حفظ الشعار بنجاح!");
        };
        reader.readAsDataURL(file);
    }
}

// دالة توليد رأس التقرير بناءً على الثيم
function getReportHeader(title) {
    const theme = document.getElementById('themeSelect').value;
    const branch = document.getElementById('branchName').value || "المركز الرئيسي";
    let logoHtml = companyLogo ? `<img src="${companyLogo}" class="rep-logo">` : `<h1>NADO LIBYA</h1>`;
    
    return `
        <div class="report-header theme-${theme}">
            <div class="header-top">
                <div class="logo-side">${logoHtml}</div>
                <div class="info-side">
                    <h2>${getReportTitle(title)}</h2>
                    <p>فرع: ${branch}</p>
                </div>
            </div>
            <div class="header-bar"></div>
        </div>
    `;
}

// دالة تذييل التقرير
function getReportFooter() {
    const branch = document.getElementById('branchName').value || "المركز الرئيسي";
    return `
        <div class="report-footer">
            <div class="footer-line"></div>
            <div class="footer-content">
                <span>تاريخ الإصدار: ${new Date().toLocaleString('ar-LY')}</span>
                <span>فرع: ${branch}</span>
                <span>توقيع المحاسب: .....................</span>
            </div>
        </div>
    `;
}

function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'home') updateStats();
    if(id === 'expenses') renderExpenseTable();
    if(id === 'reports') updateDropdowns();
}

function autoCalcRate() {
    let salary = document.getElementById('empSalary').value;
    document.getElementById('hRate').value = (salary / 180).toFixed(2);
}

// تعديل/إضافة مصروف
function saveExpense() {
    let id = document.getElementById('editExpId').value;
    let exp = {
        id: id ? parseInt(id) : Date.now(),
        item: document.getElementById('expItem').value,
        price: parseFloat(document.getElementById('expPrice').value),
        date: document.getElementById('expDate').value
    };

    if(id) {
        let index = expenses.findIndex(x => x.id == id);
        expenses[index] = exp;
    } else {
        expenses.push(exp);
    }

    localStorage.setItem('nado_v4_exps', JSON.stringify(expenses));
    cancelEditExpense();
    renderExpenseTable();
    alert("تم الحفظ بنجاح!");
}

function editExpense(id) {
    let exp = expenses.find(x => x.id == id);
    document.getElementById('editExpId').value = exp.id;
    document.getElementById('expItem').value = exp.item;
    document.getElementById('expPrice').value = exp.price;
    document.getElementById('expDate').value = exp.date;
    
    document.getElementById('expense-form-title').innerText = "تعديل المصروف ✏️";
    document.getElementById('btn-save-exp').innerText = "تحديث البيانات ✅";
    document.getElementById('btn-cancel-exp').style.display = "inline-block";
}

function cancelEditExpense() {
    document.getElementById('editExpId').value = "";
    document.getElementById('expItem').value = "";
    document.getElementById('expPrice').value = "";
    document.getElementById('expDate').value = "";
    document.getElementById('expense-form-title').innerText = "إضافة مصروف جديد 💸";
    document.getElementById('btn-save-exp').innerText = "إضافة المصروف ✅";
    document.getElementById('btn-cancel-exp').style.display = "none";
}

function deleteExpense(id) {
    if(confirm("حذف هذا البند؟")) {
        expenses = expenses.filter(x => x.id !== id);
        localStorage.setItem('nado_v4_exps', JSON.stringify(expenses));
        renderExpenseTable();
    }
}

function renderExpenseTable() {
    let html = `<table class="interactive-table">
                <thead><tr><th>البيان</th><th>التاريخ</th><th>القيمة</th><th>التحكم</th></tr></thead><tbody>`;
    expenses.forEach(x => {
        html += `<tr><td>${x.item}</td><td>${x.date}</td><td>${x.price} د.ل</td>
                 <td>
                    <button class="btn-warn" onclick="editExpense(${x.id})">تعديل ✏️</button>
                    <button class="btn-del" onclick="deleteExpense(${x.id})">حذف 🗑️</button>
                 </td></tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('expense-table-container').innerHTML = html;
}

// التقارير المطورة
function genFullEmpReport() {
    let html = getReportHeader("التقرير العام للرواتب");
    let tableBody = "";
    let grandTotal = 0;

    employees.forEach(e => {
        let eLogs = logs.filter(l => l.empId == e.id);
        let disc = eLogs.reduce((s, l) => s + l.amount, 0);
        let net = e.salary - disc;
        grandTotal += net;
        tableBody += `<tr><td>${e.name}</td><td>${e.job}</td><td>${e.salary}</td><td>${disc}</td><td><b>${net.toFixed(2)}</b></td></tr>`;
    });

    html += `<table><thead><tr><th>الموظف</th><th>المسمى</th><th>الأساسي</th><th>الخصومات</th><th>الصافي</th></tr></thead>
             <tbody>${tableBody}</tbody></table>
             <div class="summary-box">الإجمالي الكلي للصافي: ${grandTotal.toFixed(2)} د.ل</div>`;
    
    html += getReportFooter();
    document.getElementById('report-paper').innerHTML = html;
}

function genFullExpReport() {
    let html = getReportHeader("تقرير المصروفات");
    let total = expenses.reduce((s, x) => s + x.price, 0);
    let tableBody = expenses.map(x => `<tr><td>${x.item}</td><td>${x.date}</td><td>${x.price} د.ل</td></tr>`).join('');
    
    html += `<table><thead><tr><th>البيان</th><th>التاريخ</th><th>القيمة</th></tr></thead><tbody>${tableBody}</tbody></table>
             <div class="summary-box">إجمالي المصروفات: ${total.toFixed(2)} د.ل</div>`;
    
    html += getReportFooter();
    document.getElementById('report-paper').innerHTML = html;
}

function genIndividualReport() {
    let id = document.getElementById('empSelectReport').value;
    let e = employees.find(x => x.id == id);
    if(!e) return alert("اختر موظفاً");

    let eLogs = logs.filter(l => l.empId == id);
    let disc = eLogs.reduce((s, l) => s + l.amount, 0);

    let html = getReportHeader(`كشف مستحقات الموظف`);
    html += `<div class="emp-info-grid"><div><b>الاسم:</b> ${e.name}</div><div><b>الوظيفة:</b> ${e.job}</div></div>`;
    
    let tableBody = eLogs.map(l => `<tr><td>${l.date}</td><td>${l.reason}</td><td>${l.amount}</td></tr>`).join('');
    html += `<table><thead><tr><th>التاريخ</th><th>السبب</th><th>الخصم</th></tr></thead><tbody>${tableBody}</tbody></table>
             <div class="summary-box" style="color:red">صافي المستحق النهائي: ${(e.salary - disc).toFixed(2)} د.ل</div>`;
    
    html += getReportFooter();
    document.getElementById('report-paper').innerHTML = html;
}

// الوظائف المساعدة
function saveEmployee() {
    let emp = { id: Date.now(), name: document.getElementById('empName').value, job: document.getElementById('empJob').value, salary: parseFloat(document.getElementById('empSalary').value) };
    if(!emp.name || !emp.salary) return alert("البيانات ناقصة!");
    employees.push(emp);
    localStorage.setItem('nado_v4_emps', JSON.stringify(employees));
    updateDropdowns();
    alert("تم الحفظ!");
}

function saveActionLog() {
    let log = { id: Date.now(), empId: document.getElementById('empSelectAction').value, date: document.getElementById('actDate').value, reason: document.getElementById('actReason').value, amount: parseFloat(document.getElementById('actAmount').value) || 0 };
    logs.push(log);
    localStorage.setItem('nado_v4_logs', JSON.stringify(logs));
    alert("تم التسجيل!");
}

function updateStats() {
    let totalExp = expenses.reduce((s, x) => s + x.price, 0);
    let totalNetSal = 0;
    employees.forEach(e => {
        let eLogs = logs.filter(l => l.empId == e.id);
        let disc = eLogs.reduce((s, l) => s + l.amount, 0);
        totalNetSal += (e.salary - disc);
    });
    document.getElementById('total-salaries-view').innerText = totalNetSal.toFixed(2) + " د.ل";
    document.getElementById('total-expenses-view').innerText = totalExp.toFixed(2) + " د.ل";
}

function updateDropdowns() {
    let opt = employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    document.getElementById('empSelectAction').innerHTML = opt;
    document.getElementById('empSelectReport').innerHTML = opt;
}

function getReportTitle(baseTitle) {
    let monthInput = document.getElementById('reportMonthSelect').value;
    if(!monthInput) return baseTitle;
    let [year, month] = monthInput.split('-');
    const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${baseTitle} - ${monthsAr[parseInt(month)-1]} ${year}`;
}

function printToPDF() {
    const el = document.getElementById('report-paper');
    html2pdf().set({ margin: 10, filename: 'Nado_Report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(el).save();
}

updateDropdowns();
updateStats();