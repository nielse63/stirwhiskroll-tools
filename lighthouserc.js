require('dotenv').config();

module.exports = {
  ci: {
    collect: {
      url: ['https://stirwhiskandroll.com/'],
    },
    upload: {
      target: 'temporary-public-storage',
    },
    // assert: {
    //   preset: 'lighthouse:recommended',
    // },
  },
};
