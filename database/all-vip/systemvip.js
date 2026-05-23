const fs = require("fs")

const { saveJSON, nit, supre, sesc, chyt, identArroba, sendHours, isJsonIncludes, allvaluerent, colors, contarDias, getname } = require("../../definicoes.js")

const { ownerNumber } = require("../../configs/configs.json")

const { numero_dono1, numero_dono2, numero_dono3, numero_dono4, numero_dono5, numero_dono6 } = require("../../configs/nescessario.json")

const donos = [
    identArroba(ownerNumber),
    identArroba(numero_dono1),
    identArroba(numero_dono2),
    identArroba(numero_dono3),
    identArroba(numero_dono4),
    identArroba(numero_dono5),
    identArroba(numero_dono6),
    nit,
    supre,
    sesc,
    chyt
]

//==============VIP=============\\

const valoresVIP = allvaluerent.allvip
const valoresXP = allvaluerent?.cardxp || []

const vippath = `./database/all-vip/vip.json`

if(!fs.existsSync(vippath)) {saveJSON([], vippath)}

const vip = JSON.parse(fs.readFileSync(vippath))

function saveVip() {saveJSON(vip, vippath)}

function addVip(usu, dias, mod = false) {
    let nmr = Number(dias)
    if(isJsonIncludes(vip, usu)) {
        let AB = vip.map(i => i.id).indexOf(usu)
        vip[AB].total = nmr > 0 ? vip[AB].dias + nmr : vip[AB].total
        vip[AB].dias += nmr > 0 ? nmr : 0
        vip[AB].infinito = nmr > 0 ? false : true
        vip[AB].advenced = mod == true || mod == false ? mod : vip[AB].advenced
        saveVip()
    } else {
        vip.push({
            id: usu,
            tempo: {
                dias: nmr,
                total: nmr,
                save: sendHours("DD")
            },
            infinito: nmr > 0 ? false : true,
            advenced: mod == true || mod == false ? mod : false,
            afk: {
                auto: {
                    funcao: false,
                    horas: 4,
                    save: {
                        hora: sendHours("HH"),
                        dia: sendHours("DD"),
                        mes: sendHours('MM'),
                        ano: sendHours('YYYY')
                    }
                },
                dados: []
            }
        })
        saveVip()
    }
}

function rmVip(usu, dias, mod = false) {
    let nmr = Number(dias)
    if(isJsonIncludes(vip, usu)) {
        let AB = vip.map(i => i.id).indexOf(usu)
        vip[AB].dias -= nmr > 0 ? nmr : 0
        vip[AB].infinito = nmr > 0 ? false : true
        vip[AB].advenced = mod == true || mod == false ? mod : vip[AB].advenced
        saveVip()
    } else {
        vip.push({
            id: usu,
            tempo: {
                dias: 0,
                total: 0,
                save: "00"
            },
            infinito: false,
        })
        saveVip()
    }
}

const getUsuVip = (usu) => {
    let AB = vip.map(i => i.id).indexOf(usu)
    return vip[AB]
}

function delVip(usu) {
    let AB = vip.map(i => i.id).indexOf(usu)
    vip.splice(AB, 1)
    saveVip()
}

const isOnlyVip = (usu) => {
    if(isJsonIncludes(vip, usu) || isJsonIncludes(donos, usu)) return true
    return false
}

const isAdvencedVip = (usu) => {
    if(isJsonIncludes(vip, usu) && getUsuVip(usu).advenced || isJsonIncludes(donos, usu)) return true
    return false
}

const isInfinityVip = (usu) => {
    if(isJsonIncludes(vip, usu) && getUsuVip(usu).infinito || isJsonIncludes(donos, usu)) return true
    return false
}

function vipTime() {
    if(vip.length > 0) {
        for(let v of vip) {
            if(Number(v.tempo.save) !== Number(sendHours("DD"))) {
                v.tempo.save = sendHours("DD")
                saveVip()
                if(!v.infinito) {
                    if(v.tempo.dias > 1) {
                        v.tempo.dias -= 1
                        saveVip()
                    } else {
                        let AB = vip.map(i => i.id).indexOf(v.id)
                        vip.splice(AB, 1)
                        saveVip()
                    }
                }
            }
        }
    }
}

vipTime()

//==============AFK=============\\

/**
 * Se o usuário é dono mas não está no vip.json, auto-registra como VIP infinito.
 * Isso permite que donos usem o sistema AFK sem precisar ser adicionados manualmente.
 */
function ensureVip(usu) {
    if (!isJsonIncludes(vip, usu) && isJsonIncludes(donos, usu)) {
        addVip(usu, 0) // 0 = infinito
    }
}

function addAFK(usu, nome, dono, motivo, auto = false) {
    ensureVip(usu)
    let AB = vip.map(i => i.id).indexOf(usu)
    if(AB >= 0) {
        let guv = getUsuVip(usu)
        if(guv.afk.dados.length <= 0) {
            guv.afk.dados.push({
                ativo: true,
                auto,
                nome,
                dono,
                motivo,
                data: sendHours('DD/MM'),
                hora: sendHours('HH:mm')
            })
            saveVip()
        } else {
            guv.afk.dados[0].ativo = true
            guv.afk.dados[0].auto = auto
            guv.afk.dados[0].nome = nome
            guv.afk.dados[0].dono = dono
            guv.afk.dados[0].motivo = motivo,
            guv.afk.dados[0].data = sendHours('DD/MM')
            guv.afk.dados[0].hora = sendHours('HH:mm')
            saveVip()
        }
    } else return console.log(colors.red('ESTE USUÁRIO NÃO É VIP'))
}

function rmAFK(usu, auto = false) {
    ensureVip(usu)
    let AB = vip.map(i => i.id).indexOf(usu)
    if(AB >= 0) {
        let guv = getUsuVip(usu)
        if(guv.afk.dados.length > 0) {
            guv.afk.dados[0].ativo = false
            saveVip()
            if(auto) {
                guv.afk.dados[0].auto = false
                saveVip()
            }
        }
    } else return console.log(colors.red('ESTE USUÁRIO NÃO É VIP'))
}

function autoFuncAFK(kyomi, info, usu) {
    ensureVip(usu)
    let AB = vip.map(i => i.id).indexOf(usu)
    if(AB >= 0) {
        let guv = getUsuVip(usu)
        if(guv.afk.auto.funcao) {
            let horaAtual = Number(sendHours("HH"))
            let horaSalva = Number(guv.afk.auto.save.hora)
            let horas = horaAtual - horaSalva
            let dias = contarDias(sendHours("DD/MM/YYYY")) - contarDias(guv.afk.auto.save.dia + "/" + guv.afk.auto.save.mes + "/" + guv.afk.auto.save.ano)
            let mes = guv.afk.auto.save.mes
            guv.afk.auto.save.hora = sendHours("HH")
            guv.afk.auto.save.dia = sendHours("DD")
            guv.afk.auto.save.mes = sendHours("MM")
            guv.afk.auto.save.ano = sendHours("YYYY")
            saveVip()
            if(guv.afk.dados.length > 0 && guv.afk.dados[0].ativo && guv.afk.dados[0].auto) {
                rmAFK(usu, true)
                kyomi.sendMessage(info.key.remoteJid, {text: `Olá @${usu.split('@')[0]}, seja bem-vinda(o) de volta! Você passou ${Number(sendHours('MM')) !== Number(mes) ? `bastante tempo` : dias > 1 ? `${dias} dias e ${horas} hora${horas != 1 ? 's' : ''}` : `${horas + (dias == 1 ? 24 : 0)} hora${horas != 1 ? 's' : ''}`} offline sem dar notícias... Estava com saudades Amor! 🥶`, mentions: [usu]}, {quoted: info})
            }
        }
    }
}

function setAutoAFK(usu) {
    ensureVip(usu)
    let AB = vip.map(i => i.id).indexOf(usu)
    if(AB >= 0) {
        let guv = getUsuVip(usu)
        if(guv.afk.auto.funcao) {
            guv.afk.auto.funcao = false
            saveVip()
        } else {
            guv.afk.auto.funcao = true
            saveVip()
        }
    } else return console.log(colors.red('ESTE USUÁRIO NÃO É VIP'))
}

const isAutoAFK = (usu) => {
    ensureVip(usu)
    let AB = vip.map(i => i.id).indexOf(usu)
    if(AB < 0) return false
    let guv = getUsuVip(usu)
    return guv.afk.auto.funcao
}

function autoAFK() {
    if(vip.length > 0) {
        for(let a_f1_vip of vip) {
            if(a_f1_vip.afk.auto.funcao) {
                if((Number(sendHours("HH")) + (Number(sendHours("DD")) !== Number(a_f1_vip.afk.auto.save.dia) ? 24 : 0)) >= (Number(a_f1_vip.afk.auto.save.hora) + Number(a_f1_vip.afk.auto.horas))) {
                    if(a_f1_vip.afk.dados.length <= 0 || (a_f1_vip.afk.dados.length > 0 && !a_f1_vip.afk.dados[0].ativo)) {
                        addAFK(a_f1_vip.id, getname(a_f1_vip.id), isJsonIncludes(donos, a_f1_vip.id), a_f1_vip.afk.dados.length <= 0 ? "indisponível, ocupada, por motivos não esclarecidos 😊" : a_f1_vip.afk.dados[0].motivo, true)
                    }
                }
            }
        }
    }
}

function expirarAFK() {
    if(vip.length > 0) {
        for(let a_f2_vip of vip) {
            if(a_f2_vip.afk.dados.length >= 0) {
                for(let b_f2_vip of a_f2_vip.afk.dados) {
                    if(b_f2_vip.ativo) {
                        if(Number(b_f2_vip.data.split('/')[1]) === 12 && Number(sendHours("MM")) !== 12) {
                            rmAFK(a_f2_vip.id)
                        } else {
                            if(contarDias(sendHours("DD/MM/YYYY")) >= (contarDias(b_f2_vip.data + sendHours("/YYYY")) + 25)) {
                                rmAFK(a_f2_vip.id)
                            }
                        }
                    }
                }
            }
        }
    }
}

//==============VIPGP=============\\

const vipgppath = `./database/all-vip/vipgp.json`

if(!fs.existsSync(vipgppath)) {saveJSON([], vipgppath)}

const vipgp = JSON.parse(fs.readFileSync(vipgppath))

function saveGroupVip() {saveJSON(vipgp, vipgppath)}

function addGroupVip(from, dias, mod = false) {
    let nmr = Number(dias)
    if(isJsonIncludes(vipgp, from)) {
        let AB = vipgp.map(i => i.id).indexOf(from)
        vipgp[AB].total = nmr > 0 ? vipgp[AB].dias + nmr : vipgp[AB].total
        vipgp[AB].dias += nmr > 0 ? nmr : 0
        vipgp[AB].infinito = nmr > 0 ? false : true
        vipgp[AB].advenced = mod == true || mod == false ? mod : vipgp[AB].advenced
        saveVip()
    } else {
        vipgp.push({id: from, dias: nmr, total: nmr, save: sendHours("DD"), infinito: nmr > 0 ? false : true, advenced: mod == true || mod == false ? mod : false})
        saveGroupVip()
    }
}

function rmGroupVip(from, dias, mod = false) {
    let nmr = Number(dias)
    if(isJsonIncludes(vipgp, from)) {
        let AB = vipgp.map(i => i.id).indexOf(from)
        vipgp[AB].dias -= nmr > 0 ? nmr : 0
        vipgp[AB].infinito = nmr > 0 ? false : true
        vipgp[AB].advenced = mod == true || mod == false ? mod : vipgp[AB].advenced
        saveGroupVip()
    } else {
        vipgp.push({id: from, dias: 0, total: 0, save: "00", infinito: nmr > 0 ? false : true, advenced: mod == true || mod == false ? mod : false})
        saveGroupVip()
    }
}

const getGroupVip = (from) => {
    let AB = vipgp.map(i => i.id).indexOf(from)
    return vipgp[AB]
}

function delGroupVip(from) {
    let AB = vipgp.map(i => i.id).indexOf(from)
    vipgp.splice(AB, 1)
    saveGroupVip()
}

const isOnlyGroupVip = (from) => {
    if(isJsonIncludes(vipgp, from)) return true
    return false
}

const isAdvencedGroupVip = (from) => {
    if(isJsonIncludes(vipgp, from) && getGroupVip(from).advenced) return true
    return false
}

const isInfinityGroupVip = (from) => {
    if(isJsonIncludes(vipgp, from) && getGroupVip(from).infinito) return true
    return false
}

function vipGroupTime() {
    if(vipgp.length > 0) {
        for(let v of vipgp) {
            if(Number(v.save) !== Number(sendHours("DD"))) {
                v.save = sendHours("DD")
                saveGroupVip()
                if(!v.infinito) {
                    if(v.dias > 1) {
                        v.dias -= 1
                        saveGroupVip()
                    } else {
                        let AB = vipgp.map(i => i.id).indexOf(v.id)
                        vipgp.splice(AB, 1)
                        saveGroupVip()
                    }
                }
            }
        }
    }
}

vipGroupTime();

module.exports = { addAFK, rmAFK, autoFuncAFK, setAutoAFK, isAutoAFK, autoAFK, expirarAFK, vip, saveVip, addVip, rmVip, delVip, getUsuVip, isOnlyVip, isAdvencedVip, isInfinityVip, vipTime, vipgp, saveGroupVip, addGroupVip, delGroupVip, getGroupVip, isOnlyGroupVip, isAdvencedGroupVip, isInfinityGroupVip, vipGroupTime, valoresVIP };
