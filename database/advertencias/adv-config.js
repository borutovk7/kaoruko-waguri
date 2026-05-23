const fs = require(`fs`)
const { saveJSON, colors, sendHours } = require(`../../definicoes.js`)

const advpath = `./database/advertencias/adv.json`

// Garante que o diretório e o arquivo existam
if (!fs.existsSync(`./database/advertencias`)) {
    fs.mkdirSync(`./database/advertencias`, { recursive: true })
}
if (!fs.existsSync(advpath)) {
    fs.writeFileSync(advpath, JSON.stringify([]))
}

const adv = JSON.parse(fs.readFileSync(advpath))

function saveAdv() {
    saveJSON(adv, advpath)
}

function addGroupInAdv(from, limite = 3, tempo = 30) {
    let AB = adv.map(i => i.groupId).indexOf(from)
    if (AB < 0) {
        adv.push({ groupId: from, limit: limite, max: tempo, list: [] })
        saveAdv()
    }
}

const getGroupInAdv = (from) => {
    let AB = adv.map(i => i.groupId).indexOf(from)
    return adv[AB]
}

function addAdv(from, usu, motivo = `não declarado`) {
    let data = getGroupInAdv(from)
    if (!data) {
        addGroupInAdv(from)
        data = getGroupInAdv(from)
    }
    let AB = data.list.map(i => i.id).indexOf(usu)
    let base = {
        principal: motivo,
        tempo: data.max,
        save: sendHours("DD")
    }
    if (AB < 0) {
        data.list.push({ id: usu, razao: [base] })
    } else {
        data.list[AB].razao.push(base)
    }
    saveAdv()
}

function rmAdv(from, usu, tipo = "last") {
    let data = getGroupInAdv(from)
    if (!data) return
    let AB = data.list.map(i => i.id).indexOf(usu)
    if (AB < 0) return

    if (tipo === "all") {
        data.list.splice(AB, 1)
    } else {
        // Remove a última advertência recebida
        if (data.list[AB].razao.length > 1) {
            data.list[AB].razao.pop()
        } else {
            data.list.splice(AB, 1)
        }
    }
    saveAdv()
}

function rmAllAdv(from) {
    let data = getGroupInAdv(from)
    if (data) {
        data.list = []
        saveAdv()
    }
}

const getUsuInAdv = (from, usu) => {
    let data = getGroupInAdv(from)
    if (!data) return null
    let AB = data.list.map(i => i.id).indexOf(usu)
    return AB >= 0 ? data.list[AB] : null
}

const getAdvQuantTotalUsu = (from, usu) => {
    let data = getUsuInAdv(from, usu)
    return data ? data.razao.length : 0
}

const isLimitAdvUsu = (from, usu) => {
    let data = getGroupInAdv(from)
    if (!data) return false
    let user = getUsuInAdv(from, usu)
    if (!user) return false
    return user.razao.length >= data.limit
}

function advFunc() {
    if (adv.length > 0) {
        let mudou = false
        for (let a of adv) {
            if (a.list.length > 0) {
                for (let bIndex = a.list.length - 1; bIndex >= 0; bIndex--) {
                    let b = a.list[bIndex]
                    for (let cIndex = b.razao.length - 1; cIndex >= 0; cIndex--) {
                        let c = b.razao[cIndex]
                        // Se o dia mudou, decrementa o tempo
                        if (Number(sendHours("DD")) !== Number(c.save)) {
                            c.tempo -= 1
                            c.save = sendHours("DD")
                            mudou = true
                            if (c.tempo <= 0) {
                                b.razao.splice(cIndex, 1)
                            }
                        }
                    }
                    if (b.razao.length === 0) {
                        a.list.splice(bIndex, 1)
                        mudou = true
                    }
                }
            }
        }
        if (mudou) saveAdv()
    }
}

module.exports = { 
    adv, 
    saveAdv, 
    addGroupInAdv, 
    getGroupInAdv, 
    addAdv, 
    rmAdv, 
    rmAllAdv, 
    getAdvQuantTotalUsu, 
    isLimitAdvUsu, 
    advFunc, 
    getUsuInAdv 
}
