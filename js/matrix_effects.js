/**
 * ITB INFRASTRUCTURE AUDIT - PDF VISIBILITY FIX
 */

const currentSystemYear = new Date().getFullYear();
let myChart = null;
let initialMaxEnergy = null;

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 },
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

    document.getElementById('currentYearDisplay').innerText = currentSystemYear;

    const schoolDays = 175;
    const idleDays = (selectedMode === 365) ? 190 : 0;

    const totalStandbyBase = (pcCount * STANDBY_WATTAGE * 24 * (schoolDays + idleDays)) / 1000;
    const activeEnergyBase = (pcCount * PC_WATTAGE * 12 * schoolDays) / 1000;
    const baseEnergy = activeEnergyBase + totalStandbyBase;
    const baseWater = (occupancy * INFRA_DATA.water.fixedDailyPerPax * schoolDays) + (INFRA_DATA.water.maintenanceLitersDay * idleDays);

    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const currEnergy = baseEnergy * (1 - savings.energy);
    const currWater = baseWater * (1 - savings.water);

    const y1 = currEnergy * (1 + INFRA_DATA.electricity.variationRate);
    const y2 = y1 * (1 + INFRA_DATA.electricity.variationRate);
    const y3 = y2 * (1 + INFRA_DATA.electricity.variationRate);

    if (initialMaxEnergy === null) initialMaxEnergy = (baseEnergy * Math.pow(1.2281, 3)) * 1.1;
    updateChart(y1, y2, y3);

    const expM = selectedMode/30;
    const metrics = [
        { title: "Facility Water", val: currWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "System Energy Load", val: currEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Carbon Footprint", val: currEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Cleaning Costs", val: (INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.cleaning * expM) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Supplies Costs", val: (INFRA_DATA.costs.supplies * expM) * (1 - savings.maint), goal: (INFRA_DATA.costs.supplies * expM) * 0.7, unit: "€", icon: "📦" },
        { title: "Standby Consumption", val: totalStandbyBase * (1 - savings.energy), goal: totalStandbyBase * 0.5, unit: "kWh", icon: "🌙" },
        { title: "Wasted Energy", val: (currEnergy * 0.25) * (1 - savings.energy), goal: (baseEnergy * 0.05), unit: "kWh", icon: "⚠️" },
        { title: `${currentSystemYear + 1} Forecast`, val: y1, goal: (baseEnergy * 0.7) * 1.22, unit: "kWh", icon: "📈" }
    ];

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAchieved = m.val <= m.goal;
        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <span class="data">${Math.round(m.val).toLocaleString()}</span><span class="unit">${m.unit}</span>
                <div class="target-row" style="color: ${isAchieved ? '#22c55e' : '#e67e22'}">Target: ${Math.round(m.goal).toLocaleString()} ${m.unit}</div>
                <div class="card-actions">${TECH_POLICIES.filter(p => p.category === m.title).map(btn => `<button class="btn-action ${activePolicies.has(btn.id) ? 'active-btn' : ''}" onclick="toggleAction('${btn.id}')">${btn.label}</button>`).join("")}</div>
            </div>`;
    });

    const cBase = (baseWater * INFRA_DATA.water.pricePerL) + (baseEnergy * INFRA_DATA.energyPriceKwh) + (INFRA_DATA.costs.cleaning * expM) + (INFRA_DATA.costs.supplies * expM);
    const cCurr = (currWater * INFRA_DATA.water.pricePerL) + (currEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint)) + ((INFRA_DATA.costs.supplies * expM) * (1 - savings.maint));

    document.getElementById('totalBase').innerText = Math.round(cBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(cBase * 0.7).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(cCurr).toLocaleString() + " €";
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
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: Math.round(initialMaxEnergy), ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#fff' }, grid: { display: false } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

function toggleAction(id) { activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id); runCalculations(); }
function resetSavings() { activePolicies.clear(); initialMaxEnergy = null; runCalculations(); }

// --- CONFIGURACIÓN PARA PDF (VISIBILIDAD TOTAL) ---
window.onbeforeprint = () => {
    // 1. Eliminar padding para tirar el gráfico a la izquierda
    myChart.options.layout = { padding: 0 };

    // 2. FORZAR NEGRO PURO EN TEXTOS (Años y cifras)
    myChart.options.scales.x.ticks.color = '#000000';
    myChart.options.scales.x.ticks.font = { weight: 'bold', size: 12 };

    myChart.options.scales.y.ticks.color = '#000000';
    myChart.options.scales.y.ticks.font = { weight: 'bold', size: 11 };

    // Añadimos unidades kWh visibles en el eje Y
    myChart.options.scales.y.ticks.callback = function(value) {
        return value.toLocaleString() + ' kWh';
    };

    myChart.options.plugins.legend.labels.color = '#000000';

    // 3. Activar líneas de rejilla oscuras para dar contexto
    myChart.options.scales.x.grid = { display: true, color: '#000000', lineWidth: 1 };
    myChart.options.scales.y.grid = { display: true, color: '#dddddd', lineWidth: 1 };

    myChart.options.maintainAspectRatio = true;
    myChart.options.aspectRatio = 2.5;
    myChart.update();
};

window.onafterprint = () => {
    // Volver al estilo Matrix Web
    myChart.options.scales.x.ticks.color = '#ffffff';
    myChart.options.scales.y.ticks.color = '#ffffff';
    myChart.options.plugins.legend.labels.color = '#ffffff';
    myChart.options.scales.y.ticks.callback = function(value) { return value; };
    myChart.options.scales.x.grid = { display: false };
    myChart.options.scales.y.grid = { color: 'rgba(255,255,255,0.1)' };
    myChart.options.maintainAspectRatio = false;
    myChart.update();
};

window.onload = runCalculations;