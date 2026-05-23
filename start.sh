#!/bin/bash

# //_-_-_-_-_-_-_-_-_-_-_-_-(CRÉDITOS)_-_-_-_-_-_-_-_-_-_-_-_-_-_-_--\\
# by: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄 & Manus AI
# whats: +55 94 99156-9380
# canal: @Otaku.mp4
# insta: @lucas_mod_domina
# Github: https://github.com/Otakump4

# //_-_-_-_-_-_-_-_-_-_-_-_-(DIREITOS AUTORAIS)_-_-_-_-_-_-_-_-_-_-_-_-_-_-_--\\
# Direitos Autorais © [2026] Zero Two Beta - Otimizado por Paulo Mod 

# Cores (Tema Zero Two)
NC='\033[0m'
RED='\033[1;31m'
PINK='\033[1;38;5;205m'
MAGENTA='\033[1;35m'
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
BLUE='\033[1;34m'
PURPLE='\033[1;38;5;93m'

# ─── Redireciona /tmp do sistema para dentro do container ───────
# /tmp padrão = 100MB compartilhado. Aqui usa o espaço do plano.
# Node, ffmpeg e todos os subprocessos herdam via export.
CUSTOM_TMP="$(pwd)/util/temp/sys"
mkdir -p "$CUSTOM_TMP"
export TMPDIR="$CUSTOM_TMP"
export TEMP="$CUSTOM_TMP"
export TMP="$CUSTOM_TMP"
printf "${GREEN}[+] TMPDIR -> $CUSTOM_TMP${NC}\n"
# ────────────────────────────────────────────────────────────────

LAST_METHOD_FILE="./database/last_method.txt"
QR_SESSION_FOLDER="./database/KAUROKO-QR"

# Função para exibir o banner da Zero Two
show_banner() {
    clear
    printf "${PINK}"
    cat << "EOF"
⠀⠀⠀⠀⠀⢠⡾⠲⠶⣤⣄⣤⣤⣤⣤⡿⠛⠿⡴⠾⠟⢻⡆⠀⠄⠄
⠀⠀⠀⣼⠁⠀⠀⠀⠉⠁⠀⢀⣿⠑⡿⣿⠿⣷⣥⣥⣷⡀⠀⠀
⠀⠀⠀⢹⡶⠀⠀⠀⠁⠀⠀⠈⢯⣡⣿⣿⣀⣰⣿⣦⢂⡏⠀⠀
⠀⠀⢀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠹⣍⣭⣾⠁⠀⠀
⠀⣀⣸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣸⣧⣤⡀
⠈⠉⠹⣏⡁⠀⢸⣿⠀⠀⠀⢀⡀⠀⠀⠀⣿⠆⠀⢀⣸⣇⣀⠀
⠀⠐⠋⢻⣅⡄⢀⣀⣀⡀⠀⠯⠽⠂⢀⣀⣀⡀⠀⣤⣿⠀⠉⠀
⠀⠀⠴⠛⠙⣳⠋⠉⠉⠙⣆⠀⠀⢰⡟⠉⠈⠙⢷⠟⠈⠙⠂⠀
⠀⠀⠀⠀⠀⢻⣄⣠⣤⣴⠟⠛⠛⠛⢧⣤⣤⣀⡾⠀
 I love my girlfriend ❤️‍🩹⠀⠀
EOF
    printf "${MAGENTA} 🩷 kaoruko supremacy - Otimizada e Pronta! ❤️‍🔥\n${NC}"
    printf "${CYAN}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${NC}"
}

# Função para obter saudação baseada no horário local
get_greeting() {
    local hour=$(date +"%H")
    if [ "$hour" -ge 5 ] && [ "$hour" -lt 12 ]; then
        echo "Bom dia"
    elif [ "$hour" -ge 12 ] && [ "$hour" -lt 18 ]; then
        echo "Boa tarde"
    else
        echo "Boa noite"
    fi
}

# Função para limpar arquivos temporários
clean_temp() {
    printf "${CYAN}[*] Limpando arquivos temporários para melhor performance...${NC}\n"
    rm -f ./temp/baileys_store.json
    rm -f ./temp/floodControl.json
}

# Função para verificar dependências
#check_deps() {


# Função para iniciar o bot
start_bot() {
    local method=$1
    echo "$method" > "$LAST_METHOD_FILE"
    clean_temp
    
    while true; do
        show_banner
        if [ "$method" = "qr" ]; then
            printf "${MAGENTA}╭──────────────────────────────────────────────────╮\n"
            printf "│ ${PINK}🚀 Iniciando conexão via QR-CODE...              ${MAGENTA}│\n"
            printf "╰──────────────────────────────────────────────────╯\n${NC}"
            node connect.js 
        else
            printf "${MAGENTA}╭──────────────────────────────────────────────────╮\n"
            printf "│ ${PINK}🔑 Iniciando conexão via Código...               ${MAGENTA}│\n"
            printf "╰──────────────────────────────────────────────────╯\n${NC}"
            node connect.js sim
        fi
        
        # Se o bot fechar, verificar se foi erro de sessão
        printf "\n${YELLOW}⚠️ O bot foi encerrado. Reiniciando em 5 segundos...${NC}\n"
        printf "${CYAN}Dica: Se a conexão caiu, eu cuidarei disso!${NC}\n"
        sleep 5
    done
}

# Função para o menu principal
show_menu() {
    local greeting=$(get_greeting)
    show_banner
    printf "${MAGENTA}╭──────────────────────────────────────────────────╮\n"
    printf "│ ${PINK}❤️‍🩹 ${greeting}, Sasuke! O que deseja fazer? ${MAGENTA} \n"
    printf "╰──────────────────────────────────────────────────╯\n"
    printf "│ ${PINK}1)${NC} Conectar via ${GREEN}QR-CODE${NC}                      \n"
    printf "│ ${PINK}2)${NC} Conectar via ${YELLOW}Código${NC}                       \n"
    printf "│ ${PINK}3)${NC} Limpar Sessão e Cache ${RED}(Reset)${NC}             \n"
    printf "│ ${PINK}4)${NC} Chamar Suporte ${BLUE}(WhatsApp)${NC}                 \n"
    printf "│ ${PINK}0)${NC} Sair do Sistema ${RED}💔${NC}                        \n"
    printf "${MAGENTA}╰──────────────────────────────────────────────────╯\n"
    printf "${PINK}❯❯ ${NC}Digite sua escolha: "
}

# Auto-start se já houver sessão
auto_start() {
    if [ -d "$QR_SESSION_FOLDER" ] && [ -f "$LAST_METHOD_FILE" ]; then
        METHOD=$(cat "$LAST_METHOD_FILE")
        printf "${GREEN}[+] Sessão anterior detectada! Reconectando...${NC}\n"
        sleep 2
        start_bot "$METHOD"
    fi
}

# Início do Script

auto_start

while true; do
    show_menu
    read -r choice
    case "$choice" in
        1)
            start_bot "qr"
            ;;
        2)
            start_bot "code"
            ;;
        3)
            printf "${RED}[!] Tem certeza que deseja limpar a sessão? (s/n): ${NC}"
            read -r confirm
            if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
                rm -rf "$QR_SESSION_FOLDER"
                rm -f "$LAST_METHOD_FILE"
                clean_temp
                printf "${GREEN}[+] Tudo limpo, Darling! Agora podemos começar do zero.${NC}\n"
                sleep 2
            fi
            ;;
        4)
            printf "\n${PINK}💬 Abrindo suporte:\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            printf "${BLUE}🔗 https://wa.me/559774004582?text=suporte_anny_uchiha\n"
            printf "${YELLOW}📋 Dica: Pressione CTRL+Click no link para abrir!${NC}\n"
            printf "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            printf "\nPressione ENTER para voltar..."
            read -r
            ;;
        0)
            printf "\n${RED}⏹️ Até logo, Sasuke... Não me deixe esperando muito! 💔${NC}\n"
            exit 0
            ;;
        *)
            printf "\n${RED}⚠️ Opção inválida! Não me irrite, Sasuke...${NC}\n"
            sleep 2
            ;;
    esac
done
