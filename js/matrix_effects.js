/**
 * ITB INFRASTRUCTURE ANALYZER - FINAL 8-METRIC VERSION (ASIX)
 * Metrics: Water, Energy, CO2, Standby, Index, Cleaning, Supplies, Forecast.
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133 },
    costs: { cleaning: 175, supplies: 91.25 }
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

// Global state for applied technical policies
let appliedSavings = { water: 0, energy: 0, maint: 0 };

/**
 * Main calculation engine
 */
function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. BASELINE CALCULATIONS (Reference values)
    const baseWater = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;
    const activeKwh = (pcCount * PC_WATTAGE * 12 * selectedDays) / 1000;
    let standbyDays = (selectedDays === 365) ? 0 : (365 - selectedDays);
    const baseStandbyKwh = (pcCount * STANDBY_WATTAGE * 24 * standbyDays) / 1000;
    const baseEnergy = activeKwh + baseStandbyKwh;

    const expenseFactor = (selectedDays === 175) ? 3 : 12;
    const baseCleaning = INFRA_DATA.costs.cleaning * expenseFactor;
    const baseSupplies = INFRA_DATA.costs.supplies * expenseFactor;

    // 2. APPLY INTERACTIVE SAVINGS (Calculated based on button clicks)
    const currentWater = baseWater * (1 - appliedSavings.water);
    const currentEnergy = baseEnergy * (1 - appliedSavings.energy);
    const currentStandby = baseStandbyKwh * (1 - appliedSavings.energy);
    const currentCleaning = baseCleaning * (1 - appliedSavings.maint);
    const currentSupplies = baseSupplies * (1 - appliedSavings.maint);

    // 3. DEFINE THE 8 KEY METRICS
    const metrics = [
        {
            title: "Facility Water", val: currentWater, goal: baseWater * 0.70, unit: "L", icon: "💧",
            actions: [
                { label: "Shut Fountains (8h)", impact: 0.10, type: 'water' },
                { label: "IoT Sensors", impact: 0.05, type: 'water' }
            ]
        },
        {
            title: "System Energy Load", val: currentEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️",
            actions: [
                { label: "Virtualization", impact: 0.15, type: 'energy' },
                { label: "Auto-Shutdown", impact: 0.10, type: 'energy' }
            ]
        },
        {
            title: "Carbon Footprint", val: currentEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍",
            actions: []
        },
        {
            title: "Standby Leakage", val: currentStandby, goal: baseStandbyKwh * 0.70, unit: "kWh", icon: "🔌",
            actions: []
        },
        {
            title: "Resource Load Index", val: pcCount > 0 ? (currentWater / pcCount) : 0, goal: (baseWater * 0.70 / (pcCount || 1)), unit: "L/Node", icon: "📊",
            actions: []
        },
        {
            title: "Cleaning Costs", val: currentCleaning, goal: baseCleaning * 0.70, unit: "€", icon: "🛠️",
            actions: [
                { label: "Remote Management", impact: 0.10, type: 'maint' }
            ]
        },
        {
            title: "Supplies Costs", val: currentSupplies, goal: baseSupplies * 0.70, unit: "€", icon: "📦",
            actions: [
                { label: "Inventory Opt.", impact: 0.05, type: 'maint' }
            ]
        },
        {
            title: "2026 Forecast", val: currentEnergy * (1 + INFRA_DATA.electricity.variationRate), goal: (baseEnergy * 0.70) * (1.2281), unit: "kWh", icon: "📈",
            actions: []
        }
    ];

    // 4. RENDER DASHBOARD CARDS
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        const statusLabel = isAchieved ? '✅ Goal Achieved' : 'Target (-30%):';

        let actionButtons = "";
        if (m.actions && m.actions.length > 0) {
            actionButtons = `<div class="card-actions">` +
                m.actions.map(btn => `<button class="btn-action" onclick="applyAction('${btn.type}', ${btn.impact})">${btn.label}</button>`).join("") +
                `</div>`;
        }

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <div class="data-container">
                    <div class="current-row">
                        <span class="label">Actual:</span>
                        <span class="data">${Math.round(m.val).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                    <div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}">
                        <span class="label">${statusLabel}</span>
                        <span class="data-target">${Math.round(m.goal).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
                ${actionButtons}
            </div>
        `;
    });
}

/**
 * Apply a technical saving policy
 * @param {string} type - 'water', 'energy' or 'maint'
 * @param {number} impact - percentage to subtract (0.10 = 10%)
 */
function applyAction(type, impact) {
    appliedSavings[type] += impact;
    // Cap savings at 95% to avoid negative values
    if (appliedSavings[type] > 0.95) appliedSavings[type] = 0.95;
    runCalculations();
}

/**
 * Clear all simulated policies
 */
function resetSavings() {
    appliedSavings = { water: 0, energy: 0, maint: 0 };
    runCalculations();
}

/**
 * Print simple PDF report
 */
function exportToPDF() {
    window.print();
}

// Initial boot
window.onload = runCalculations;