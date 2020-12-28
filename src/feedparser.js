const FeedParser = require('feedparser');
const fetch = require('node-fetch'); // for fetching the feed
const fs = require('fs-extra');
const path = require('path');

const feeds = [
  'https://stirwhiskandroll.com/feed/',
  'https://stirwhiskandroll.com/recipe/feed/',
];

const main = (feedUrl) => {
  const req = fetch(feedUrl);
  const feedparser = new FeedParser();

  req.then(
    (res) => {
      if (res.status !== 200) {
        throw new Error('Bad status code');
      } else {
        // The response `body` -- res.body -- is a stream
        res.body.pipe(feedparser);
      }
    },
    (err) => {
      // handle any request errors
      console.error({ err });
      process.exit(1);
    }
  );

  feedparser.on('error', (error) => {
    // always handle errors
    console.error({ error });
    process.exit(1);
  });

  const logpath = path.resolve(__dirname, '../reports/feedparser.json');
  if (!fs.existsSync(logpath)) {
    fs.writeJSONSync(logpath, [], { spaces: 2 });
  }
  const content = fs.readJSONSync(logpath, 'utf8');
  const log = [...content];

  feedparser.on('readable', function readable() {
    // This is where the action is!
    const stream = this; // `this` is `feedparser`, which is a stream
    // const { meta } = this; // **NOTE** the "meta" is always available in the context of the feedparser instance
    // console.log({ meta });
    let item;

    // eslint-disable-next-line
    while ((item = stream.read())) {
      if (item.categories.includes('Uncategorized')) {
        log.push({
          error: 'uncategorized',
          title: item.title,
          link: item.link,
        });
      }
    }

    fs.writeJSONSync(logpath, log, { spaces: 2 });
  });
};

if (!module.parent) {
  feeds.forEach(main);
}

module.exports = main;
