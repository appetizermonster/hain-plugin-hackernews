'use strict';

const hackerNews = require('node-hacker-news')();
const CACHE_DURATION_SEC = 10 * 60; // 10 mins

module.exports = (pluginContext) => {
  const toast = pluginContext.toast;
  let _cachedNews = [];
  let _lastFetchTime = 0;

  function startup() {
    fetchNews(() => {});
  }

  function search(query, res) {
    res.add({
      id: '__temp',
      title: 'fetching...',
      desc: 'from Hackernews',
      icon: '#fa fa-circle-o-notch fa-spin'
    });
    fetchNews((items) => {
      if (items === null)
        return;
      res.remove('__temp');

      const results = items.map(_makeSearchResult);
      res.add(results);
    });
  }

  function _makeSearchResult(hnItem) {
    return {
      id: hnItem.id,
      title: hnItem.title,
      desc: `${hnItem.by} / ${hnItem.score} points <i>${hnItem.url}</i>`
    };
  }

  function execute(id, payload) {
    if (id === '__temp') {
      toast.enqueue('please wait a second');
      return;
    }
    const url = `https://news.ycombinator.com/item?id=${id}`;
    shell.openExternal(url);
  }

  function fetchNews(callback) {
    if (_cachedNews) {
      const diff = (Date.now() - _lastFetchTime) / 1000;
      if (diff <= CACHE_DURATION_SEC)
        return callback(_cachedNews);
    }

    hackerNews.getHottestItems(20, (err, items) => {
      if (err)
        return callback(null);
      _cachedNews = items;
      _lastFetchTime = Date.now();
      return callback(items);
    });
  }

  return { startup, search, execute };
};
