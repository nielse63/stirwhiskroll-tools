#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const getGitConfig = () => {
  const [user, repo] = cp
    .execSync('git config --get remote.origin.url')
    .toString()
    .trim()
    .replace('git@github.com:', '')
    .replace('https://github.com/', '')
    .replace('.git', '')
    .split('/');
  const name = cp.execSync('git config --get user.name').toString().trim();
  const email = cp.execSync('git config --get user.email').toString().trim();
  return { user, repo, name, email };
};

const findAndReplace = (filename, oldValues, newValues) => {
  const abspath = path.resolve(__dirname, filename);
  const content = fs.readFileSync(abspath, 'utf8');
  let newContent = content;
  Object.entries(oldValues).forEach(([key, oldValue]) => {
    const newValue = newValues[key] || oldValue;
    if (newValue !== oldValue) {
      newContent = content.replace(new RegExp(oldValue, 'g'), newValue);
    }
  });
  fs.writeFileSync(abspath, newContent, 'utf8');
  console.log(`Updated ${filename}`);
};

const getMarkdownFiles = () =>
  fs.readdirSync(__dirname).filter((filename) => filename.endsWith('.md'));

const files = ['package.json', 'package-lock.json', ...getMarkdownFiles()];

const oldValues = {
  user: 'nielse63',
  repo: 'node-template',
  name: 'Erik Nielsen',
  email: 'erik@312development.com',
};
const newValues = getGitConfig();
files.forEach((file) => {
  findAndReplace(file, oldValues, newValues);
});
