const fs = require('fs');
const platforms = JSON.parse(fs.readFileSync('./definition.js/horarios/plataformas.json'));

function generatePercentages() {
    const games = [];
    for (const platform of platforms) {
        games.push({
            name: platform,
            numbers: {
                min: Math.random() * (0.99 - 0.1) + 0.1,
                media: Math.random() * (5 - 1.5) + 1.5,
                max: Math.random() * (15 - 5) + 5,
                chance: Math.random() * (100 - 10) + 10
            }
        });
    }
    return games;
}

module.exports = generatePercentages;