#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}=======================================${NC}"
echo -e "${GREEN}    KAORUKO WAGURI - AUTO UPDATE      ${NC}"
echo -e "${PURPLE}=======================================${NC}"

# Verificar atualizações no GitHub
echo -e "${GREEN}[INFO]${NC} Verificando atualizações no GitHub..."
git fetch origin main

# Comparar versão local com a remota
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo -e "${PURPLE}[UPDATE]${NC} Nova versão encontrada! Atualizando..."
    
    # Salvar mudanças locais temporariamente (como configs)
    git stash
    
    # Puxar a nova versão
    git pull origin main
    
    # Restaurar mudanças locais (se houver)
    git stash pop
    
    echo -e "${GREEN}[SUCCESS]${NC} Bot atualizado com sucesso!"
    
    # Reinstalar dependências se o package.json mudou
    echo -e "${GREEN}[INFO]${NC} Verificando novas dependências..."
    npm install
else
    echo -e "${GREEN}[INFO]${NC} O bot já está na versão mais recente."
fi

echo -e "${PURPLE}=======================================${NC}"
echo -e "${GREEN}[START]${NC} Iniciando o Kaoruko Waguri System..."
echo -e "${PURPLE}=======================================${NC}"

# Loop para reiniciar em caso de erro
while :
do
    node index.js
    echo -e "${PURPLE}[RESTART]${NC} Bot parou inesperadamente. Reiniciando em 5 segundos..."
    sleep 5
done
