from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

dados_do_jogador = {
    "distancia_km": 0.0,
    "tempo_min": 0.0,
    "velocidade_integrada": 0.0
}

@app.route('/')
def home():
    return "<h1>Servidor de Dados do Rastreamento de Jogador.</h1>"

@app.route('/api/atualizar_dados', methods=['POST'])
def atualizar_dados():
    global dados_do_jogador
    try:
        dados = request.get_json()
        print(f"Dados recebidos: {dados}")

        if 'distancia_km' in dados and 'tempo_min' in dados:
            dados_do_jogador['distancia_km'] = float(dados['distancia_km'])
            dados_do_jogador['tempo_min'] = float(dados['tempo_min'])
            
            if 'velocidade_integrada' in dados:
                dados_do_jogador['velocidade_integrada'] = float(dados['velocidade_integrada'])

            print(f"Dados atualizados: {dados_do_jogador}")
            return jsonify({"message": "Dados do jogador recebidos com sucesso"}), 200
        else:
            return jsonify({"error": "Faltam campos 'distancia_km' ou 'tempo_min' no JSON"}), 400
    except Exception as e:
        print(f"Erro ao processar os dados: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@app.route('/api/atualizar_dados', methods=['GET'])
def obter_dados():
    return jsonify(dados_do_jogador), 200

@app.route('/favicon.ico')
def favicon():
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)