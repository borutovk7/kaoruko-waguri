#!/usr/bin/env node
// ╔══════════════════════════════════════════════════╗
// ║           🎌  ANIME SCRAPER CLI  🎌             ║
// ║  Busca · Detalhes · Episódios · Download        ║
// ╚══════════════════════════════════════════════════╝

import axios from "axios";
import * as cheerio from "cheerio";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import Table from "cli-table3";
import open from "open";
import fs from "fs";
import path from "path";
import https from "https";

// ─── Config ──────────────────────────────────────────────────────────────────

const JIKAN = "https://api.jikan.moe/v4";
const NYAA  = "https://nyaa.si";
const DOWNLOAD_DIR = "./downloads";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const spinner = ora({ color: "cyan" });

// ─── Utilitários ─────────────────────────────────────────────────────────────

function header(txt) {
  const line = "─".repeat(54);
  console.log("\n" + chalk.cyan(line));
  console.log(chalk.bold.cyan("  " + txt));
  console.log(chalk.cyan(line));
}

function badge(label, value, color = "white") {
  return chalk.dim(label + ": ") + chalk[color](value ?? "N/A");
}

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ─── 1. BUSCAR ANIME ─────────────────────────────────────────────────────────

async function buscarAnime() {
  const { query } = await inquirer.prompt([
    { type: "input", name: "query", message: "🔍 Nome do anime:" },
  ]);

  spinner.start("Buscando...");
  await delay(400);

  try {
    const { data } = await axios.get(`${JIKAN}/anime`, {
      params: { q: query, limit: 10, sfw: false },
    });

    spinner.stop();
    const lista = data.data;

    if (!lista.length) {
      console.log(chalk.yellow("\n⚠  Nenhum resultado encontrado."));
      return;
    }

    header(`Resultados para: "${query}"`);

    const tabela = new Table({
      head: [
        chalk.cyan("#"),
        chalk.cyan("Título"),
        chalk.cyan("Ep"),
        chalk.cyan("⭐"),
        chalk.cyan("Status"),
        chalk.cyan("ID"),
      ],
      colWidths: [4, 36, 6, 7, 16, 8],
      style: { head: [], border: ["dim"] },
    });

    lista.forEach((a, i) => {
      tabela.push([
        i + 1,
        a.title.substring(0, 34),
        a.episodes ?? "?",
        a.score ?? "-",
        a.status?.replace(" of airing", "") ?? "-",
        a.mal_id,
      ]);
    });

    console.log(tabela.toString());

    const { escolha } = await inquirer.prompt([
      {
        type: "list",
        name: "escolha",
        message: "Selecione um anime:",
        choices: [
          ...lista.map((a, i) => ({ name: `${i + 1}. ${a.title}`, value: a.mal_id })),
          new inquirer.Separator(),
          { name: "↩  Voltar", value: null },
        ],
      },
    ]);

    if (escolha) await menuAnime(escolha);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro na busca: " + err.message));
  }
}

// ─── 2. MENU DO ANIME ─────────────────────────────────────────────────────────

async function menuAnime(id) {
  const { acao } = await inquirer.prompt([
    {
      type: "list",
      name: "acao",
      message: "O que deseja fazer?",
      choices: [
        { name: "📋  Ver detalhes", value: "detalhes" },
        { name: "📺  Listar episódios", value: "episodios" },
        { name: "🧲  Buscar torrents para baixar", value: "torrent" },
        { name: "🌐  Abrir no MyAnimeList", value: "mal" },
        new inquirer.Separator(),
        { name: "↩  Voltar", value: null },
      ],
    },
  ]);

  if (acao === "detalhes")  await detalhesAnime(id);
  if (acao === "episodios") await listarEpisodios(id);
  if (acao === "torrent")   await buscarTorrents(id);
  if (acao === "mal")       await open(`https://myanimelist.net/anime/${id}`);
}

// ─── 3. DETALHES ─────────────────────────────────────────────────────────────

async function detalhesAnime(id) {
  spinner.start("Carregando detalhes...");

  try {
    const { data } = await axios.get(`${JIKAN}/anime/${id}/full`);
    spinner.stop();

    const a = data.data;
    header(`📋 ${a.title}`);

    console.log([
      badge("  Título JP   ", a.title_japanese, "yellow"),
      badge("  Episódios   ", a.episodes),
      badge("  Duração     ", a.duration),
      badge("  Status      ", a.status, "green"),
      badge("  Nota        ", a.score ? `${a.score} (${a.scored_by?.toLocaleString()} votos)` : "N/A", "yellow"),
      badge("  Ranking     ", a.rank ? `#${a.rank}` : "N/A", "cyan"),
      badge("  Popularidade", a.popularity ? `#${a.popularity}` : "N/A"),
      badge("  Estúdio     ", a.studios?.map((s) => s.name).join(", ") || "N/A"),
      badge("  Gêneros     ", a.genres?.map((g) => g.name).join(", ") || "N/A", "magenta"),
      badge("  Temporada   ", a.season && a.year ? `${a.season} ${a.year}` : "N/A"),
      badge("  Source      ", a.source),
    ].join("\n"));

    if (a.synopsis) {
      console.log("\n" + chalk.dim("  Sinopse:\n") + chalk.white("  " + a.synopsis.replace(/\n/g, "\n  ").substring(0, 500) + "..."));
    }

    console.log("\n" + badge("  🔗 MAL", a.url, "blue"));
    console.log();

    await menuAnime(id);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro: " + err.message));
  }
}

// ─── 4. LISTAR EPISÓDIOS ─────────────────────────────────────────────────────

async function listarEpisodios(id, pagina = 1) {
  spinner.start(`Carregando episódios (pág. ${pagina})...`);

  try {
    const { data } = await axios.get(`${JIKAN}/anime/${id}/episodes`, {
      params: { page: pagina },
    });

    spinner.stop();

    const eps = data.data;
    const pag = data.pagination;

    if (!eps.length) {
      console.log(chalk.yellow("\n⚠  Nenhum episódio disponível ainda."));
      return menuAnime(id);
    }

    header(`📺 Episódios — Página ${pagina} de ${pag.last_visible_page}`);

    const tabela = new Table({
      head: [chalk.cyan("Ep"), chalk.cyan("Título"), chalk.cyan("Duração"), chalk.cyan("Data")],
      colWidths: [6, 40, 12, 14],
      style: { border: ["dim"] },
    });

    eps.forEach((ep) => {
      tabela.push([
        ep.mal_id,
        (ep.title || ep.title_romanji || "—").substring(0, 38),
        ep.duration ?? "—",
        ep.aired ? ep.aired.substring(0, 10) : "—",
      ]);
    });

    console.log(tabela.toString());

    const opcoes = [];
    if (pag.has_next_page) opcoes.push({ name: "▶  Próxima página", value: "next" });
    if (pagina > 1)         opcoes.push({ name: "◀  Página anterior", value: "prev" });
    opcoes.push(new inquirer.Separator());
    opcoes.push({ name: "↩  Voltar ao menu do anime", value: "back" });

    const { nav } = await inquirer.prompt([{ type: "list", name: "nav", message: "Navegação:", choices: opcoes }]);

    if (nav === "next") return listarEpisodios(id, pagina + 1);
    if (nav === "prev") return listarEpisodios(id, pagina - 1);
    return menuAnime(id);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro: " + err.message));
  }
}

// ─── 5. BUSCAR TORRENTS (nyaa.si) ─────────────────────────────────────────────

async function buscarTorrents(animeId) {
  // Pega o nome do anime primeiro
  spinner.start("Obtendo título do anime...");
  let titulo = "";
  try {
    const { data } = await axios.get(`${JIKAN}/anime/${animeId}`);
    titulo = data.data.title_english || data.data.title;
    spinner.stop();
  } catch {
    spinner.stop();
  }

  const { query } = await inquirer.prompt([
    {
      type: "input",
      name: "query",
      message: "🧲 Buscar torrents (edite se quiser):",
      default: titulo,
    },
  ]);

  const { categoria } = await inquirer.prompt([
    {
      type: "list",
      name: "categoria",
      message: "Categoria:",
      choices: [
        { name: "🎌 Anime (legendado/dublado)", value: "1_2" },
        { name: "🎌 Anime (raw)",               value: "1_4" },
        { name: "📦 Todos os animes",            value: "1_0" },
      ],
    },
  ]);

  const { qualidade } = await inquirer.prompt([
    {
      type: "list",
      name: "qualidade",
      message: "Filtrar por qualidade?",
      choices: [
        { name: "Todos", value: "" },
        { name: "1080p", value: "1080" },
        { name: "720p",  value: "720" },
        { name: "480p",  value: "480" },
      ],
    },
  ]);

  const buscaFinal = qualidade ? `${query} ${qualidade}p` : query;

  spinner.start(`Buscando torrents: "${buscaFinal}"...`);

  try {
    const url = `${NYAA}/?f=0&c=${categoria}&q=${encodeURIComponent(buscaFinal)}&s=seeders&o=desc`;
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AnimeScraperCLI/1.0)" },
    });

    spinner.stop();

    const $ = cheerio.load(html);
    const torrents = [];

    $("table.torrent-list tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      const titleEl = $(cols[1]).find("a:not(.comments)").last();
      const title   = titleEl.text().trim();
      const link    = titleEl.attr("href") || "";
      const nyaaId  = link.match(/\/(\d+)\//)?.[1];
      const magnet  = $(cols[2]).find('a[href^="magnet"]').attr("href") || "";
      const torrentFile = $(cols[2]).find('a[href$=".torrent"]').attr("href") || "";
      const size    = $(cols[3]).text().trim();
      const date    = $(cols[4]).text().trim();
      const seeders = parseInt($(cols[5]).text().trim()) || 0;
      const leechers= parseInt($(cols[6]).text().trim()) || 0;
      const downloads = $(cols[7]).text().trim();
      const catIcon = $(cols[0]).find("a").attr("href") || "";

      if (title) {
        torrents.push({ nyaaId, title, link, magnet, torrentFile, size, date, seeders, leechers, downloads });
      }
    });

    if (!torrents.length) {
      console.log(chalk.yellow("\n⚠  Nenhum torrent encontrado."));
      return menuAnime(animeId);
    }

    header(`🧲 Torrents — "${buscaFinal}" (${torrents.length} resultados)`);

    const tabela = new Table({
      head: [chalk.cyan("#"), chalk.cyan("Título"), chalk.cyan("Tam"), chalk.cyan("↑Seeds"), chalk.cyan("↓Leech"), chalk.cyan("Data")],
      colWidths: [4, 46, 10, 8, 8, 12],
      style: { border: ["dim"] },
    });

    torrents.slice(0, 20).forEach((t, i) => {
      const seedColor = t.seeders > 50 ? "green" : t.seeders > 10 ? "yellow" : "red";
      tabela.push([
        i + 1,
        t.title.substring(0, 44),
        t.size,
        chalk[seedColor](t.seeders),
        t.leechers,
        t.date.substring(0, 10),
      ]);
    });

    console.log(tabela.toString());

    const { escolha } = await inquirer.prompt([
      {
        type: "list",
        name: "escolha",
        message: "Selecione um torrent:",
        choices: [
          ...torrents.slice(0, 20).map((t, i) => ({
            name: `${i + 1}. ${t.title.substring(0, 55)} [${t.size}] 🌱${t.seeders}`,
            value: i,
          })),
          new inquirer.Separator(),
          { name: "↩  Voltar", value: null },
        ],
        pageSize: 15,
      },
    ]);

    if (escolha !== null) await menuDownload(torrents[escolha]);
    else await menuAnime(animeId);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro ao buscar torrents: " + err.message));
  }
}

// ─── 6. MENU DOWNLOAD ────────────────────────────────────────────────────────

async function menuDownload(torrent) {
  header(`⬇  Download: ${torrent.title.substring(0, 50)}`);
  console.log(badge("  Tamanho  ", torrent.size));
  console.log(badge("  Seeders  ", torrent.seeders, "green"));
  console.log(badge("  Leechers ", torrent.leechers));
  console.log(badge("  Data     ", torrent.date));
  console.log();

  const opcoes = [];
  if (torrent.magnet)      opcoes.push({ name: "🧲  Abrir magnet link (abre seu cliente torrent)", value: "magnet" });
  if (torrent.torrentFile) opcoes.push({ name: "💾  Baixar arquivo .torrent",                      value: "file" });
  if (torrent.nyaaId)      opcoes.push({ name: "🌐  Abrir página no nyaa.si",                      value: "page" });
  opcoes.push(new inquirer.Separator());
  opcoes.push({ name: "📋  Copiar magnet para terminal", value: "copy" });
  opcoes.push({ name: "↩  Voltar", value: null });

  const { acao } = await inquirer.prompt([{ type: "list", name: "acao", message: "Ação:", choices: opcoes }]);

  if (acao === "magnet") {
    console.log(chalk.green("\n✓ Abrindo cliente torrent..."));
    await open(torrent.magnet);
  }

  if (acao === "file") {
    await baixarArquivoTorrent(torrent);
  }

  if (acao === "page") {
    await open(`${NYAA}${torrent.link}`);
  }

  if (acao === "copy") {
    console.log("\n" + chalk.dim("Magnet link:"));
    console.log(chalk.cyan(torrent.magnet));
    console.log(chalk.green("\n✓ Copie o link acima e cole no seu cliente torrent."));
  }
}

// ─── 7. BAIXAR .TORRENT ──────────────────────────────────────────────────────

async function baixarArquivoTorrent(torrent) {
  ensureDownloadDir();
  const fileName = torrent.title.replace(/[/\\?%*:|"<>]/g, "-").substring(0, 80) + ".torrent";
  const filePath = path.join(DOWNLOAD_DIR, fileName);
  const fileUrl  = torrent.torrentFile.startsWith("http")
    ? torrent.torrentFile
    : `${NYAA}${torrent.torrentFile}`;

  spinner.start(`Baixando ${fileName}...`);

  try {
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    fs.writeFileSync(filePath, Buffer.from(response.data));
    spinner.succeed(chalk.green(`✓ Salvo em: ${chalk.bold(filePath)}`));

    const { abrir } = await inquirer.prompt([
      { type: "confirm", name: "abrir", message: "Abrir arquivo .torrent agora?", default: true },
    ]);

    if (abrir) await open(path.resolve(filePath));
  } catch (err) {
    spinner.fail(chalk.red("Erro ao baixar: " + err.message));
  }
}

// ─── 8. BUSCA DIRETA DE TORRENTS ─────────────────────────────────────────────

async function buscaDiretaTorrents() {
  const { query } = await inquirer.prompt([
    { type: "input", name: "query", message: "🧲 Buscar torrents (qualquer anime):" },
  ]);

  await buscarTorrentsQuery(query);
}

async function buscarTorrentsQuery(query) {
  spinner.start(`Buscando: "${query}"...`);

  try {
    const url = `${NYAA}/?f=0&c=1_2&q=${encodeURIComponent(query)}&s=seeders&o=desc`;
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    spinner.stop();

    const $ = cheerio.load(html);
    const torrents = [];

    $("table.torrent-list tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      const titleEl = $(cols[1]).find("a:not(.comments)").last();
      const title   = titleEl.text().trim();
      const link    = titleEl.attr("href") || "";
      const nyaaId  = link.match(/\/(\d+)\//)?.[1];
      const magnet  = $(cols[2]).find('a[href^="magnet"]').attr("href") || "";
      const torrentFile = $(cols[2]).find('a[href$=".torrent"]').attr("href") || "";
      const size    = $(cols[3]).text().trim();
      const date    = $(cols[4]).text().trim();
      const seeders = parseInt($(cols[5]).text().trim()) || 0;
      const leechers= parseInt($(cols[6]).text().trim()) || 0;

      if (title) torrents.push({ nyaaId, title, link, magnet, torrentFile, size, date, seeders, leechers });
    });

    if (!torrents.length) {
      console.log(chalk.yellow("\n⚠  Nenhum torrent encontrado."));
      return;
    }

    header(`🧲 ${torrents.length} torrents encontrados`);

    const tabela = new Table({
      head: [chalk.cyan("#"), chalk.cyan("Título"), chalk.cyan("Tam"), chalk.cyan("Seeds")],
      colWidths: [4, 52, 10, 8],
      style: { border: ["dim"] },
    });

    torrents.slice(0, 20).forEach((t, i) => {
      const sc = t.seeders > 50 ? "green" : t.seeders > 10 ? "yellow" : "red";
      tabela.push([i + 1, t.title.substring(0, 50), t.size, chalk[sc](t.seeders)]);
    });

    console.log(tabela.toString());

    const { escolha } = await inquirer.prompt([
      {
        type: "list",
        name: "escolha",
        message: "Selecione:",
        choices: [
          ...torrents.slice(0, 20).map((t, i) => ({
            name: `${i + 1}. ${t.title.substring(0, 55)} [${t.size}]`,
            value: i,
          })),
          new inquirer.Separator(),
          { name: "↩  Voltar", value: null },
        ],
        pageSize: 15,
      },
    ]);

    if (escolha !== null) await menuDownload(torrents[escolha]);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro: " + err.message));
  }
}

// ─── 9. TOP ANIMES ───────────────────────────────────────────────────────────

async function topAnimes() {
  const { tipo } = await inquirer.prompt([
    {
      type: "list",
      name: "tipo",
      message: "Tipo:",
      choices: [
        { name: "📺 TV",    value: "tv" },
        { name: "🎬 Filme", value: "movie" },
        { name: "📼 OVA",   value: "ova" },
        { name: "📱 ONA",   value: "ona" },
      ],
    },
  ]);

  spinner.start("Carregando top animes...");

  try {
    const { data } = await axios.get(`${JIKAN}/top/anime`, {
      params: { type: tipo, limit: 25 },
    });

    spinner.stop();

    header(`🏆 Top 25 Animes — ${tipo.toUpperCase()}`);

    const tabela = new Table({
      head: [chalk.cyan("Rank"), chalk.cyan("Título"), chalk.cyan("⭐"), chalk.cyan("Ep"), chalk.cyan("Ano")],
      colWidths: [6, 42, 7, 6, 7],
      style: { border: ["dim"] },
    });

    data.data.forEach((a) => {
      tabela.push([
        `#${a.rank}`,
        a.title.substring(0, 40),
        chalk.yellow(a.score ?? "-"),
        a.episodes ?? "?",
        a.year ?? "-",
      ]);
    });

    console.log(tabela.toString());

    const { escolha } = await inquirer.prompt([
      {
        type: "list",
        name: "escolha",
        message: "Selecione para ver detalhes/baixar:",
        choices: [
          ...data.data.map((a) => ({
            name: `#${a.rank} ${a.title.substring(0, 45)} ⭐${a.score}`,
            value: a.mal_id,
          })),
          new inquirer.Separator(),
          { name: "↩  Voltar", value: null },
        ],
        pageSize: 15,
      },
    ]);

    if (escolha) await menuAnime(escolha);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro: " + err.message));
  }
}

// ─── 10. TEMPORADA ATUAL ─────────────────────────────────────────────────────

async function temporadaAtual() {
  spinner.start("Carregando temporada atual...");

  try {
    const { data } = await axios.get(`${JIKAN}/seasons/now`, { params: { limit: 25 } });
    spinner.stop();

    header("📅 Animes da Temporada Atual");

    const sorted = data.data.sort((a, b) => (b.score || 0) - (a.score || 0));

    const tabela = new Table({
      head: [chalk.cyan("#"), chalk.cyan("Título"), chalk.cyan("⭐"), chalk.cyan("Ep"), chalk.cyan("Dia")],
      colWidths: [4, 42, 7, 6, 12],
      style: { border: ["dim"] },
    });

    sorted.slice(0, 20).forEach((a, i) => {
      const dia = a.broadcast?.day || "-";
      tabela.push([i + 1, a.title.substring(0, 40), chalk.yellow(a.score ?? "?"), a.episodes ?? "?", dia]);
    });

    console.log(tabela.toString());

    const { escolha } = await inquirer.prompt([
      {
        type: "list",
        name: "escolha",
        message: "Selecione:",
        choices: [
          ...sorted.slice(0, 20).map((a, i) => ({
            name: `${i + 1}. ${a.title.substring(0, 50)}`,
            value: a.mal_id,
          })),
          new inquirer.Separator(),
          { name: "↩  Voltar", value: null },
        ],
        pageSize: 15,
      },
    ]);

    if (escolha) await menuAnime(escolha);
  } catch (err) {
    spinner.stop();
    console.error(chalk.red("Erro: " + err.message));
  }
}

// ─── MENU PRINCIPAL ───────────────────────────────────────────────────────────

async function main() {
  console.clear();
  console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════════════╗
  ║       🎌  A N I M E   S C R A P E R  🎌         ║
  ║     Busca · Detalhes · Episódios · Download      ║
  ╚══════════════════════════════════════════════════╝`));

  while (true) {
    console.log();
    const { opcao } = await inquirer.prompt([
      {
        type: "list",
        name: "opcao",
        message: chalk.bold("Menu principal:"),
        choices: [
          { name: "🔍  Buscar anime por nome",          value: "buscar" },
          { name: "🏆  Top 25 animes",                  value: "top" },
          { name: "📅  Temporada atual",                 value: "temporada" },
          { name: "🧲  Busca direta de torrents",        value: "torrents" },
          new inquirer.Separator(),
          { name: "❌  Sair",                            value: "sair" },
        ],
      },
    ]);

    if (opcao === "buscar")    await buscarAnime();
    if (opcao === "top")       await topAnimes();
    if (opcao === "temporada") await temporadaAtual();
    if (opcao === "torrents")  await buscaDiretaTorrents();
    if (opcao === "sair") {
      console.log(chalk.cyan("\nAté mais! 👋\n"));
      process.exit(0);
    }
  }
}

main().catch(console.error);
