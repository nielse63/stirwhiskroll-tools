require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const table = require('markdown-table');
const _ = require('lodash');

const docsInPath = path.resolve(__dirname, '../docs/post-errors.md');
const docsOutPath = docsInPath;

const urls = [
  {
    title: 'Homepage',
    url: 'https://stirwhiskandroll.com',
  },
  {
    title: 'Single Recipe',
    url:
      'https://stirwhiskandroll.com/recipe/a-little-extra-spice-banana-bread/',
  },
  {
    title: 'Recipes Search',
    url: 'https://stirwhiskandroll.com/recipes/',
  },
];

const runLighthouse = async (url) => {
  console.log(`fetching ${url}`);
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    output: 'json',
    onlyCategories: ['accessibility', 'performance', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);

  await chrome.kill();
  const results = Object.entries(runnerResult.lhr.categories).reduce(
    (output, [category, value]) => {
      const score = value.score * 100;
      return {
        ...output,
        [_.camelCase(category)]: score,
      };
    },
    {}
  );

  return results;
};

const main = async () => {
  const docsContent = fs.readFileSync(docsInPath, 'utf8');
  const tableData = [
    ['Title', 'Performance', 'Accessibility', 'Best Practices', 'SEO'],
  ];
  for await (const { title, url } of urls) {
    const {
      performance,
      accessibility,
      bestPractices,
      seo,
    } = await runLighthouse(url);
    tableData.push([
      `[${title}](${url})`,
      performance,
      accessibility,
      bestPractices,
      seo,
    ]);
  }
  const markdown = table(tableData);
  const newContent = docsContent.replace('<!-- lighthouse-table -->', markdown);
  fs.writeFileSync(docsOutPath, newContent);
};

if (!module.parent) {
  main().then(() => console.log('lighthouse run complete'));
}

module.exports = main;
