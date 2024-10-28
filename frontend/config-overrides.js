const path = require('path');

module.exports = {
  webpack: (config) => {
    config.output = {
      ...config.output,
      // path: path.resolve(__dirname, '../backend/frontend/build'), // Change 'my-custom-build-dir' to desired directory
      path: path.resolve(__dirname, '../build'), // Change 'my-custom-build-dir' to desired directory
    };
    return config;
  },
};