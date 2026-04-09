/**
 * ITB INFRASTRUCTURE ANALYZER - ASIX PHASE 3
 * Logic: 12h Duty Cycle (627 PCs) & Accumulated Daily Load (1600 Pax)
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 }, // +22.81% Forecast
    water: { fixedDailyPerPax: 133 },       // Cumulative liters per user use
    costs: {
        cleaning: 175,   // Monthly standard
        supplies: 91.25  // Monthly standard
    }
};

const PC_WATTAGE = 200;      // 200W per Tower (Active)
const STANDBY_WATTAGE = 10;  // 10W (Idle/Standby)
const CO2_FACTOR = 0.259;

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. WATER: Total cumulative use for the 1600 students (800 AM + 800 PM)
    const totalWater = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;

    // 2. ENERGY: 12 hours duty cycle (morning + afternoon shifts)
    const activeKwh = (pcCount * PC_WATTAGE * 12 * selectedDays) / 1000;

    // Calculate standby for the rest of the year (night hours + non-academic days)
    // If 365 is selected, standby days are 0 (already covered in year calc)
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const standbyKwh = (pcCount * STANDBY_WATTAGE * 24 * standbyDays) / 1000;
    const totalEnergy = activeKwh + standbyKwh;

    // 3. MAINTENANCE: Based on academic terms (3) or full year (12)
    const expenseFactor = (selectedDays === 175) ? 3 : 12;

    // 4. EFFICIENCY INDEX: Liters per Node
    const resourceIndex = pcCount > 0 ? (totalWater / pcCount).toFixed(0) : 0;

    const metrics = [
        { title: "Facility Water", val: totalWater, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: totalEnergy.toFixed(0), unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: (totalEnergy * CO2_FACTOR).toFixed(1), unit: "kg", icon: "🌍" },
        { title: "Standby Leakage", val: standbyKwh.toFixed(1), unit: "kWh", icon: "🔌" },
        { title: "Resource Load Index", val: resourceIndex, unit: "L/Node", icon: "📊" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * expenseFactor).toFixed(2), unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * expenseFactor).toFixed(2), unit: "€", icon: "📦" },
        { title: "2026 Forecast", val: (totalEnergy * (1 + INFRA_DATA.electricity.variationRate)).toFixed(0), unit: "kWh", icon: "📈" }
    ];

    grid.innerHTML = "";
    metrics.forEach(m => {
        // Goal = 70% of current value
        let targetVal = (parseFloat(m.val) * 0.70).toFixed(m.val.toString().includes('.') ? 1 : 0);

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <div class="data-container">
                    <div class="current-row">
                        <span class="label">Actual:</span>
                        <span class="data">${parseFloat(m.val).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                    <div class="target-row" style="display:none; color: #22c55e; margin-top: 12px; border-top: 1px dashed #555; padding-top: 8px; font-weight: bold;">
                        <span class="label">Goal (-30%):</span>
                        <span class="data-target">${parseFloat(targetVal).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

function applySustainabilityPlan() {
    const targets = document.querySelectorAll('.target-row');
    if (targets.length === 0) return;
    targets.forEach(el => el.style.display = "block");
    document.querySelectorAll('.current-row').forEach(el => el.style.opacity = "0.5");
}

function exportToPDF() { window.print(); }

// Initialize dashboard with default values (627 PCs / 1600 Pax)
window.onload = runCalculations;