require('dotenv').config();

module.exports = {
  ci: {
    collect: {
      url: [
        'https://stirwhiskandroll.com/',
        'https://stirwhiskandroll.com/recipe/the-best-instant-pot-french-toast-recipe-vegan-gluten-free/',
      ],
    },
    upload: {
      target: 'temporary-public-storage',
    },
    // assert: {
    //   preset: 'lighthouse:recommended',
    // },
  },
};
