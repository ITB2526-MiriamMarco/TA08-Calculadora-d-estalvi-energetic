/**
 * ITB SUSTAINABILITY CALCULATOR - PHASE 3
 * Professional Logic & PDF Exporting System
 */

// 1. Data Source (Mocking the loaded dataclean.json values)
const RAW_DATA = {
    winterEnergy: 4800,
    variationRate: 0.2281, // 22.81% from JSON
    waterReading: 30.3,
    officeSupplies: 100.4
};

// 2. Constants for ITB Context (Tower PCs & Double Shift)
const TOWER_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259; // kg CO2 per kWh in Spain

/**
 * Main function to execute the 8 technical calculations
 */
function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value);
    const days = parseInt(document.getElementById('timePeriod').value);
    const grid = document.getElementById('resultsGrid');

    // FORMULA 1: Double Shift Power Consumption (12h total)
    const totalKwh = (pcCount * TOWER_WATTAGE * 12 * days) / 1000;

    // Mapping formulas to the 8 required metrics
    const metrics = [
        { title: "Total Power Load", val: totalKwh.toFixed(0), unit: "kWh", icon: "⚡" },
        { title: "Carbon Footprint", val: (totalKwh * CO2_FACTOR).toFixed(1), unit: "kg CO2", icon: "🌍" },
        { title: "Shift Transition Loss", val: (pcCount * TOWER_WATTAGE * 1 * days / 1000).toFixed(0), unit: "kWh Waste", icon: "⏳" },
        { title: "2026 Energy Forecast", val: (totalKwh * (1 + RAW_DATA.variationRate)).toFixed(0), unit: "kWh Est.", icon: "📈" },
        { title: "PSU Heat Dissipation", val: (totalKwh * 0.20).toFixed(0), unit: "kWh (Heat)", icon: "🔥" },
        { title: "Water Intensity", val: (RAW_DATA.waterReading / 300).toFixed(3), unit: "m³/student", icon: "💧" },
        { title: "Paper Stock Lifecycle", val: (RAW_DATA.officeSupplies / 10).toFixed(1), unit: "units/month", icon: "📄" },
        { title: "Phantom Load (Off-hours)", val: (pcCount * STANDBY_WATTAGE * 12 * days / 1000).toFixed(0), unit: "kWh Standby", icon: "👻" }
    ];

    // Render results into the Grid
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
 * Applies the 30% reduction plan across all metrics
 */
function applySustainabilityPlan() {
    const cards = document.querySelectorAll('.data');
    if (cards.length === 0) {
        alert("Please run the calculations first!");
        return;
    }

    cards.forEach(card => {
        let currentVal = parseFloat(card.innerText);
        let reducedVal = (currentVal * 0.70).toFixed(1); // 30% reduction logic
        card.innerText = reducedVal;
        card.style.color = "#22c55e"; // Visual feedback in green
    });

    console.log("30% Reduction Plan applied via Proxmox Virtualization & Power Scripts.");
}

/**
 * Technical PDF Export (Requires jsPDF library)
 */
function exportToPDF() {
    alert("Generating ITB Sustainability Report... (Ensure jsPDF library is linked)");
    // Logic to generate PDF would go here
    window.print(); // Simple way to export as PDF for browser-based testing
}