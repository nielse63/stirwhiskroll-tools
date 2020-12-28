const main = require('../index');

describe('main', () => {
  it('should return correctly', () => {
    const output = main('test');
    expect(output).toEqual('module says: test');
  });
});
