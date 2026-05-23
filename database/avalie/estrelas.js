const fs = require('fs')
const { saveJSON, sendHours, contarDias, alerandom, colors } = require('../../definicoes.js')

// ── Stars DB ──────────────────────────────────────────────

const starpath = './database/avalie/star.json'

if (!fs.existsSync(starpath)) {
    const initial = Array.from({ length: 6 }, (_, i) => ({ star: i, usuarios: [] }))
    fs.writeFileSync(starpath, JSON.stringify(initial, null, 2))
}

const stars = JSON.parse(fs.readFileSync(starpath))

const saveStar = () => saveJSON(stars, starpath)

const getStarUsu = (usu) =>
    stars.find(s => s.usuarios.some(u => u.id === usu))

const existsUsuStar = (usu) => !!getStarUsu(usu)

const getUsuStar = (usu) => {
    const bucket = getStarUsu(usu)
    return bucket?.usuarios.find(u => u.id === usu) ?? null
}

function addStar(nmr, usu) {
    const n = Number(nmr)
    if (n < 0 || n >= stars.length) {
        return console.log(colors.red(`Estrela inválida "${nmr}". Válidas:\n`) + colors.white(stars.map(s => s.star).join('\n')))
    }
    stars[n].usuarios.push({
        id: usu,
        comentario: { text: '', data: '' },
        data: sendHours('DD/MM/YYYY'),
        hora: sendHours('HH:mm'),
    })
    saveStar()
}

function addComentStar(usu, txt) {
    const entry = getUsuStar(usu)
    if (!entry) return
    entry.comentario.text = txt
    entry.comentario.data = sendHours('DD/MM/YYYY')
    saveStar()
}

function getRandomComent(nmr, quant = 5) {
    const pool = stars[Number(nmr)].usuarios
        .filter(u => u.comentario.text.length > 0)
        .map(u => ({ id: u.id, text: u.comentario.text, data: u.comentario.data }))

    if (pool.length <= quant) return pool

    const result = []
    for (let i = 0; i < quant; i++) {
        const idx = alerandom(pool.length)
        result.push(pool.splice(idx, 1)[0])
    }
    return result
}

function rmStar(nmr, usu, quant) {
    const n = Number(nmr)
    const bucket = stars[n]

    if (quant !== undefined) {
        const keep = bucket.usuarios.length - Number(quant)
        if (keep <= 0) {
            bucket.usuarios = []
        } else {
            const list = [...bucket.usuarios]
            for (let i = 0; i < bucket.usuarios.length - keep; i++) {
                list.splice(alerandom(list.length), 1)
            }
            bucket.usuarios = list
        }
    } else {
        const idx = bucket.usuarios.findIndex(u => u.id === usu)
        if (idx >= 0) bucket.usuarios.splice(idx, 1)
    }

    saveStar()
}

function resetStar() {
    const LIMIT_DAYS = 30 * 6
    const today = contarDias(sendHours('DD/MM/YYYY'))

    for (const bucket of stars) {
        const expired = bucket.usuarios
            .filter(u => today - contarDias(u.data) >= LIMIT_DAYS)
            .map(u => u.id)

        for (const id of expired) rmStar(bucket.star, id)
    }
}

// ── StayMessage DB ────────────────────────────────────────

const staymessagepath = './database/avalie/staymessage.json'

if (!fs.existsSync(staymessagepath)) fs.writeFileSync(staymessagepath, JSON.stringify([], null, 2))

const staymessage = JSON.parse(fs.readFileSync(staymessagepath))

const saveStayMessage = () => saveJSON(staymessage, staymessagepath)

function addMessageInSM(message, usu, quant = 1) {
    if (existsUsuStar(usu)) return

    const idx = staymessage.findIndex(i => i.id === usu)

    if (idx < 0) {
        staymessage.push({ id: usu, messages: quant, lastTime: message.tempo })
        return saveStayMessage()
    }

    const entry = staymessage[idx]

    if (entry.messages < 1000) {
        entry.messages += quant
        return saveStayMessage()
    }

    staymessage.splice(idx, 1)
    saveStayMessage()
    message.kyomi.sendMessage(message.from, {
        text: `✨ ${message.tempo} ${message.pushname}, você está gostando dos meus serviços? 🌸 Não deixe de avaliar meu trabalho através do comando *${message.prefix}avalie* 💖`
    })
}

function rmMessageInSM(usu) {
    const idx = staymessage.findIndex(i => i.id === usu)
    if (idx >= 0) {
        staymessage.splice(idx, 1)
        saveStayMessage()
    }
}

module.exports = {
    stars, saveStar,
    getStarUsu, getUsuStar, existsUsuStar,
    addStar, rmStar, addComentStar, getRandomComent, resetStar,
    staymessage, saveStayMessage, addMessageInSM, rmMessageInSM,
}
