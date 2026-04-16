/**
 * ITB INFRASTRUCTURE ANALYZER - ARCHITECTURE v3.0
 * Logic: Dual-shift (12h), Active vs Idle Days, and Financial Impact.
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: {
        fixedDailyPerPax: 133,
        pricePerL: 0.0021,
        maintenanceLitersDay: 500 // Min consumption when center is closed
    },
    costs: { cleaning: 175, supplies: 91.25 },
    energyPriceKwh: 0.24 // Avg price for 2026
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

// Technical Policies Database
const TECH_POLICIES = [
    { id: 'fountains', label: "Shut Fountains (8h)", impact: 0.10, type: 'water', category: "Facility Water" },
    { id: 'iot_water', label: "IoT Sensors", impact: 0.05, type: 'water', category: "Facility Water" },
    { id: 'virt', label: "Virtualization", impact: 0.15, type: 'energy', category: "System Energy Load" },
    { id: 'autoff', label: "Auto-Shutdown", impact: 0.10, type: 'energy', category: "System Energy Load" },
    { id: 'remote', label: "Remote Management", impact: 0.10, type: 'maint', category: "Cleaning Costs" },
    { id: 'inv', label: "Inventory Opt.", impact: 0.05, type: 'maint', category: "Supplies Costs" }
];

let activePolicies = new Set();

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedMode = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // --- CALENDAR LOGIC ---
    // schoolDays: Days with students (175)
    // idleDays: Weekends/Holidays (190) only calculated if 365 is selected
    const schoolDays = 175;
    const idleDays = (selectedMode === 365) ? 190 : 0;

    // 1. ENERGY CALCULATIONS
    // School days: 12h ON + 12h Standby | Idle days: 24h Standby
    const energySchoolActive = (pcCount * PC_WATTAGE * 12 * schoolDays) / 1000;
    const energySchoolStandby = (pcCount * STANDBY_WATTAGE * 12 * schoolDays) / 1000;
    const energyIdleStandby = (pcCount * STANDBY_WATTAGE * 24 * idleDays) / 1000;

    const baseEnergy = energySchoolActive + energySchoolStandby + energyIdleStandby;
    const baseStandbyTotal = energySchoolStandby + energyIdleStandby;

    // 2. WATER CALCULATIONS
    const waterSchool = occupancy * INFRA_DATA.water.fixedDailyPerPax * schoolDays;
    const waterIdle = INFRA_DATA.water.maintenanceLitersDay * idleDays;
    const baseWater = waterSchool + waterIdle;

    // 3. MAINTENANCE COSTS
    const expenseMonths = (selectedMode === 175) ? 3 : 12;
    const baseCleaning = INFRA_DATA.costs.cleaning * expenseMonths;
    const baseSupplies = INFRA_DATA.costs.supplies * expenseMonths;

    // 4. APPLY ACTIVE POLICIES
    let currentSavings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => {
        if (activePolicies.has(p.id)) currentSavings[p.type] += p.impact;
    });

    const currentWater = baseWater * (1 - currentSavings.water);
    const currentEnergy = baseEnergy * (1 - currentSavings.energy);
    const currentStandby = baseStandbyTotal * (1 - currentSavings.energy);
    const currentCleaning = baseCleaning * (1 - currentSavings.maint);
    const currentSupplies = baseSupplies * (1 - currentSavings.maint);

    // 5. FINANCIAL TOTALS
    const calcCost = (w, e, c, s) => (w * INFRA_DATA.water.pricePerL) + (e * INFRA_DATA.energyPriceKwh) + c + s;
    const totalBase = calcCost(baseWater, baseEnergy, baseCleaning, baseSupplies);
    const totalCurrent = calcCost(currentWater, currentEnergy, currentCleaning, currentSupplies);
    const totalTarget = totalBase * 0.70;

    // 6. METRICS FOR DASHBOARD
    const metrics = [
        { title: "Facility Water", val: currentWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currentEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currentEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Standby Leakage", val: currentStandby, goal: baseStandbyTotal * 0.70, unit: "kWh", icon: "🔌" },
        { title: "Resource Load Index", val: pcCount > 0 ? (currentWater / pcCount) : 0, goal: (baseWater * 0.70 / (pcCount || 1)), unit: "L/Node", icon: "📊" },
        { title: "Cleaning Costs", val: currentCleaning, goal: baseCleaning * 0.70, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: currentSupplies, goal: baseSupplies * 0.70, unit: "€", icon: "📦" },
        { title: "2026 Forecast", val: currentEnergy * (1 + INFRA_DATA.electricity.variationRate), goal: (baseEnergy * 0.70) * (1.2281), unit: "kWh", icon: "📈" }
    ];

    // --- RENDER CARDS ---
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        const cardActions = TECH_POLICIES.filter(p => p.category === m.title);
        let actionButtons = cardActions.length > 0 ? `<div class="card-actions">` +
            cardActions.map(btn => `<button class="btn-action ${activePolicies.has(btn.id) ? 'active-btn' : ''}" onclick="toggleAction('${btn.id}')">${btn.label}</button>`).join("") + `</div>` : "";

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
                        <span class="label">${isAchieved ? '✅ Goal Achieved' : 'Target:'}</span>
                        <span class="data-target">${Math.round(m.goal).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
                ${actionButtons}
            </div>
        `;
    });

    // --- UPDATE FINANCIAL SUMMARY ---
    document.getElementById('totalBase').innerText = Math.round(totalBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(totalTarget).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(totalCurrent).toLocaleString() + " €";

    const potentialSaving = totalBase - totalTarget;
    const currentSaving = totalBase - totalCurrent;
    const progress = Math.min(100, Math.max(0, (currentSaving / potentialSaving) * 100));

    document.getElementById('efficiencyBar').style.width = progress + "%";
    document.getElementById('efficiencyText').innerText = `${Math.round(progress)}% of strategic goal achieved`;
}

/**
 * Toggle policies and refresh view
 */
function toggleAction(policyId) {
    activePolicies.has(policyId) ? activePolicies.delete(policyId) : activePolicies.add(policyId);
    runCalculations();
}

/**
 * Reset all UI state
 */
function resetSavings() {
    activePolicies.clear();
    runCalculations();
}

/**
 * PDF Export
 */
function exportToPDF() {
    window.print();
}

// Bootstrapper
window.onload = runCalculations;