const SERVER_URL = "http://20.97.192.88:5000";
const GET_DATA_URL = `${SERVER_URL}/api/atualizar_dados`;

const JOGO_MAX_MINUTOS = 90.0;

const DISTANCIA_KM_DISPLAY = document.getElementById('distancia_km_display');
const TEMPO_MIN_DISPLAY = document.getElementById('tempo_min_display');
const TEMPO_PROGRESSO = document.getElementById('tempo_progresso');
const PROGRESSO_PERCENTUAL_DISPLAY = document.getElementById('progresso_percentual_display');
const VELOCIDADE_DISPLAY = document.getElementById('velocidade_display');
const STATUS_CONEXAO = document.getElementById('status_conexao');

const ctx = document.getElementById('graficoDesempenho');
let distanciaPrimeiroTempo = 0;
let distanciaSegundoTempo = 0;

const grafico = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['1º Tempo (0–45 min)', '2º Tempo (45–90 min)'],
        datasets: [{
            label: 'Distância percorrida (km)',
            data: [0, 0],
            backgroundColor: ['#3B82F6', '#8B5CF6'],
            borderRadius: 10,
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#d1d5db' },
                grid: { color: '#374151' }
            },
            x: {
                ticks: { color: '#d1d5db' },
                grid: { display: false }
            }
        },
        plugins: {
            legend: {
                labels: { color: '#d1d5db' }
            }
        }
    }
});

async function fetchPlayerData() {
    try {
        const response = await fetch(GET_DATA_URL);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const data = await response.json();

        const distancia_km = parseFloat(data.distancia_km) || 0;
        const tempo_min = parseFloat(data.tempo_min) || 0;
        const velocidade_ms = parseFloat(data.velocidade_integrada) || 0;

        DISTANCIA_KM_DISPLAY.textContent = distancia_km.toFixed(2);
        TEMPO_MIN_DISPLAY.textContent = Math.floor(tempo_min);
        VELOCIDADE_DISPLAY.textContent = velocidade_ms.toFixed(1);

        let progresso_percentual = (tempo_min / JOGO_MAX_MINUTOS) * 100;
        if (progresso_percentual > 100) progresso_percentual = 100;
        TEMPO_PROGRESSO.style.width = `${progresso_percentual.toFixed(1)}%`;
        PROGRESSO_PERCENTUAL_DISPLAY.textContent = `${progresso_percentual.toFixed(1)}%`;

        STATUS_CONEXAO.textContent = `Última atualização: ${new Date().toLocaleTimeString()} | Conectado.`;
        STATUS_CONEXAO.classList.remove('text-red-500');
        STATUS_CONEXAO.classList.add('text-green-500');

        if (tempo_min <= 45) {
            distanciaPrimeiroTempo = distancia_km;
        } else {
            distanciaSegundoTempo = distancia_km - distanciaPrimeiroTempo;
        }

        grafico.data.datasets[0].data = [
            distanciaPrimeiroTempo.toFixed(2),
            distanciaSegundoTempo.toFixed(2)
        ];
        grafico.update();

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        STATUS_CONEXAO.textContent = `ERRO: ${error.message}`;
        STATUS_CONEXAO.classList.remove('text-green-500');
        STATUS_CONEXAO.classList.add('text-red-500');
    }
}

setInterval(fetchPlayerData, 2000);
fetchPlayerData();
