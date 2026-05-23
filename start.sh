#!/bin/bash

# Cores
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
NC='\033[0m'

clear
echo -e "${PURPLE}=======================================${NC}"
echo -e "${GREEN}    KAORUKO WAGURI - SUPER UPDATE     ${NC}"
echo -e "${PURPLE}=======================================${NC}"

# Tentar atualizar de forma forçada para evitar erros de conflito
echo -e "${GREEN}[INFO]${NC} Verificando e forçando atualização..."
git fetch --all
git reset --hard origin/main

echo -e "${GREEN}[SUCCESS]${NC} Sistema sincronizado com o GitHub!"
echo -e "${PURPLE}=======================================${NC}"

# Iniciar o bot com reinicialização automática
while :
do
    echo -e "${GREEN}[START]${NC} Iniciando Kaoruko Waguri..."
    node index.js
    echo -e "${PURPLE}[RESTART]${NC} Bot caiu. Reiniciando em 5 segundos..."
    sleep 5
done
