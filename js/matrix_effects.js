/**
 * LÓGICA DE AUDITORÍA ITB - VERSIÓN FINAL
 */

const currentSystemYear = new Date().getFullYear();
let myChart = null;
let initialMaxEnergy = null; // Bloqueo de escala

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 }, // IPC Energético (22.81%)
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
    { id: 'fountains', label: "Cerrar Fuentes (8h)", impact: 0.10, type: 'water', category: "Agua Instalaciones" },
    { id: 'iot_water', label: "Sensores IoT", impact: 0.05, type: 'water', category: "Agua Instalaciones" },
    { id: 'virt', label: "Virtualización", impact: 0.15, type: 'energy', category: "Carga Energía Sistemas" },
    { id: 'autoff', label: "Auto-Apagado", impact: 0.10, type: 'energy', category: "Carga Energía Sistemas" },
    { id: 'remote', label: "Gestión Remota", impact: 0.10, type: 'maint', category: "Costes Limpieza" },
    { id: 'inv', label: "Opt. Inventario", impact: 0.05, type: 'maint', category: "Costes Suministros" }
];

let activePolicies = new Set();

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedMode = parseInt(document.getElementById('calcMode').value);

    document.getElementById('currentYearDisplay').innerText = currentSystemYear;

    // --- CÁLCULOS BASE ---
    const schoolDays = 175;
    const idleDays = (selectedMode === 365) ? 190 : 0;

    const baseEnergy = ((pcCount * PC_WATTAGE * 12 * schoolDays) + (pcCount * STANDBY_WATTAGE * 12 * schoolDays) + (pcCount * STANDBY_WATTAGE * 24 * idleDays)) / 1000;
    const baseWater = (occupancy * INFRA_DATA.water.fixedDailyPerPax * schoolDays) + (INFRA_DATA.water.maintenanceLitersDay * idleDays);

    // --- APLICACIÓN DE AHORROS ---
    let savings = { water: 0, energy: 0, maint: 0 };
    TECH_POLICIES.forEach(p => { if (activePolicies.has(p.id)) savings[p.type] += p.impact; });

    const currEnergy = baseEnergy * (1 - savings.energy);
    const currWater = baseWater * (1 - savings.water);

    // --- PROYECCIÓN 3 AÑOS (GRÁFICO) ---
    const y1 = currEnergy * (1 + INFRA_DATA.electricity.variationRate);
    const y2 = y1 * (1 + INFRA_DATA.electricity.variationRate);
    const y3 = y2 * (1 + INFRA_DATA.electricity.variationRate);

    // Bloqueo de escala inicial
    if (initialMaxEnergy === null) {
        initialMaxEnergy = (baseEnergy * Math.pow(1.2281, 3)) * 1.1;
    }
    updateChart(y1, y2, y3);

    // --- RENDER TARJETAS ---
    const metrics = [
        { title: "Agua Instalaciones", val: currWater, goal: baseWater * 0.70, unit: "L", icon: "💧" },
        { title: "Carga Energía Sistemas", val: currEnergy, goal: baseEnergy * 0.70, unit: "kWh", icon: "🖥️" },
        { title: "Huella de Carbono", val: currEnergy * CO2_FACTOR, goal: (baseEnergy * 0.70) * CO2_FACTOR, unit: "kg", icon: "🌍" },
        { title: "Costes Limpieza", val: (INFRA_DATA.costs.cleaning * (selectedMode/30)) * (1 - savings.maint), goal: (INFRA_DATA.costs.cleaning * (selectedMode/30)) * 0.7, unit: "€", icon: "🛠️" },
        { title: "Costes Suministros", val: (INFRA_DATA.costs.supplies * (selectedMode/30)) * (1 - savings.maint), goal: (INFRA_DATA.costs.supplies * (selectedMode/30)) * 0.7, unit: "€", icon: "📦" },
        { title: `Previsión ${currentSystemYear + 1}`, val: y1, goal: (baseEnergy * 0.7) * 1.22, unit: "kWh", icon: "📈" }
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
                    Objetivo: ${Math.round(m.goal).toLocaleString()} ${m.unit}
                </div>
                <div class="card-actions">${actionButtons}</div>
            </div>`;
    });

    // --- FINANZAS FINALES ---
    const expM = selectedMode/30;
    const cBase = (baseWater * INFRA_DATA.water.pricePerL) + (baseEnergy * INFRA_DATA.energyPriceKwh) + (INFRA_DATA.costs.cleaning * expM) + (INFRA_DATA.costs.supplies * expM);
    const cCurr = (currWater * INFRA_DATA.water.pricePerL) + (currEnergy * INFRA_DATA.energyPriceKwh) + ((INFRA_DATA.costs.cleaning * expM) * (1 - savings.maint)) + ((INFRA_DATA.costs.supplies * expM) * (1 - savings.maint));

    document.getElementById('totalBase').innerText = Math.round(cBase).toLocaleString() + " €";
    document.getElementById('totalTarget').innerText = Math.round(cBase * 0.7).toLocaleString() + " €";
    document.getElementById('totalCurrent').innerText = Math.round(cCurr).toLocaleString() + " €";

    const prog = Math.min(100, Math.max(0, ((cBase - cCurr) / (cBase * 0.3)) * 100));
    document.getElementById('efficiencyBar').style.width = prog + "%";
    document.getElementById('efficiencyText').innerText = `${Math.round(prog)}% del objetivo de eficiencia alcanzado`;
}

function updateChart(y1, y2, y3) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [currentSystemYear + 1, currentSystemYear + 2, currentSystemYear + 3],
            datasets: [{
                label: 'Consumo Proyectado (kWh)',
                data: [Math.round(y1), Math.round(y2), Math.round(y3)],
                backgroundColor: 'rgba(34, 197, 94, 0.4)',
                borderColor: '#22c55e',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: Math.round(initialMaxEnergy), ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff', font: { size: 14 } } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

function toggleAction(id) { activePolicies.has(id) ? activePolicies.delete(id) : activePolicies.add(id); runCalculations(); }
function resetSavings() { activePolicies.clear(); initialMaxEnergy = null; runCalculations(); }
window.onload = runCalculations;