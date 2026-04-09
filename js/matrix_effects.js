/**
 * ITB SUSTAINABILITY CALCULATOR - PHASE 3
 * Professional Logic for ASIX Systems
 */

// 1. Data Source (Simulating values from your dataclean.json)
const DATA_SOURCE = {
    winterEnergy: 4800,
    variationRate: 0.2281, // 22.81%
    waterReading: 30.3,
    officeSupplies: 100.4,
    cleaningCost: 175
};

// 2. Technical Constants (ITB Infrastructure)
const PC_WATTAGE = 200;      // Average Tower PC consumption
const STANDBY_WATTAGE = 10;  // Monitor + Tower in sleep mode
const CO2_FACTOR = 0.259;    // kg CO2 per kWh (Spain Mix)

/**
 * Executes the 8 Technical Calculations
 */
function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value);
    const days = parseInt(document.getElementById('timePeriod').value);
    const grid = document.getElementById('resultsGrid');

    // Formula 1: Double Shift Energy (6h + 6h = 12h daily)
    const totalKwh = (pcCount * PC_WATTAGE * 12 * days) / 1000;

    // The 8 Metrics required for Phase 3
    const metrics = [
        { title: "Energy Consumption", val: totalKwh.toFixed(0), unit: "kWh", icon: "⚡" },
        { title: "Carbon Footprint", val: (totalKwh * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Transition Waste", val: (pcCount * PC_WATTAGE * 1 * days / 1000).toFixed(0), unit: "kWh (Shift Gap)", icon: "⏳" },
        { title: "2026 Power Forecast", val: (totalKwh * (1 + DATA_SOURCE.variationRate)).toFixed(0), unit: "kWh Est.", icon: "📈" },
        { title: "Thermal Dissipation", val: (totalKwh * 0.20).toFixed(0), unit: "kWh as Heat", icon: "🔥" },
        { title: "Water Intensity", val: (DATA_SOURCE.waterReading / 300).toFixed(3), unit: "m³/user", icon: "💧" },
        { title: "Supplies Lifecycle", val: (DATA_SOURCE.officeSupplies / 10).toFixed(1), unit: "units/month", icon: "📄" },
        { title: "Phantom Load", val: (pcCount * STANDBY_WATTAGE * 12 * days / 1000).toFixed(0), unit: "kWh Standby", icon: "👻" }
    ];

    // Clear and Render Cards
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
 * Applies the 30% reduction strategy (Goal for Year 3)
 */
function applySustainabilityPlan() {
    const cards = document.querySelectorAll('.data');

    if (cards.length === 0) {
        alert("Please generate metrics first.");
        return;
    }

    cards.forEach(card => {
        let currentVal = parseFloat(card.innerText);
        // Applying 30% reduction (Value * 0.7)
        let reducedVal = (currentVal * 0.70).toFixed(2);

        card.innerText = reducedVal;
        card.style.color = "#22c55e"; // Success Green
    });

    console.log("Optimization active: Proxmox Virtualization & Power Scripts implemented.");
}

/**
 * Report Export Logic
 */
function exportToPDF() {
    // Note: This triggers the browser's print-to-PDF interface
    // It's the most reliable way to export the dashboard layout
    window.print();
}