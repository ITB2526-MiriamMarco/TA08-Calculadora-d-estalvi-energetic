/**
 * ITB INFRASTRUCTURE ANALYZER - FINAL PRODUCTION v4.0
 * Features: Dynamic Year, Toggle Policies, 3-Year Chart Projection.
 */

const currentSystemYear = new Date().getFullYear();
let myChart = null; // Instancia global del gráfico

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 }, // +22.81% aumento proyectado
    water: { fixedDailyPerPax: 133, pricePerL: 0.0021, maintenanceLitersDay: 500 },
    costs: { cleaning: 175, supplies: 91.25 },
    energyPriceKwh: 0.24
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

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

    document.getElementById('currentYearDisplay').innerText = currentSystemYear;

    // --- CALENDARIO ---
    const schoolDays = 175;
    const idleDays = (selectedMode === 365) ? 190 : 0;

    // --- ENERGÍA ---
    const energySchoolActive = (pcCount * PC_WATTAGE * 12 * schoolDays) / 1000;
    const energySchoolStandby = (pcCount * STANDBY_WATTAGE * 12 * schoolDays) / 1000;
    const energyIdleStandby = (pcCount * STANDBY_WATTAGE * 24 * idleDays) / 1000;
    const baseEnergy = energySchoolActive + energySchoolStandby + energyIdleStandby;
    const baseStandbyTotal = energySchoolStandby + energyIdleStandby;

    // --- AGUA ---
    const baseWater = (occupancy * INFRA_DATA.water.fixedDailyPerPax * schoolDays) + (INFRA_DATA.water.maintenanceLitersDay * idleDays);

    // --- AHORROS ACTIVOS ---
    let currentSavings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) currentSavings[p.type] += p.impact; });

    const currentEnergy = baseEnergy * (1 - currentSavings.energy);
    const currentWater = baseWater * (1 - currentSavings.water);

    // --- PROYECCIÓN 3 AÑOS (PARA EL GRÁFICO) ---
    const y1 = currentEnergy * (1 + INFRA_DATA.electricity.variationRate);
    const y2 = y1 * (1 + INFRA_DATA.electricity.variationRate);
    const y3 = y2 * (1 + INFRA_DATA.electricity.variationRate);
    updateChart(y1, y2, y3);

    // --- MÉTRICAS (8 TARJETAS) ---
    const metrics = [
        { title: "Facility Water", val: currentWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currentEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currentEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Standby Leakage", val: baseStandbyTotal * (1 - currentSavings.energy), goal: baseStandbyTotal * 0.70, unit: "kWh", icon: "🔌" },
        { title: "Resource Load Index", val: pcCount > 0 ? (currentWater / pcCount) : 0, goal: (baseWater * 0.70 / (pcCount || 1)), unit: "L/Node", icon: "📊" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * (selectedMode/30.4)) * (1 - currentSavings.maint), goal: (INFRA_DATA.costs.cleaning * (selectedMode/30.4)) * 0.70, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * (selectedMode/30.4)) * (1 - currentSavings.maint), goal: (INFRA_DATA.costs.supplies * (selectedMode/30.4)) * 0.70, unit: "€", icon: "📦" },
        { title: `${currentSystemYear + 1} Forecast`, val: y1, goal: (baseEnergy * 0.70) * (1.22), unit: "kWh", icon: "📈" }
    ];

    // Render Cards
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        const cardActions = TECH_POLICIES.filter(p => p.category === m.title);
        let actionButtons = cardActions.length > 0 ? `<div class="card-actions">` +
            cardActions.map(btn => `<button class="btn-action ${activePolicies.has(btn.id) ? 'active-btn' : ''}" onclick="toggleAction('${btn.id}')">${btn.label}</button>`).join("") + `</div>` : "";

        grid.innerHTML += `<div class="card"><h3>${m.icon} ${m.title}</h3><div class="data-container"><div class="current-row"><span class="label">Actual:</span><span class="data">${Math.round(m.val).toLocaleString()}</span><span class="unit">${m.unit}</span></div><div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}"><span class="label">${isAchieved ? '✅ OK' : 'Target:'}</span><span class="data-target">${Math.round(m.goal).toLocaleString()}</span><span class="unit">${m.unit}</span></div></div>${actionButtons}</div>`;
    });

    // --- FINANZAS ---
    const expenseMonths = (selectedMode === 175) ? 3 : 12;
    const cBase = (baseWater * INFRA_DATA.water.pricePerL) + (baseEnergy * INFRA_DATA.energyPriceKwh) + (INFRA_DATA.costs.cleaning * expenseMonths) + (INFRA_DATA.costs.supplies * expenseMonths);
    const cCurrent = (currentWater * INFRA_DATA.water.pricePerL) + (currentEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expenseMonths) * (1 - currentSavings.maint)) + ((INFRA_DATA.costs.supplies * expenseMonths) * (1 - currentSavings.maint));

    document.getElementById('totalBase').innerText = Math.round(cBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(cBase * 0.70).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(cCurrent).toLocaleString() + " €";

    const progress = Math.min(100, Math.max(0, ((cBase - cCurrent) / (cBase * 0.30)) * 100));
    document.getElementById('efficiencyBar').style.width = progress + "%";
    document.getElementById('efficiencyText').innerText = `${Math.round(progress)}% of strategic goal reached`;
}

function updateChart(y1, y2, y3) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [currentSystemYear + 1, currentSystemYear + 2, currentSystemYear + 3],
            datasets: [{
                label: 'Projected Consumption (kWh)',
                data: [Math.round(y1), Math.round(y2), Math.round(y3)],
                backgroundColor: 'rgba(34, 197, 94, 0.4)',
                borderColor: '#22c55e',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#ffffff' } }
            },
            plugins: { legend: { labels: { color: '#ffffff' } } }
        }
    });
}

function toggleAction(id) { activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id); runCalculations(); }
function resetSavings() { activePolicies.clear(); runCalculations(); }
window.onload = runCalculations;