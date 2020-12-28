const postValidator = require('./post-validator');
const parsePostData = require('./parse-post-data');

const main = async () => {
  await postValidator();
  await parsePostData();
};

if (!module.parent) {
  main();
}

module.exports = main;
