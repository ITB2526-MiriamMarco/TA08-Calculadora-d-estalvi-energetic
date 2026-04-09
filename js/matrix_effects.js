/**
 * ITB SUSTAINABILITY CALCULATOR - PHASE 3
 * Professional Logic & Infrastructure Analysis
 */

// 1. Data Source from dataclean.json
const DATA_SOURCE = {
    winterEnergy: 4800,
    variationRate: 0.2281, // 22.81%
    waterReading: 30.3,    // m3
    officeSupplies: 100.4, // units
    cleaningCost: 175       // €
};

// 2. Technical Constants
const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

/**
 * Main Calculation Engine
 */
function runCalculations() {
    // Get inputs
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const studentCount = parseInt(document.getElementById('studentCount').value) || 0;
    const days = parseInt(document.getElementById('timePeriod').value);
    const grid = document.getElementById('resultsGrid');

    // ENERGY: Based on Towers (12h daily for double shift)
    const totalKwh = (pcCount * PC_WATTAGE * 12 * days) / 1000;

    // WATER: Based on Students (Assuming JSON data 30.3m3 was for 300 students/30 days)
    const waterPerStudentDay = (DATA_SOURCE.waterReading / 300 / 30);
    const totalWaterLitres = (waterPerStudentDay * studentCount * days) * 1000;

    // SUPPLIES: Allocation per student
    const suppliesPerStudent = (DATA_SOURCE.officeSupplies / 300);

    const metrics = [
        { title: "Total Power Load", val: totalKwh.toFixed(0), unit: "kWh", icon: "⚡" },
        { title: "Carbon Footprint", val: (totalKwh * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Total Water Use", val: totalWaterLitres.toFixed(0), unit: "Litres", icon: "💧" },
        { title: "2026 Power Forecast", val: (totalKwh * (1 + DATA_SOURCE.variationRate)).toFixed(0), unit: "kWh Est.", icon: "📈" },
        { title: "Transition Waste", val: (pcCount * PC_WATTAGE * 1 * days / 1000).toFixed(0), unit: "kWh Lost", icon: "⏳" },
        { title: "Energy Loss (Heat)", val: (totalKwh * 0.20).toFixed(0), unit: "kWh (PSU)", icon: "🔥" },
        { title: "Supplies Allocation", val: (suppliesPerStudent * studentCount).toFixed(0), unit: "Total Units", icon: "📄" },
        { title: "Phantom Load", val: (pcCount * STANDBY_WATTAGE * 12 * days / 1000).toFixed(0), unit: "kWh Standby", icon: "👻" }
    ];

    // Render Cards
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
 * Sustainability Plan Implementation (-30%)
 */
function applySustainabilityPlan() {
    const cards = document.querySelectorAll('.data');
    if (cards.length === 0) {
        alert("Run calculations first!");
        return;
    }

    cards.forEach(card => {
        let currentVal = parseFloat(card.innerText);
        let reducedVal = (currentVal * 0.70).toFixed(1);
        card.innerText = reducedVal;
        card.style.color = "#22c55e";
    });

    console.log("30% Reduction applied: Virtualization and logic optimization active.");
}

/**
 * Technical Export
 */
function exportToPDF() {
    window.print();
}