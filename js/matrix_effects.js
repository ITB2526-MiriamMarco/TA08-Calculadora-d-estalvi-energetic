/**
 * ITB INFRASTRUCTURE AUDIT - TOTAL SYSTEM
 * - Proyección trienal: 2026, 2027, 2028
 * - Agosto/Septiembre: 0 carga activa (Solo Nubulet + Standby)
 * - 8 Paneles de métricas con lógica de ahorro
 * - Barra de eficiencia financiera funcional
 * - Optimización para PDF
 */

const currentSystemYear = 2026;
let myChart = null;

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
    water: { fixedDailyPerPax: 133, pricePerL: 0.0021, maintenanceLitersDay: 500 },
    costs: { cleaning: 175, supplies: 91.25 },
    energyPriceKwh: 0.24
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;
const CRITICAL_INFRA_WATTAGE = 550; // Nubulet (Siempre ON)

const TECH_POLICIES = [
    { id: 'fountains', label: "Shut Fountains (8h)", impact: 0.10, type: 'water', category: "Facility Water" },
    { id: 'iot_water', label: "IoT Sensors", impact: 0.05, type: 'water', category: "Facility Water" },
    { id: 'virt', label: "Virtualization", impact: 0.15, type: 'energy', category: "System Energy Load" },
    { id: 'autoff', label: "Auto-Shutdown", impact: 0.10, type: 'energy', category: "System Energy Load" },
    { id: 'remote', label: "Remote Management", impact: 0.10, type: 'maint', category: "Cleaning Costs" },
    { id: 'inv', label: "Inventory Opt.", impact: 0.05, type: 'maint', category: "Supplies Costs" },
    { id: 'smart_plugs', label: "Smart Power Strips", impact: 0.35, type: 'energy', category: "Standby Consumption" },
    { id: 'hvac_ai', label: "AI HVAC Control", impact: 0.25, type: 'energy', category: "Wasted Energy" },
    { id: 'motion_sensors', label: "Motion Sensors", impact: 0.15, type: 'energy', category: "Wasted Energy" }
];

let activePolicies = new Set();

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    let schoolDays = parseInt(document.getElementById('calcMode').value) || 0;
    const selectedText = document.getElementById('calcMode').options[document.getElementById('calcMode').selectedIndex].text;

    document.getElementById('currentYearDisplay').innerText = currentSystemYear;

    // Valle total Agosto-Septiembre (Carga personal = 0)
    if (selectedText.includes("August") || selectedText.includes("September")) {
        schoolDays = 0;
    }

    const totalPeriodDays = (schoolDays >= 175) ? 365 : 30;
    const expM = (schoolDays >= 175) ? 12 : 1;

    // --- 1. CÁLCULOS BASE (SIN POLÍTICAS) ---
    const baseStandbyKwh = (pcCount * STANDBY_WATTAGE * 24 * totalPeriodDays) / 1000;
    const baseInfraKwh = (CRITICAL_INFRA_WATTAGE * 24 * totalPeriodDays) / 1000;
    const baseActiveKwh = (pcCount * PC_WATTAGE * 12 * schoolDays) / 1000;
    const baseEnergyTotal = baseActiveKwh + baseStandbyKwh + baseInfraKwh;
    const baseWaterL = (occupancy * 133 * schoolDays) + (500 * (totalPeriodDays - schoolDays));

    const costBaseTotal = (baseEnergyTotal * INFRA_DATA.energyPriceKwh) +
                          (baseWaterL * INFRA_DATA.water.pricePerL) +
                          (INFRA_DATA.costs.cleaning * expM) +
                          (INFRA_DATA.costs.supplies * expM);

    // --- 2. CÁLCULOS ACTUALES (CON POLÍTICAS) ---
    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const energySavingFactor = Math.min(savings.energy, 0.70);
    const currEnergy = (baseActiveKwh * (1 - energySavingFactor)) +
                       (baseStandbyKwh * (1 - (energySavingFactor * 0.6))) +
                       baseInfraKwh;

    const currWater = Math.max(baseWaterL * 0.30, baseWaterL * (1 - savings.water));

    const costCurrTotal = (currEnergy * INFRA_DATA.energyPriceKwh) +
                          (currWater * INFRA_DATA.water.pricePerL) +
                          ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint)) +
                          ((INFRA_DATA.costs.supplies * expM) * (1 - savings.maint));

    // --- 3. ACTUALIZAR UI ---
    updateChart(energySavingFactor);
    renderCards(currEnergy, baseEnergyTotal, energySavingFactor, baseStandbyKwh, baseInfraKwh, savings, occupancy, schoolDays, baseWaterL, currWater);
    updateFinancialImpact(costBaseTotal, costCurrTotal);
}

function renderCards(currEnergy, baseEnergyTotal, energySavingFactor, standbyBase, infraFixed, savings, occupancy, schoolDays, baseWater, currWater) {
    const grid = document.getElementById('resultsGrid');
    if (!grid) return;
    grid.innerHTML = "";

    const expM = (schoolDays >= 175) ? 12 : 1;
    const cleaningCost = (INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint);
    const suppliesCost = (INFRA_DATA.costs.supplies * expM) * (1 - savings.maint);
    const wastedEnergy = Math.max(baseEnergyTotal * 0.05, (baseEnergyTotal * 0.25) * (1 - energySavingFactor));

    const metrics = [
        { title: "Facility Water", val: currWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currEnergy, goal: baseEnergyTotal * 0.75, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currEnergy * CO2_FACTOR, goal: (baseEnergyTotal * 0.75) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Cleaning Costs", val: cleaningCost, goal: (INFRA_DATA.costs.cleaning * expM) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: suppliesCost, goal: (INFRA_DATA.costs.supplies * expM) * 0.7, unit: "€", icon: "📦" },
        { title: "Standby Consumption", val: (standbyBase * (1 - (energySavingFactor * 0.6))) + infraFixed, goal: (standbyBase + infraFixed) * 0.6, unit: "kWh", icon: "🌙" },
        { title: "Wasted Energy", val: wastedEnergy, goal: (baseEnergyTotal * 0.08), unit: "kWh", icon: "⚠️" },
        { title: `Next Year Forecast`, val: currEnergy * 1.05, goal: currEnergy, unit: "kWh", icon: "📈" }
    ];

    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <span class="data">${Math.round(m.val).toLocaleString()}</span><span class="unit">${m.unit}</span>
                <div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}">Target: ${Math.round(m.goal).toLocaleString()} ${m.unit}</div>
                <div class="card-actions">${TECH_POLICIES.filter(p => p.category === m.title).map(btn =>
                    `<button class="btn-action ${activePolicies.has(btn.id) ? 'active-btn' : ''}" onclick="toggleAction('${btn.id}')">${btn.label}</button>`
                ).join("")}</div>
            </div>`;
    });
}

function updateFinancialImpact(base, current) {
    const target = base * 0.70;

    document.getElementById('totalBase').innerText = Math.round(base).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(target).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(current).toLocaleString() + " €";

    const totalSavingNeeded = base - target;
    const currentSavingMade = base - current;

    let efficiency = (totalSavingNeeded > 0) ? (currentSavingMade / totalSavingNeeded) * 100 : 0;
    efficiency = Math.max(0, Math.min(100, efficiency));

    const bar = document.getElementById('efficiencyBar');
    const text = document.getElementById('efficiencyText');

    if (bar) bar.style.width = efficiency + "%";
    if (text) text.innerText = Math.round(efficiency) + "% logrado";
}

function updateChart(appliedSaving) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (myChart) myChart.destroy();

    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const monthlySchoolDays = [20, 18, 15, 21, 20, 15, 15, 0, 0, 21, 19, 12];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    let labels = [];
    let infraSeries = [], standbySeries = [], activeSeries = [];

    const years = [2026, 2027, 2028];
    const growth = 1.05;

    years.forEach((year, yIdx) => {
        const mult = Math.pow(growth, yIdx);
        monthlySchoolDays.forEach((sDays, mIdx) => {
            labels.push(`${months[mIdx]} ${year.toString().slice(-2)}`);
            infraSeries.push(Math.round((CRITICAL_INFRA_WATTAGE * 24 * 30 * mult) / 1000));
            standbySeries.push(Math.round(((pcCount * STANDBY_WATTAGE * 24 * 30 * mult) / 1000) * (1 - (appliedSaving * 0.6))));
            activeSeries.push(Math.round(((pcCount * PC_WATTAGE * 12 * sDays * mult) / 1000) * (1 - appliedSaving)));
        });
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Infra Crítica', data: infraSeries, borderColor: '#1e3a8a', backgroundColor: 'rgba(30, 58, 138, 0.8)', fill: true, stack: 'combined', pointRadius: 0 },
                { label: 'Standby PCs', data: standbySeries, borderColor: '#065f46', backgroundColor: 'rgba(6, 95, 70, 0.7)', fill: true, stack: 'combined', pointRadius: 0 },
                { label: 'Carga Lectiva', data: activeSeries, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.5)', fill: true, stack: 'combined', pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { stacked: true, beginAtZero: true, ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff', autoSkip: true, maxTicksLimit: 12 } }
            },
            plugins: {
                legend: { labels: { color: '#fff' } },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

function toggleAction(id) {
    activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id);
    runCalculations();
}

window.onbeforeprint = () => {
    if (myChart) {
        myChart.options.scales.x.ticks.color = '#000000';
        myChart.options.scales.y.ticks.color = '#000000';
        myChart.options.plugins.legend.labels.color = '#000000';
        myChart.update('none');
    }
};

window.onafterprint = () => { runCalculations(); };
window.onload = runCalculations;