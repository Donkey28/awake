module.exports = {
  env: 'test',

  get port() {
    return this.env === 'prod' ? 443 : 3000;
  },

  get statsEnabled() {
    return this.env === 'test';
  }
};
