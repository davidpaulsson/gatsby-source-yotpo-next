require('dotenv').config();

module.exports = {
  plugins: [
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      resolve: 'gatsby-source-yotpo-next',
      options: {
        appKey: process.env.YOTPO_APP_KEY,
        appSecret: process.env.YOTPO_APP_SECRET,
      },
    },
  ],
};
