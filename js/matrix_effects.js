/**
 * ITB INFRASTRUCTURE ANALYZER - PHASE 3
 * Updated: Removed PSU Heat Waste | Added Resource Load Index
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133 },
    costs: { cleaning: 175, supplies: 91.25 }
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. WATER: Facility operational cost
    const totalWaterLitres = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;

    // 2. ENERGY: Active + Standby
    const activeKwh = (pcCount * PC_WATTAGE * 12 * selectedDays) / 1000;
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const standbyKwh = (pcCount * STANDBY_WATTAGE * 24 * standbyDays) / 1000;
    const totalEnergy = activeKwh + standbyKwh;

    // 3. MAINTENANCE
    const expenseFactor = (selectedDays === 175) ? 3 : 12;
    const cleaningTotal = INFRA_DATA.costs.cleaning * expenseFactor;
    const suppliesTotal = INFRA_DATA.costs.supplies * expenseFactor;

    // 4. NEW METRIC: Resource Load Index (Water Litres per Active Node)
    const resourceIndex = pcCount > 0 ? (totalWaterLitres / pcCount).toFixed(0) : 0;

    const metrics = [
        { title: "Total Facility Water", val: totalWaterLitres.toLocaleString(), unit: "Litres", icon: "💧" },
        { title: "System Energy Load", val: totalEnergy.toFixed(0), unit: "kWh/Year", icon: "🖥️" },
        { title: "Carbon Footprint", val: (totalEnergy * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Standby Leakage", val: standbyKwh.toFixed(1), unit: "kWh (Idle)", icon: "🔌" },
        { title: "Resource Load Index", val: parseInt(resourceIndex).toLocaleString(), unit: "L/Node", icon: "📊" },
        { title: "Maintenance Costs", val: cleaningTotal.toFixed(2), unit: "€", icon: "🛠️" },
        { title: "2026 Energy Forecast", val: (totalEnergy * (1 + INFRA_DATA.electricity.variationRate)).toFixed(0), unit: "kWh", icon: "📈" },
        { title: "Optimized Target", val: (totalEnergy * 0.70).toFixed(0), unit: "kWh (-30%)", icon: "🎯" }
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
        let rawVal = parseFloat(el.innerText.replace(/,/g, ''));
        if(!isNaN(rawVal)) {
            let reduced = (rawVal * 0.70).toFixed(1);
            el.innerText = parseFloat(reduced).toLocaleString();
            el.style.color = "#22c55e";
        }
    });
    alert("30% Optimization Plan: PSU upgrades and Cloud Consolidation applied.");
}

function exportToPDF() {
    window.print();
}