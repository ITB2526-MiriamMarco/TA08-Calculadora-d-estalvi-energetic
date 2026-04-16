/**
 * ITB INFRASTRUCTURE AUDIT LOGIC - FINAL RELEASE
 * Features: English UI, Fixed Scale Chart, Smart PDF Rescaling.
 */

const currentSystemYear = new Date().getFullYear();
let myChart = null;
let initialMaxEnergy = null;

// --- DATA & CONSTANTS ---
const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: {
        fixedDailyPerPax: 133,
        pricePerL: 0.0021,
        maintenanceLitersDay: 500
    },
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

// --- MAIN CALCULATIONS ---
function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedMode = parseInt(document.getElementById('calcMode').value);

    document.getElementById('currentYearDisplay').innerText = currentSystemYear;

    const schoolDays = 175;
    const idleDays = (selectedMode === 365) ? 190 : 0;

    const baseEnergy = ((pcCount * PC_WATTAGE * 12 * schoolDays) + (pcCount * STANDBY_WATTAGE * 12 * schoolDays) + (pcCount * STANDBY_WATTAGE * 24 * idleDays)) / 1000;
    const baseWater = (occupancy * INFRA_DATA.water.fixedDailyPerPax * schoolDays) + (INFRA_DATA.water.maintenanceLitersDay * idleDays);

    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const currEnergy = baseEnergy * (1 - savings.energy);
    const currWater = baseWater * (1 - savings.water);

    // 3 Year Forecast for Chart
    const y1 = currEnergy * (1 + INFRA_DATA.electricity.variationRate);
    const y2 = y1 * (1 + INFRA_DATA.electricity.variationRate);
    const y3 = y2 * (1 + INFRA_DATA.electricity.variationRate);

    // Scale Lock logic (locks the Y axis based on the first calculation)
    if (initialMaxEnergy === null) {
        initialMaxEnergy = (baseEnergy * Math.pow(1.2281, 3)) * 1.1;
    }
    updateChart(y1, y2, y3);

    // Render Metrics
    const metrics = [
        { title: "Facility Water", val: currWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * (selectedMode/30)) * (1 - savings.maint), goal: (INFRA_DATA.costs.cleaning * (selectedMode/30)) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * (selectedMode/30)) * (1 - savings.maint), goal: (INFRA_DATA.costs.supplies * (selectedMode/30)) * 0.7, unit: "€", icon: "📦" },
        { title: `${currentSystemYear + 1} Forecast`, val: y1, goal: (baseEnergy * 0.7) * 1.22, unit: "kWh", icon: "📈" }
    ];

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        const cardActions = TECH_POLICIES.filter(p => p.category === m.title);
        let actionButtons = cardActions.map(btn => `<button class="btn-action ${activePolicies.has(btn.id) ? 'active-btn' : ''}" onclick="toggleAction('${btn.id}')">${btn.label}</button>`).join("");

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <span class="data">${Math.round(m.val).toLocaleString()}</span><span class="unit">${m.unit}</span>
                <div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}">
                    Target: ${Math.round(m.goal).toLocaleString()} ${m.unit}
                </div>
                <div class="card-actions">${actionButtons}</div>
            </div>`;
    });

    // Final Financial Totals
    const expM = selectedMode/30;
    const cBase = (baseWater * INFRA_DATA.water.pricePerL) + (baseEnergy * INFRA_DATA.energyPriceKwh) + (INFRA_DATA.costs.cleaning * expM) + (INFRA_DATA.costs.supplies * expM);
    const cCurr = (currWater * INFRA_DATA.water.pricePerL) + (currEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint)) + ((INFRA_DATA.costs.supplies * expM) * (1 - savings.maint));

    document.getElementById('totalBase').innerText = Math.round(cBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(cBase * 0.7).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(cCurr).toLocaleString() + " €";

    const prog = Math.min(100, Math.max(0, ((cBase - cCurr) / (cBase * 0.3)) * 100));
    const efficiencyBar = document.getElementById('efficiencyBar');
    if(efficiencyBar) efficiencyBar.style.width = prog + "%";
}

// --- CHART RENDERING ---
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
            layout: { padding: { top: 10, bottom: 10 } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.round(initialMaxEnergy),
                    ticks: { color: '#fff' }
                },
                x: { ticks: { color: '#fff' } }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#fff' }
                }
            }
        }
    });
}

// --- INTERACTION ---
function toggleAction(id) {
    activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id);
    runCalculations();
}

function resetSavings() {
    activePolicies.clear();
    initialMaxEnergy = null;
    runCalculations();
}

// --- PDF EXPORT FIX (Bajar títulos y leyendas) ---
window.onbeforeprint = () => {
    // Colors to Black for PDF
    myChart.options.scales.x.ticks.color = '#000000';
    myChart.options.scales.y.ticks.color = '#000000';
    myChart.options.plugins.legend.labels.color = '#000000';

    // Move legend to bottom to avoid overlapping with top titles
    myChart.options.plugins.legend.position = 'bottom';

    // Add internal padding to separate from the H2 title in CSS
    myChart.options.layout.padding.top = 30;

    myChart.options.maintainAspectRatio = true;
    myChart.options.aspectRatio = 2.2;
    myChart.resize();
    myChart.update();
};

window.onafterprint = () => {
    // Restore UI colors
    myChart.options.scales.x.ticks.color = '#ffffff';
    myChart.options.scales.y.ticks.color = '#ffffff';
    myChart.options.plugins.legend.labels.color = '#ffffff';
    myChart.options.plugins.legend.position = 'top';
    myChart.options.layout.padding.top = 10;

    myChart.options.maintainAspectRatio = false;
    myChart.resize();
    myChart.update();
};

window.onload = runCalculations;