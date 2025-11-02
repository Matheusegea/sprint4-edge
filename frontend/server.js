const SERVER_URL = "http://20.97.192.88:5000"
const GET_DATA_URL = `${SERVER_URL}/api/atualizar_dados`

const JOGO_MAX_MINUTOS = 90.0

const DISTANCIA_KM_DISPLAY = document.getElementById('distancia_km_display')
const TEMPO_MIN_DISPLAY = document.getElementById('tempo_min_display')
const TEMPO_PROGRESSO = document.getElementById('tempo_progresso')
const PROGRESSO_PERCENTUAL_DISPLAY = document.getElementById('progresso_percentual_display')
const VELOCIDADE_DISPLAY = document.getElementById('velocidade_display') 
const STATUS_CONEXAO = document.getElementById('status_conexao')

async function fetchPlayerData() {
    try {
        const response = await fetch(GET_DATA_URL)
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}. Verifique se o backend está rodando.`)
        }

        const data = await response.json()
        
        const distancia_km = parseFloat(data.distancia_km) || 0
        const tempo_min = parseFloat(data.tempo_min) || 0
        const velocidade_ms = parseFloat(data.velocidade_integrada) || 0
        
        
        if (DISTANCIA_KM_DISPLAY) {
            DISTANCIA_KM_DISPLAY.textContent = distancia_km.toFixed(2)
        }

        if (TEMPO_MIN_DISPLAY) {
            TEMPO_MIN_DISPLAY.textContent = Math.floor(tempo_min)

            let progresso_percentual = (tempo_min / JOGO_MAX_MINUTOS) * 100
            if (progresso_percentual > 100) progresso_percentual = 100

            if (TEMPO_PROGRESSO) {
                TEMPO_PROGRESSO.style.width = `${progresso_percentual.toFixed(1)}%`
            }
            if (PROGRESSO_PERCENTUAL_DISPLAY) {
                PROGRESSO_PERCENTUAL_DISPLAY.textContent = `${progresso_percentual.toFixed(1)}%`
            }
        }

        if (VELOCIDADE_DISPLAY) {
            VELOCIDADE_DISPLAY.textContent = velocidade_ms.toFixed(1)
        }

        STATUS_CONEXAO.textContent = `Última atualização: ${new Date().toLocaleTimeString()} | Conectado.`
        STATUS_CONEXAO.classList.remove('text-red-500')
        STATUS_CONEXAO.classList.add('text-green-500')


    } catch (error) {
        console.error("Erro ao buscar dados:", error)
        STATUS_CONEXAO.textContent = `ERRO: ${error.message}. Verifique o servidor.`
        STATUS_CONEXAO.classList.remove('text-green-500')
        STATUS_CONEXAO.classList.add('text-red-500')
    }
}

setInterval(fetchPlayerData, 2000)

fetchPlayerData()