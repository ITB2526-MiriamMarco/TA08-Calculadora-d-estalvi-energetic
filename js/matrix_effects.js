/**
 * ITB INFRASTRUCTURE ANALYZER - PHASE 3
 * Technical logic for IT systems and facility management
 */

// 1. Data Source from dataclean.json and technical standards
const INFRA_DATA = {
    electricity: {
        variationRate: 0.2281 // 22.81% increase forecast
    },
    water: {
        fixedDailyPerPax: 133 // Operational fixed cost per occupancy
    },
    costs: {
        cleaning: 175,
        supplies: 91.25
    }
};

const PC_WATTAGE = 200;      // Active Tower PC
const STANDBY_WATTAGE = 10;  // Idle/Sleep mode
const CO2_FACTOR = 0.259;    // kg CO2 per kWh

/**
 * Main Infrastructure Calculation
 */
function runCalculations() {
    // Inputs
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. WATER: Facility operational cost (Fixed)
    const totalWaterLitres = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;

    // 2. ENERGY: Active (12h/day) + Standby for non-active days
    const activeKwh = (pcCount * PC_WATTAGE * 12 * selectedDays) / 1000;

    // Standby days are the remaining days of the year (365 - selected)
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const standbyKwh = (pcCount * STANDBY_WATTAGE * 24 * standbyDays) / 1000;
    const totalEnergy = activeKwh + standbyKwh;

    // 3. MAINTENANCE: Scaled by period
    const expenseFactor = (selectedDays === 175) ? 3 : 12; // 3 terms vs 12 months
    const cleaningTotal = INFRA_DATA.costs.cleaning * expenseFactor;
    const suppliesTotal = INFRA_DATA.costs.supplies * expenseFactor;

    const metrics = [
        { title: "Total Facility Water", val: totalWaterLitres.toLocaleString(), unit: "Litres", icon: "💧" },
        { title: "System Energy Load", val: totalEnergy.toFixed(0), unit: "kWh/Year", icon: "🖥️" },
        { title: "Carbon Footprint", val: (totalEnergy * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Standby Leakage", val: standbyKwh.toFixed(1), unit: "kWh (Idle)", icon: "🔌" },
        { title: "PSU Heat Waste", val: (activeKwh * 0.20).toFixed(0), unit: "kWh (Loss)", icon: "🔥" },
        { title: "Maintenance Costs", val: cleaningTotal.toFixed(2), unit: "€", icon: "🛠️" },
        { title: "2026 Energy Forecast", val: (totalEnergy * (1 + INFRA_DATA.electricity.variationRate)).toFixed(0), unit: "kWh", icon: "📈" },
        { title: "Optimized Target", val: (totalEnergy * 0.70).toFixed(0), unit: "kWh (-30%)", icon: "🎯" }
    ];

    // Render cards
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

/**
 * Executes the 30% reduction plan across all metrics
 */
function applySustainabilityPlan() {
    const dataElements = document.querySelectorAll('.data');
    if (dataElements.length === 0) return;

    dataElements.forEach(el => {
        let rawVal = parseFloat(el.innerText.replace(/,/g, ''));
        if(!isNaN(rawVal)) {
            let reduced = (rawVal * 0.70).toFixed(1);
            el.innerText = parseFloat(reduced).toLocaleString();
            el.style.color = "#22c55e"; // Sustainability Green
        }
    });
    alert("System Optimization Active: 30% reduction applied to facility and energy loads.");
}

/**
 * Report Generation
 */
function exportToPDF() {
    window.print();
}