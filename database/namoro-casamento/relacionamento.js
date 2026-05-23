const fs = require('fs')
const moment = require('moment-timezone')
const { sendHours, colors, saveJSON } = require('../../definicoes')

const relationshippath = './database/namoro-casamento/relationship.json'

// Garante diretório e arquivo
if (!fs.existsSync('./database/namoro-casamento')) {
    fs.mkdirSync('./database/namoro-casamento', { recursive: true })
}
if (!fs.existsSync(relationshippath)) {
    fs.writeFileSync(relationshippath, JSON.stringify([]))
}

const relationShip = JSON.parse(fs.readFileSync(relationshippath))

function saveRelationShip() {
    saveJSON(relationShip, relationshippath)
}

//==================GERAL==================\\

const getGeralOrder = (user) => {
    let caixa = []
    let nmr = -1
    for (let i of relationShip) {
        nmr++
        if (i.ids.includes(user)) {
            caixa.push({ dados: i, mapa: nmr })
        }
    }
    return {
        exists: caixa.length > 0,
        map: caixa.length > 0 ? caixa[0].mapa : -1,
        dados: caixa.length > 0 ? caixa[0].dados : {}
    }
}

const dadosShip = (ativo = false, aguarde = false, data = true) => ({
    ativo,
    aguarde,
    data: {
        hora:   data ? sendHours('HH')   : 0,
        minuto: data ? sendHours('mm')   : 0,
        segundo:data ? sendHours('ss')   : 0,
        dia:    data ? sendHours('DD')   : 0,
        mes:    data ? sendHours('MM')   : 0,
        ano:    data ? sendHours('YYYY') : 0
    }
})

function delGeralOrder(user) {
    let data = getGeralOrder(user)
    if (data.exists) {
        relationShip.splice(data.map, 1)
        saveRelationShip()
    }
}

function rmOrderGeral(user) {
    let data = getGeralOrder(user)
    if (data.exists) {
        data.dados.pedido = []
        saveRelationShip()
    }
}

const userIsAffair = (user) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (data.dados.namoro.length <= 0) return false
    return data.dados.namoro[0].ativo
}

const userIsMarriage = (user) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (data.dados.casamento.length <= 0) return false
    return data.dados.casamento[0].ativo
}

const getOutherCasal = (user) => {
    let data = getGeralOrder(user)
    if (!data.exists) return undefined
    return data.dados.ids.find(id => !id.includes(user))
}

const getCasalTime = (user) => {
    if (!userIsAffair(user)) return {}
    let data = getGeralOrder(user)
    let t = userIsMarriage(user)
        ? data.dados.casamento[0].data
        : data.dados.namoro[0].data

    let inicio = moment.tz(
        `${t.ano}-${String(t.mes).padStart(2,'0')}-${String(t.dia).padStart(2,'0')} ${String(t.hora).padStart(2,'0')}:${String(t.minuto).padStart(2,'0')}:${String(t.segundo).padStart(2,'0')}`,
        'America/Sao_Paulo'
    )
    let fim = moment.tz(sendHours('YYYY-MM-DD HH:mm:ss'), 'America/Sao_Paulo')
    let duracao = moment.duration(fim.diff(inicio))

    let { anos, meses, dias, horas, minutos, segundos } = {
        anos:    duracao.years(),
        meses:   duracao.months(),
        dias:    duracao.days(),
        horas:   duracao.hours(),
        minutos: duracao.minutes(),
        segundos:duracao.seconds()
    }

    console.log(
        `${'-=+='.repeat(4)}-\n` +
        `${colors.cyan('HORAS:')} ${horas}\n` +
        `${colors.cyan('MINUTOS:')} ${minutos}\n` +
        `${colors.cyan('SEGUNDOS:')} ${segundos}\n` +
        `${colors.blue('DIAS:')} ${dias}\n` +
        `${colors.blue('MESES:')} ${meses}\n` +
        `${colors.blue('ANOS:')} ${anos}\n` +
        `${'-=+='.repeat(4)}-`
    )

    const plural = (n, s, p) => `${n} ${n !== 1 ? p : s}`
    const DBtxt = {
        horas:   plural(horas,   'hora',    'horas'),
        minutos: plural(minutos, 'minuto',  'minutos'),
        segundos:plural(segundos,'segundo', 'segundos'),
        dias:    plural(dias,    'dia',     'dias'),
        meses:   plural(meses,   'mês',     'meses'),
        anos:    plural(anos,    'ano',     'anos')
    }

    let txthr = 'aproximadamente '
    let txtday = ''

    if (anos <= 0) {
        if (meses <= 0) {
            if (dias <= 0) {
                txthr += horas <= 0
                    ? (minutos < 1 ? DBtxt.segundos : DBtxt.minutos)
                    : DBtxt.horas
            } else {
                txtday = DBtxt.dias
            }
        } else {
            txtday = DBtxt.meses
            if (dias > 0) txtday += ` e ${DBtxt.dias}`
        }
    } else {
        txtday = DBtxt.anos
        if (meses > 0) txtday += ` e ${DBtxt.meses}`
        if (dias > 0)  txtday += `${meses > 0 ? ',' : ' e'} ${DBtxt.dias}`
    }

    let aniversario = 0
    const diaAtual = sendHours('DD')
    const mesAtual = sendHours('MM')
    const dmAtual  = sendHours('DD/MM')

    if ((dias > 0 || meses > 0) && diaAtual === t.dia) {
        aniversario++
        if (meses >= 11 && dmAtual === `${t.dia}/${t.mes}`) aniversario++
    }

    return {
        participants: data.dados.ids,
        niver: {
            month:       aniversario === 1 && anos <= 0,
            year:        aniversario === 2,
            affair:      aniversario !== 0 && data.dados.namoro.length > 0,
            affairData:  aniversario !== 0 && data.dados.namoro.length > 0
                ? `${data.dados.namoro[0].data.hora}:${data.dados.namoro[0].data.minuto}`
                : undefined,
            marriage:    aniversario !== 0 && data.dados.casamento.length > 0,
            marriageData:aniversario !== 0 && data.dados.casamento.length > 0
                ? `${data.dados.casamento[0].data.hora}:${data.dados.casamento[0].data.minuto}`
                : undefined
        },
        message: (userIsMarriage(user) ? 'Casados há ' : 'Namorando há ') +
            (anos <= 0 && meses <= 0 && dias <= 0 ? txthr : txtday),
        data: { anos, meses, dias, horas, minutos, segundos }
    }
}

//==================NAMORO==================\\

function addOrderAffair(sender, mencOs2, from) {
    delGeralOrder(sender)
    delGeralOrder(mencOs2)
    relationShip.push({
        ids: [sender, mencOs2],
        pedido: [sender, 1, from, sendHours('HH:mm'), sendHours('DD')],
        namoro: [dadosShip(false, true, false)],
        casamento: [],
        amantes: [],
        pedidosAmantes: []
    })
    saveRelationShip()
}

const existsOrderAffair = (user) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (data.dados.pedido.length < 2) return false
    if (data.dados.pedido[1] !== 1) return false
    if (data.dados.namoro.length <= 0) return false
    return data.dados.namoro[0].aguarde
}

const isUserOrderAffair = (user, order = false) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (data.dados.pedido.length < 2) return false
    if (data.dados.pedido[1] !== 1) return false
    if (order) return data.dados.pedido[0].includes(user)
    return data.dados.ids.some(id => !id.includes(data.dados.pedido[0]) && id.includes(user))
}

function acceptOrderAffair(sender) {
    let data = getGeralOrder(sender)
    if (!data.exists) return
    rmOrderGeral(sender)
    data.dados.namoro = [dadosShip(true)]
    saveRelationShip()
}

function breakupAffair(user) {
    let data = getGeralOrder(user)
    if (!data.exists || !userIsAffair(user)) return
    data.dados.namoro = []
    data.dados.casamento = []
    data.dados.amantes = []
    data.dados.pedidosAmantes = []
    rmOrderGeral(user)
    saveRelationShip()
}

//==================CASAMENTO==================\\

function addOrderMarriage(sender, from) {
    let data = getGeralOrder(sender)
    if (!data.exists || !userIsAffair(sender)) return
    rmOrderGeral(sender)
    data.dados.pedido = [sender, 2, from, sendHours('HH:mm'), sendHours('DD')]
    data.dados.casamento = [dadosShip(false, true, false)]
    saveRelationShip()
}

const existsOrderMarriage = (user) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (data.dados.pedido.length < 2) return false
    if (data.dados.pedido[1] !== 2) return false
    if (data.dados.casamento.length <= 0) return false
    return data.dados.casamento[0].aguarde
}

const isUserOrderMarriage = (user, order = false) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (data.dados.namoro.length <= 0 || !data.dados.namoro[0].ativo) return false
    if (data.dados.pedido.length < 2) return false
    if (data.dados.pedido[1] !== 2) return false
    if (order) return data.dados.pedido[0].includes(user)
    return data.dados.ids.some(id => !id.includes(data.dados.pedido[0]) && id.includes(user))
}

function saveOrderMarriage(sender, accept = true) {
    let data = getGeralOrder(sender)
    if (!data.exists) return
    rmOrderGeral(sender)
    data.dados.casamento = accept ? [dadosShip(true)] : []
    saveRelationShip()
}

function divorceMarriage(user) {
    let data = getGeralOrder(user)
    if (!data.exists || !userIsMarriage(user)) return
    data.dados.casamento = []
    data.dados.amantes = []
    data.dados.pedidosAmantes = []
    saveRelationShip()
}

//==================AMANTE==================\\

// Busca global: encontra o relacionamento que tem um pedido de amante para `lover`
const findPendingLoverRequest = (lover) => {
    return relationShip.find(rel =>
        rel.pedidosAmantes && rel.pedidosAmantes.some(p => p.lover === lover)
    ) || null
}

function addLover(sender, lover, from, pending = false) {
    let data = getGeralOrder(sender)
    if (!data.exists || (!userIsAffair(sender) && !userIsMarriage(sender))) return
    if (pending) {
        // Evita pedido duplicado
        const jaPendente = data.dados.pedidosAmantes.some(p => p.lover === lover)
        if (!jaPendente) {
            data.dados.pedidosAmantes.push({
                lover,
                from,
                time: sendHours('HH:mm'),
                date: sendHours('DD')
            })
            saveRelationShip()
        }
    } else {
        if (!data.dados.amantes.includes(lover)) {
            data.dados.amantes.push(lover)
            saveRelationShip()
        }
    }
}

function removeLover(user, lover) {
    let data = getGeralOrder(user)
    if (!data.exists) return
    data.dados.amantes = data.dados.amantes.filter(l => l !== lover)
    data.dados.pedidosAmantes = data.dados.pedidosAmantes.filter(p => p.lover !== lover)
    saveRelationShip()
}

function acceptLover(sender, lover) {
    // O pedido está no relacionamento de quem pediu — busca globalmente
    const rel = findPendingLoverRequest(lover)
    if (!rel) return
    rel.pedidosAmantes = rel.pedidosAmantes.filter(p => p.lover !== lover)
    if (!rel.amantes.includes(lover)) rel.amantes.push(lover)
    saveRelationShip()
}

function rejectLover(lover) {
    const rel = findPendingLoverRequest(lover)
    if (!rel) return
    rel.pedidosAmantes = rel.pedidosAmantes.filter(p => p.lover !== lover)
    saveRelationShip()
}

const userHasLover = (user, lover = null) => {
    let data = getGeralOrder(user)
    if (!data.exists) return false
    if (lover) return data.dados.amantes.includes(lover)
    return data.dados.amantes.length > 0
}

const getLovers = (user) => {
    let data = getGeralOrder(user)
    if (!data.exists) return []
    return data.dados.amantes
}

// Verifica se `lover` tem um pedido de amante pendente
const existsOrderLover = (lover) => {
    return findPendingLoverRequest(lover) !== null
}

// order = false → user é o lover sendo pedido | order = true → user é quem pediu
const isUserOrderLover = (user, order = false) => {
    if (!order) {
        return findPendingLoverRequest(user) !== null
    } else {
        let data = getGeralOrder(user)
        if (!data.exists) return false
        return data.dados.pedidosAmantes.length > 0
    }
}

//==================ANIVERSÁRIO==================\\

function aniversarioDeNamoroOuCasamento(zerotwo) {
    if (relationShip.length <= 0) return

    const diaAtual = Number(sendHours('DD'))
    const mesAtual = Number(sendHours('MM'))
    const horaAtual = Number(sendHours('HH'))

    for (let a of relationShip) {
        const [usu1, usu2] = a.ids
        const mencoes = [usu1, usu2]

        // Aniversário de namoro (sem casamento ativo)
        if (userIsAffair(usu1) && !userIsMarriage(usu1) && a.namoro.length > 0) {
            const t = a.namoro[0].data
            if (Number(t.dia) === diaAtual && Number(t.mes) === mesAtual && Number(t.hora) >= horaAtual - 1) {
                const anoNamoro = Number(sendHours('YYYY')) - Number(t.ano)
                const mesNamoro = (mesAtual - Number(t.mes)) + (anoNamoro > 0 ? anoNamoro * 12 : 0)
                let msg = ''
                if (anoNamoro <= 0 && mesNamoro > 0 && mesNamoro < 12) {
                    msg = `💖 Felicitações @${usu1.split('@')[0]} e @${usu2.split('@')[0]}, hoje vocês completam ${mesNamoro} ${mesNamoro !== 1 ? 'meses' : 'mês'} de namoro! 🥰`
                } else if (mesNamoro >= 12) {
                    msg = `💞 Parabéns @${usu1.split('@')[0]} e @${usu2.split('@')[0]}! Hoje vocês completam ${anoNamoro} ano${anoNamoro !== 1 ? 's' : ''} de namoro juntos! 🥰`
                }
                if (msg) zerotwo.sendMessage(usu1, { text: msg, mentions: mencoes })
            }
        }

        // Aniversário de casamento
        if (userIsMarriage(usu1) && a.casamento.length > 0) {
            const t = a.casamento[0].data
            if (Number(t.dia) === diaAtual && Number(t.mes) === mesAtual && Number(t.hora) >= horaAtual - 1) {
                const anoCasamento = Number(sendHours('YYYY')) - Number(t.ano)
                const mesCasamento = (mesAtual - Number(t.mes)) + (anoCasamento > 0 ? anoCasamento * 12 : 0)
                let msg = ''
                if (anoCasamento <= 0 && mesCasamento > 0 && mesCasamento < 12) {
                    msg = `💕 Felicitações @${usu1.split('@')[0]} e @${usu2.split('@')[0]}, hoje vocês completam ${mesCasamento} ${mesCasamento !== 1 ? 'meses' : 'mês'} de casamento! 😘`
                } else if (mesCasamento >= 12) {
                    msg = `💍 Parabéns @${usu1.split('@')[0]} e @${usu2.split('@')[0]}! Hoje vocês completam ${anoCasamento} ano${anoCasamento !== 1 ? 's' : ''} de casamento! 😍`
                }
                if (msg) zerotwo.sendMessage(usu1, { text: msg, mentions: mencoes })
            }
        }
    }
}

module.exports = {
    relationShip,
    saveRelationShip,
    getGeralOrder,
    dadosShip,
    delGeralOrder,
    rmOrderGeral,
    userIsAffair,
    userIsMarriage,
    getOutherCasal,
    getCasalTime,
    addOrderAffair,
    existsOrderAffair,
    isUserOrderAffair,
    acceptOrderAffair,
    breakupAffair,
    addOrderMarriage,
    existsOrderMarriage,
    isUserOrderMarriage,
    saveOrderMarriage,
    divorceMarriage,
    addLover,
    removeLover,
    acceptLover,
    rejectLover,
    userHasLover,
    getLovers,
    existsOrderLover,
    isUserOrderLover,
    findPendingLoverRequest,
    aniversarioDeNamoroOuCasamento
}
