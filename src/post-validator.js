require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const _ = require('lodash');

const logpath = path.resolve(__dirname, '../reports/posts.json');

const urls = [
  'https://stirwhiskandroll.com/wp-json/wp/v2/posts',
  'https://stirwhiskandroll.com/wp-json/wp/v2/recipe',
];

const getTags = (object) => {
  if (object.type === 'recipe') {
    return _.get(object, 'recipe-tag', []);
  }
  return _.get(object, 'tags', []);
};

const enablePingStatus = async (id) => {
  const config = {
    method: 'post',
    url: `https://stirwhiskandroll.com/wp-json/wp/v2/recipe/${id}`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: { ping_status: 'open' },
    auth: {
      username: process.env.WP_USER,
      password: process.env.WP_PASS,
    },
  };
  try {
    await axios(config);
  } catch (error) {
    console.error(error);
  }
};

const hasCategoryViolations = ({ type, categories }) => {
  if (type !== 'post') return false;
  if (!categories.length) {
    return 'NO_EMPTY_CATEGORIES';
  }
  if (categories.length === 1 && categories[0] === 1) {
    return 'NO_UNCATEGORIZED_POSTS';
  }
  if (categories.length > 1) {
    return 'ONE_CATEGORY_PER_POST';
  }
  return false;
};

const hasTagsViolations = ({ tags }) => {
  if (!tags.length) {
    return 'NO_UNTAGGED_POSTS';
  }
  return false;
};

const hasFeaturedImageViolations = ({ featuredImage }) => {
  if (!featuredImage) {
    return 'MISSING_FEATURED_IMAGE';
  }
  return false;
};

const hasPingStatusViolation = ({ pingStatus }) => {
  if (pingStatus !== 'open') {
    return 'NO_CLOSED_PING_STATUS';
  }
  return false;
};

const findViolations = (postObject) => {
  const { status } = postObject;
  const violations = {
    category: false,
    tags: false,
    featuredImage: false,
    pingStatus: false,
  };
  if (status !== 'publish') {
    return [];
  }
  violations.featuredImage = hasFeaturedImageViolations(postObject);
  violations.pingStatus = hasPingStatusViolation(postObject);
  violations.tags = hasTagsViolations(postObject);
  violations.category = hasCategoryViolations(postObject);

  return Object.values(violations).filter((string) => !!string);
};

const parsePostObject = (object) => {
  const {
    id,
    status,
    type,
    link,
    featured_media: featuredImage,
    ping_status: pingStatus,
  } = object;
  const title = _.get(object, 'title.rendered', '');
  const content = _.get(object, 'content.rendered', '');
  const tags = getTags(object);
  const categories = _.get(object, 'categories', []);
  return {
    id,
    status,
    type,
    link,
    title,
    content,
    tags,
    categories,
    featuredImage,
    pingStatus,
  };
};

const fetchJSON = async (url) => {
  try {
    let response = await axios.get(url);
    const promises1 = response.data.map(async (object) => {
      if (object.status === 'publish' && object.ping_status !== 'open') {
        await enablePingStatus(object.id);
      }
    });
    await Promise.all(promises1);
    response = await axios.get(url);
    const promises = response.data.map(async (object) => {
      const postObject = parsePostObject(object);
      const violations = findViolations(postObject);

      return {
        ...postObject,
        editLink: `https://stirwhiskandroll.com/wp-admin/post.php?post=${object.id}&action=edit`,
        hasViolations: violations.length,
        violations,
      };
    });
    return Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
  return [];
};

const getCurrentLogs = () => {
  if (!fs.existsSync(logpath)) {
    fs.writeJSONSync(logpath, {});
  }
  return {};
};

const main = async () => {
  const json = getCurrentLogs();
  /* eslint-disable no-await-in-loop, no-restricted-syntax */
  for (const url of urls) {
    const response = await fetchJSON(url);
    response.forEach((object) => {
      const { id } = object;
      json[id] = object;
    });
  }
  fs.writeJSONSync(logpath, json, { spaces: 2 });
};

if (!module.parent) {
  main().then(() => console.log('updated posts log'));
}

module.exports = main;
