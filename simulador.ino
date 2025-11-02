#include <Wire.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- Configurações de Conexão ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";
String serverUrl = "http://20.97.192.88:5000/api/atualizar_dados";

// --- Variáveis do MPU6050 e Cálculo ---
MPU6050 mpu;
int16_t ax, ay, az;

// Constantes de Cálculo
const float G_CONVERSION = 16384.0; // Para faixa de ±2g 
const float DELTA_T_SECONDS = 0.5;
// AJUSTES PARA MAIOR SENSIBILIDADE/DISTÂNCIA:
const float STEP_LENGTH_METERS = 1.0; 
const float ACTIVITY_THRESHOLD_G = 1.2; 

// Variáveis de Estado
float velocidade_integrada = 0.0; // Velocidade integrada em m/s
float distancia_total_m = 0.0; // Distância total em metros
int step_count = 0; 
unsigned long last_step_time = 0; 

// --- Configuração de Tempo de Jogo (Simulação 90 min em 5 min reais) ---
const unsigned long REAL_DURATION_MS = 5 * 60 * 1000; // 5 minutos na vida real
const float GAME_TOTAL_MINUTES = 90.0; // Total de minutos de jogo
unsigned long start_time;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Wire.begin();
  mpu.initialize();
  
  if (mpu.testConnection()) {
    Serial.println("MPU6050 conectado com sucesso!");
  } else {
    Serial.println("Falha na conexão com o MPU6050!");
    while (1);
  }
  
  Serial.print("Conectando ao WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConectado ao WiFi!");
  
  start_time = millis(); // Inicia a contagem do tempo de simulação
}

void loop() {
  unsigned long current_time = millis();
  
  // --- 1. Leitura e Cálculo da Aceleração ---
  mpu.getAcceleration(&ax, &ay, &az);
  float ax_g = ax / G_CONVERSION;
  float ay_g = ay / G_CONVERSION;
  float az_g = az / G_CONVERSION;
  float acel_total_g = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);
  
  // --- 2. Detecção de Passo e Cálculo de Distância ---
  if (acel_total_g > ACTIVITY_THRESHOLD_G && (current_time - last_step_time > 300)) { 
    step_count++;
    distancia_total_m += STEP_LENGTH_METERS; 
    last_step_time = current_time;
  }
  
  // --- 3. Estimativa de Velocidade (Integração) ---
  // Aceleração com a gravidade removida (somente aceleração efetiva de movimento)
  float acel_movimento = max(0.0f, acel_total_g - 1.0f); // Subtraímos a gravidade (1.0g)
  float acel_movimento_ms2 = acel_movimento * 9.81; // Converter para m/s²

  // Integração com o tempo, limitando a aceleração para evitar crescimento rápido
  velocidade_integrada += acel_movimento_ms2 * DELTA_T_SECONDS;

  // Aplique uma "fricção" para reduzir a velocidade de forma natural
  velocidade_integrada *= 0.98; // Reduz a velocidade em 2% por ciclo para simular desaceleração

  // Garantir que a velocidade não seja negativa
  if (velocidade_integrada < 0.0) {
    velocidade_integrada = 0.0;
  }
  
  // Limite de velocidade para evitar que o valor ultrapasse uma certa quantidade
  float VELOCIDADE_MAX = 10.0; // Velocidade máxima permitida em m/s
  if (velocidade_integrada > VELOCIDADE_MAX) {
    velocidade_integrada = VELOCIDADE_MAX;
  }
  
  // --- 4. Variáveis para Envio e Exibição ---
  float distancia_km = distancia_total_m / 25.0;
  float tempo_corrido_real_min = (current_time - start_time) / (1000.0 * 60.0);
  float tempo_corrido_jogo_min = (tempo_corrido_real_min / (REAL_DURATION_MS / (1000.0 * 60.0))) * GAME_TOTAL_MINUTES;

  // Limita o tempo do jogo a 90 minutos
  if (tempo_corrido_jogo_min > GAME_TOTAL_MINUTES) {
    tempo_corrido_jogo_min = GAME_TOTAL_MINUTES;
  }

  // --- 5. Envio de Dados HTTP ---
  if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      
      // JSON COMPACTO (sem espaços)
      String payload = "{\"distancia_km\":" + String(distancia_km, 3) + 
                       ",\"tempo_min\":" + String(tempo_corrido_jogo_min, 1) +
                       ",\"velocidade_integrada\":" + String(velocidade_integrada, 2) + "}";
                       
      Serial.print("Payload enviado: ");
      Serial.println(payload);
      
      int httpResponseCode = http.POST(payload);
      
      if (httpResponseCode > 0) {
        Serial.print("Dados enviados com sucesso! Código: ");
        Serial.println(httpResponseCode);
      } else {
        Serial.print("Erro ao enviar dados. Código de erro: ");
        Serial.println(httpResponseCode);
      }
      http.end();
  }

  // --- 6. Controle de Fim de Jogo ---
  if (current_time - start_time >= REAL_DURATION_MS) {
      Serial.println("\n*** FIM DA SIMULAÇÃO (90 MINUTOS DE JOGO CHEGARAM AO FIM) ***");
      while (1) { 
          delay(10000);
      }
  }

  delay(500); 
}
