/**
 * ITB SUSTAINABILITY CALCULATOR - DUAL MODE
 * Handles both 175 and 365 day projections
 */

const JSON_DATA = {
    electricity: {
        winter: 4800,
        variationRate: 0.2281
    },
    water: {
        dailyPerPerson: 133 // Liters/day
    },
    costs: {
        cleaning: 175,
        supplies: 91.25
    }
};

const CO2_FACTOR = 0.259;

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const studentCount = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. WATER LOGIC: Solo días activos
    const totalWaterLitres = studentCount * JSON_DATA.water.dailyPerPerson * selectedDays;

    // 2. ENERGY LOGIC
    // Calculamos consumo activo (12h) y sumamos standby (24h) para el resto de días del año si es 365
    const activeKwh = (pcCount * 200 * 12 * selectedDays) / 1000;
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const standbyKwh = (pcCount * 10 * 24 * standbyDays) / 1000;
    const totalKwh = activeKwh + standbyKwh;

    // 3. FINANCIAL LOGIC
    // 175 días = 3 trimestres | 365 días = 12 meses
    const factor = (selectedDays === 175) ? 3 : 12;
    const cleaningCost = JSON_DATA.costs.cleaning * (selectedDays === 175 ? 3 : 12);
    const suppliesCost = JSON_DATA.costs.supplies * (selectedDays === 175 ? 3 : 12);

    const metrics = [
        { title: "Total Water Use", val: totalWaterLitres.toLocaleString(), unit: "Litres", icon: "💧" },
        { title: "Energy Consumption", val: totalKwh.toFixed(0), unit: "kWh", icon: "⚡" },
        { title: "Carbon Footprint", val: (totalKwh * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "2026 Forecast", val: (totalKwh * (1 + JSON_DATA.electricity.variationRate)).toFixed(0), unit: "kWh (+22%)", icon: "📈" },
        { title: "Cleaning Expenses", val: cleaningCost.toFixed(2), unit: "€ Total", icon: "🧹" },
        { title: "Supplies Expenses", val: suppliesCost.toFixed(2), unit: "€ Total", icon: "📦" },
        { title: "Heat Dissipation", val: (activeKwh * 0.20).toFixed(0), unit: "kWh Waste", icon: "🔥" },
        { title: "Per Student Impact", val: (totalWaterLitres / studentCount).toFixed(0), unit: "Litres/Person", icon: "👤" }
    ];

    grid.innerHTML = "";
    metrics.forEach(m => {
        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <span class="data">${m.val}</span>
                <span class="unit">${m.unit}</span>
            </div>
        `;
    });
}

function applySustainabilityPlan() {
    const dataElements = document.querySelectorAll('.data');
    if (dataElements.length === 0) return;

    dataElements.forEach(el => {
        let text = el.innerText.replace(/,/g, '');
        let rawVal = parseFloat(text);
        if(!isNaN(rawVal)) {
            let reduced = (rawVal * 0.70).toFixed(1);
            el.innerText = parseFloat(reduced).toLocaleString();
            el.style.color = "#22c55e";
        }
    });
    alert("30% Reduction Plan applied successfully.");
}

function exportToPDF() {
    window.print();
}