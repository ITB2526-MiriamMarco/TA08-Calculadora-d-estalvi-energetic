/**
 * ITB INFRASTRUCTURE ANALYZER - FINAL VERSION
 * Features: Dual-turn logic, interactive policies, and goal tracking.
 */

const INFRA_DATA = {
    electricity: { variationRate: 0.2281 }, // Forecast increment
    water: { fixedDailyPerPax: 133 },       // Liters per student use
    costs: {
        cleaning: 175,
        supplies: 91.25
    }
};

const PC_WATTAGE = 200;
const STANDBY_WATTAGE = 10;
const CO2_FACTOR = 0.259;

function runCalculations() {
    const pcCount = parseInt(document.getElementById('pcCount').value) || 0;
    const occupancy = parseInt(document.getElementById('studentCount').value) || 0;
    const selectedDays = parseInt(document.getElementById('calcMode').value);
    const grid = document.getElementById('resultsGrid');

    // 1. CALCULAR AHORRO SEGÚN POLÍTICAS SELECCIONADAS
    let totalSavingsPercent = 0;
    document.querySelectorAll('.policy-check:checked').forEach(check => {
        totalSavingsPercent += parseInt(check.dataset.impact);
    });
    const reductionMultiplier = (100 - totalSavingsPercent) / 100;

    // 2. CÁLCULOS BASE (SIN AHORRO) PARA EL OBJETIVO (GOAL)
    const baseWater = occupancy * INFRA_DATA.water.fixedDailyPerPax * selectedDays;
    const baseEnergy = ((pcCount * PC_WATTAGE * 12 * selectedDays) / 1000) +
                       ((pcCount * STANDBY_WATTAGE * 24 * (selectedDays === 365 ? 0 : 365-selectedDays)) / 1000);
    const baseExpenseFactor = (selectedDays === 175) ? 3 : 12;

    // 3. CÁLCULOS ACTUALES (APLICANDO LAS POLÍTICAS DE AHORRO)
    const currentWater = baseWater * reductionMultiplier;
    const currentEnergy = baseEnergy * reductionMultiplier;
    const currentCleaning = (INFRA_DATA.costs.cleaning * baseExpenseFactor) * reductionMultiplier;
    const currentSupplies = (INFRA_DATA.costs.supplies * baseExpenseFactor) * reductionMultiplier;

    // Definición de métricas para mostrar
    const metrics = [
        {
            title: "Facility Water",
            current: currentWater,
            goal: baseWater * 0.70,
            unit: "L", icon: "💧"
        },
        {
            title: "Energy Load",
            current: currentEnergy,
            goal: baseEnergy * 0.70,
            unit: "kWh", icon: "🖥️"
        },
        {
            title: "Carbon Footprint",
            current: currentEnergy * CO2_FACTOR,
            goal: (baseEnergy * 0.70) * CO2_FACTOR,
            unit: "kg", icon: "🌍"
        },
        {
            title: "Resource Load Index",
            current: pcCount > 0 ? (currentWater / pcCount) : 0,
            goal: pcCount > 0 ? (baseWater * 0.70 / pcCount) : 0,
            unit: "L/Node", icon: "📊"
        },
        {
            title: "2026 Forecast",
            current: currentEnergy * (1 + INFRA_DATA.electricity.variationRate),
            goal: (baseEnergy * 0.70) * (1 + INFRA_DATA.electricity.variationRate),
            unit: "kWh", icon: "📈"
        },
        {
            title: "Maintenance Total",
            current: currentCleaning + currentSupplies,
            goal: (currentCleaning + currentSupplies) / reductionMultiplier * 0.70,
            unit: "€", icon: "🛠️"
        }
    ];

    // Renderizar tarjetas
    grid.innerHTML = "";
    metrics.forEach(m => {
        const isAcheived = m.current <= m.goal;

        grid.innerHTML += `
            <div class="card">
                <h3>${m.icon} ${m.title}</h3>
                <div class="data-container">
                    <div class="current-row">
                        <span class="label">Current (with Policies):</span>
                        <span class="data" style="color: ${totalSavingsPercent > 0 ? '#3498db' : '#fff'}">
                            ${parseFloat(m.current.toFixed(m.unit === "L" ? 0 : 1)).toLocaleString()}
                        </span>
                        <span class="unit">${m.unit}</span>
                    </div>
                    <div class="target-row" style="color: ${isAcheived ? '#22c55e' : '#e67e22'}; margin-top: 12px; border-top: 1px dashed #555; padding-top: 8px;">
                        <span class="label">${isAcheived ? '✅ Goal Achieved' : 'Strategic Goal (-30%):'}</span>
                        <span class="data-target">${parseFloat(m.goal.toFixed(m.unit === "L" ? 0 : 1)).toLocaleString()}</span>
                        <span class="unit">${m.unit}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

// Función para imprimir reporte
function exportToPDF() {
    window.print();
}

// Inicialización automática al cargar
window.onload = runCalculations;