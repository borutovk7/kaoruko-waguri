// credit: by Nazir
const fs   = require("fs");
const path = require("path");

async function tt(url) {
    const html = await fetch(url, {
        headers: {
            authority: "www.tiktok.com",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
        }
    }).then(r => r.text());

    const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    let json;
    try { json = JSON.parse(match[1]); } catch { return null; }

    const data = json?.__DEFAULT_SCOPE__?.["webapp.reflow.video.detail"]?.itemInfo?.itemStruct;
    if (!data) return null;

    const isVideo = !data.imagePost;

    let download;
    if (!isVideo) {
        download = (data.imagePost?.images || []).map(img => img.imageURL?.urlList?.[0]).filter(Boolean);
    } else {
        download = await fetch(`https://www.tiktok.com/player/api/v1/items?item_ids=${data.id}`)
            .then(r => r.json())
            .then(b => b.items?.[0]?.video_info?.url_list?.[0] || null)
            .catch(() => null);

        if (!download) {
            download =
                data.video?.bitrateInfo?.[0]?.PlayAddr?.UrlList?.[0] ||
                data.video?.playAddr ||
                data.video?.downloadAddr ||
                null;
        }
    }

    const stats       = data.stats       || {};
    const authorStats = data.authorStats || {};

    return {
        id:       data.id || data.aweme_id || null,
        like:     stats.diggCount     || 0,
        views:    stats.playCount     || 0,
        share:    stats.shareCount    || 0,
        comment:  stats.commentCount  || 0,
        isVideo,
        title:    data.desc || data.suggestedWords?.[0] || "",
        region:   data.locationCreated || null,
        duration: `${data.video?.duration || data.music?.duration || 0} second`,
        download,
        cover:        data.video?.cover        || null,
        originCover:  data.video?.originCover  || null,
        dynamicCover: data.video?.dynamicCover || null,
        author: {
            id:         data.author?.id          || "",
            avatar:     data.author?.avatarThumb || null,
            nickname:   data.author?.nickname    || "",
            username:   data.author?.uniqueId    || "",
            followers:  authorStats.followerCount  || 0,
            following:  authorStats.followingCount || 0,
            like:       authorStats.heartCount     || 0,
            verified:   data.author?.verified      || false,
            videoCount: authorStats.videoCount     || 0
        },
        music: {
            id:        data.music?.id         || null,
            title:     data.music?.title      || "",
            author:    data.music?.authorName || "",
            thumbnail: data.music?.coverLarge || data.music?.coverMedium || data.music?.coverThumb || null,
            duration:  data.music?.duration ? `${data.music.duration} second` : "",
            url:       data.music?.playUrl    || null
        }
    };
}

async function downloadVideo(videoUrl, outputPath = "video.mp4") {
    const res = await fetch(videoUrl, {
        headers: {
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
            "referer": "https://www.tiktok.com/"
        }
    });

    if (!res.ok) throw new Error(`Falha ao baixar: ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    return path.resolve(outputPath);
}

module.exports = { tt, downloadVideo };