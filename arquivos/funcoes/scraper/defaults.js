const axios = require('axios');
const cheerio = require('cheerio');
const linkfy = require('linkifyjs');
const fs = require('fs-extra')
const encodeUrl = require('encodeurl');
const removerAcentos = (s) => typeof s === 'string' ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
const useragent_1 = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};
const default_criador = '@nezsab-team.exe';
const unescapeHtml = (text) => typeof text === 'string' ? text
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'")
  .replace(/lt;/g, '<')
  .replace(/&#8216;/g, '\u2018')
  .replace(/&#8217;/g, '\u2019')
  .trim() : undefined;
const qs = require('qs');
const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

Array.prototype.shuffle = function() {
  var i = this.length,
    j, temp;
  if (i == 0) return this;
  while (--i) {
    j = Math.floor(Math.random() * (i + 1));
    temp = this[i];
    this[i] = this[j];
    this[j] = temp;
  }
  return this;
} // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

module.exports = {
  axios: axios,
  cheerio: cheerio,
  linkfy: linkfy,
  useragent_1: useragent_1,
  removerAcentos: removerAcentos,
  fs: fs,
  encodeUrl: encodeUrl,
  unescapeHtml: unescapeHtml,
  default_criador: default_criador,
  qs: qs,
  randomIntFromInterval: randomIntFromInterval
}
