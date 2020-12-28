require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const table = require('markdown-table');

const logpath = path.resolve(__dirname, '../reports/posts.json');
const docsInPath = path.resolve(__dirname, '../docs/post-errors.md');
const docsOutPath = docsInPath;

const readJSON = () => {
  if (!fs.existsSync(logpath)) {
    fs.writeJSONSync(logpath, {});
  }
  return fs.readJSONSync(logpath, 'utf8');
};

const findViolations = (json) =>
  Object.values(json).filter((postObject) => postObject.hasViolations);

const createMarkdownTableArray = (postObject) => {
  const { title, editLink, type, violations } = postObject;
  const titleString = `[${title}](${editLink})`;
  return [titleString, type, violations.join(', ')];
};

const main = async () => {
  const json = readJSON();
  const offenders = findViolations(json);
  const tableArray = offenders.map(createMarkdownTableArray);
  const markdown = table([['Title', 'Type', 'Violations'], ...tableArray]);
  const oldContent = fs.readFileSync(docsInPath, 'utf8');
  const newContent = oldContent.replace(
    '<!-- content-violations-table -->',
    markdown
  );
  fs.writeFileSync(docsOutPath, newContent);
  console.log('updated posts-errors.md');
  return Promise.resolve();
};

if (!module.parent) {
  main();
}

module.exports = main;
