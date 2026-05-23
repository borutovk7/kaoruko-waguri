const ffmpeg = require('fluent-ffmpeg')
const which = require('which')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { randomBytes } = require('crypto')

const resolveFfmpeg = () => {
    try {
        return which.sync('ffmpeg')
    } catch {
        try {
     return require('@ffmpeg-installer/ffmpeg').path
        } catch {
     throw new Error('ffmpeg não encontrado. Instale via "pkg install ffmpeg" (Termux) ou "npm i @ffmpeg-installer/ffmpeg"')
        }
    }
}

ffmpeg.setFfmpegPath(resolveFfmpeg())

const tmpFile = (ext) => path.join(os.tmpdir(), `${randomBytes(6).toString('hex')}.${ext}`)

async function webp_mp4_02(input) {
    let inputPath = input
    let tempInput = null

    if (Buffer.isBuffer(input)) {
        tempInput = tmpFile('webp')
        fs.writeFileSync(tempInput, input)
        inputPath = tempInput
    }

    const outputPath = tmpFile('mp4')

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
     .outputOptions([
         '-movflags faststart',
         '-pix_fmt yuv420p',
         '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
     ])
     .toFormat('mp4')
     .save(outputPath)
     .on('end', resolve)
     .on('error', reject)
    })

    if (tempInput) fs.unlinkSync(tempInput)

    const buffer = fs.readFileSync(outputPath)
    fs.unlinkSync(outputPath)

    return buffer
}

module.exports = webp_mp4_02


/*
# Termux
pkg install ffmpeg
npm install which

# Outros ambientes (Docker, VPS, etc.)
npm install which @ffmpeg-installer/ffmpeg
*/