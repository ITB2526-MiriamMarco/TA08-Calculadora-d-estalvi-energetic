/**
 * ITB SUSTAINABILITY CALCULATOR - PHASE 3
 * Using 133L/day per person standard
 */

// 1. Data Source from dataclean.json & Technical Specs
const DATA_SOURCE = {
    winterEnergy: 4800,
    variationRate: 0.2281, // 22.81%
    officeSupplies: 100.4,
    waterLitersPerPerson: 133 // Your specific parameter
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

/**
 * Calculation Engine
 */
function runCalculations() {
    // Get inputs
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const studentCount = parseInt(document.getElementById('studentCount').value) || 0;
    const days = parseInt(document.getElementById('timePeriod').value);
    const grid = document.getElementById('resultsGrid');

    // ENERGY: Towers (12h daily usage for double shift)
    const totalKwh = (pcCount * PC_WATTAGE * 12 * days) / 1000;

    // WATER: Based on 133L per person per day
    const totalWaterLitres = studentCount * DATA_SOURCE.waterLitersPerPerson * days;

    const metrics = [
        { title: "Total Power Load", val: totalKwh.toFixed(0), unit: "kWh", icon: "⚡" },
        { title: "Carbon Footprint", val: (totalKwh * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Total Water Use", val: totalWaterLitres.toLocaleString(), unit: "Litres", icon: "💧" },
        { title: "2026 Energy Forecast", val: (totalKwh * (1 + DATA_SOURCE.variationRate)).toFixed(0), unit: "kWh Est.", icon: "📈" },
        { title: "Transition Loss", val: (pcCount * PC_WATTAGE * 1 * days / 1000).toFixed(0), unit: "kWh Lost", icon: "⏳" },
        { title: "Heat Dissipation", val: (totalKwh * 0.20).toFixed(0), unit: "kWh (PSU)", icon: "🔥" },
        { title: "Supplies Stock", val: (DATA_SOURCE.officeSupplies / 300 * studentCount).toFixed(0), unit: "Units", icon: "📄" },
        { title: "Standby Consumption", val: (pcCount * STANDBY_WATTAGE * 12 * days / 1000).toFixed(0), unit: "kWh", icon: "👻" }
    ];

    // Clear and Render
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
 * 30% Reduction Logic
 */
function applySustainabilityPlan() {
    const dataElements = document.querySelectorAll('.data');
    if (dataElements.length === 0) return;

    dataElements.forEach(el => {
        // Clean number (remove commas for math)
        let rawVal = parseFloat(el.innerText.replace(/,/g, ''));
        let reduced = (rawVal * 0.70).toFixed(1);

        // Format back with commas
        el.innerText = parseFloat(reduced).toLocaleString();
        el.style.color = "#22c55e";
    });

    alert("30% Reduction Plan applied successfully to all metrics.");
}

/**
 * Export to PDF
 */
function exportToPDF() {
    window.print();
}