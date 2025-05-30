const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const router = express.Router();

// 支持的订阅源地址列表
const FEED_URLS = [
    'https://www.ximalaya.com/album/3558668.xml',
    'https://rss.lizhi.fm/rss/21628.xml',
    'https://data.getpodcast.xyz/data/ximalaya/246622.xml',
    'http://feed.tangsuanradio.com/gadio.xml',
    'https://www.ximalaya.com/album/5574153.xml',
    'https://bitvoice.banlan.show/feed/audio.xml',
    'https://keepcalm.banlan.show/feed/audio.xml',
];

// 结构化和分类 feed 数据
function normalizeFeed(feed, url) {
    // 兼容 RSS/Atom 格式
    let channel = feed.rss?.channel || feed.feed || {};
    let items = channel.item || channel.entries || channel.entry || [];
    if (!Array.isArray(items)) items = [items];

    // 基本信息
    const info = {
        url,
        title: channel.title || channel['itunes:title'] || '',
        description: channel.description || channel.subtitle || '',
        link: channel.link?.href || channel.link || '',
        image: channel['itunes:image']?.href || channel.image?.url || channel.image || '',
        author: channel['itunes:author'] || channel.author?.name || channel.author || '',
        language: channel.language || '',
        copyright: channel.copyright || '',
    };

    // 节目列表
    const episodes = items.map(item => ({
        title: item.title || '',
        description: item.description || item.summary || '',
        pubDate: item.pubDate || item.published || '',
        audioUrl: item.enclosure?.url || item['media:content']?.url || item.link?.href || '',
        duration: item['itunes:duration'] || '',
        image: item['itunes:image']?.href || '',
        guid: item.guid || '',
    }));

    return { info, episodes };
}

// 获取并解析单个 feed
async function fetchAndParseFeed(url) {
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const parser = new XMLParser({ ignoreAttributes: false });
        const data = parser.parse(response.data);
        return { url, ...normalizeFeed(data, url) };
    } catch (error) {
        return { url, error: error.message };
    }
}

// GET /api/feed?url=... 或 /api/feed/all
router.get('/', async (req, res) => {
    const { url, all } = req.query;
    if (all === '1') {
        // 批量获取所有 feed
        const results = await Promise.all(FEED_URLS.map(fetchAndParseFeed));
        res.json(results);
    } else if (url) {
        // 获取单个 feed
        const result = await fetchAndParseFeed(url);
        res.json(result);
    } else {
        res.status(400).json({ error: '请提供 url 参数或 all=1' });
    }
});

module.exports = router;