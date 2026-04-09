/**
 * ITB SUSTAINABILITY CALCULATOR - PHASE 3
 * Logic focused on Infrastructure & Total Resource Consumption
 */

// 1. Data Source from your dataclean.json
const DATA_SOURCE = {
    winterEnergy: 4800,     // kWh
    variationRate: 0.2281,  // 22.81%
    waterReading: 30.3,     // m3
    officeSupplies: 100.4,  // units
    cleaningCost: 175       // €
};

// 2. Technical Constants
const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

/**
 * Executes the 8 Technical Calculations
 */
function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value);
    const days = parseInt(document.getElementById('timePeriod').value);
    const grid = document.getElementById('resultsGrid');

    // Calculation 1: Total Power (Double Shift 12h)
    const totalKwh = (pcCount * PC_WATTAGE * 12 * days) / 1000;

    // Calculation 6: Total Water Consumption (Projected to Liters)
    // We assume the 30.3 m3 reading was for a 30-day period
    const totalWaterLitres = (DATA_SOURCE.waterReading / 30) * days * 1000;

    const metrics = [
        { title: "Total Power Load", val: totalKwh.toFixed(0), unit: "kWh", icon: "⚡" },
        { title: "Carbon Footprint", val: (totalKwh * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Transition Waste", val: (pcCount * PC_WATTAGE * 1 * days / 1000).toFixed(0), unit: "kWh Lost", icon: "⏳" },
        { title: "2026 Power Forecast", val: (totalKwh * (1 + DATA_SOURCE.variationRate)).toFixed(0), unit: "kWh Est.", icon: "📈" },
        { title: "Energy Loss (Heat)", val: (totalKwh * 0.20).toFixed(0), unit: "kWh (PSU)", icon: "🔥" },
        { title: "Total Water Use", val: totalWaterLitres.toFixed(0), unit: "Litres", icon: "💧" },
        { title: "Supplies Stock", val: (DATA_SOURCE.officeSupplies).toFixed(0), unit: "Total Units", icon: "📄" },
        { title: "Phantom Load", val: (pcCount * STANDBY_WATTAGE * 12 * days / 1000).toFixed(0), unit: "kWh Standby", icon: "👻" }
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

/**
 * Sustainability Plan (30% reduction)
 */
function applySustainabilityPlan() {
    const cards = document.querySelectorAll('.data');

    if (cards.length === 0) {
        alert("Please generate metrics first.");
        return;
    }

    cards.forEach(card => {
        let currentVal = parseFloat(card.innerText);
        // Applying the -30% multiplier (0.7)
        let reducedVal = (currentVal * 0.70).toFixed(1);

        card.innerText = reducedVal;
        card.style.color = "#22c55e";
    });

    console.log("30% reduction applied to all resource consumption metrics.");
}

/**
 * Report Export
 */
function exportToPDF() {
    window.print();
}