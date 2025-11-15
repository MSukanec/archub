#!/bin/bash

echo "🚀 Iniciando servidores de desarrollo..."
echo ""

# Iniciar Dev API Server en puerto 3000
echo "📡 Iniciando API Server (puerto 3000)..."
npx tsx watch dev-api-server.ts &
API_PID=$!

# Esperar a que el API server inicie
sleep 2

# Iniciar Vite en puerto 5173
echo "🎨 Iniciando Vite (puerto 5173)..."
npx vite --host 0.0.0.0 &
VITE_PID=$!

echo ""
echo "✅ Servidores iniciados:"
echo "   Frontend: http://localhost:5173"
echo "   API: http://localhost:3000/api/*"
echo ""
echo "Presioná Ctrl+C para detener ambos servidores"
echo ""

# Manejar Ctrl+C
trap "kill $API_PID $VITE_PID; exit" INT TERM

# Esperar a que terminen
wait $API_PID $VITE_PID
