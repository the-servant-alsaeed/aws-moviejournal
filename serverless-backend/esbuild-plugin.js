// import esbuildPluginTsc from './tsc-plugin';
const lodashTransformer = require('esbuild-plugin-lodash');
const esbuildPluginTsc = require('esbuild-plugin-tsc');

const path = require('path');
const fs = require('fs');

// inspired by https://github.com/evanw/esbuild/issues/1685 + https://github.com/evanw/esbuild/issues/3310
const excludeVendorFromSourceMap = (includes = []) => ({
  name: 'excludeVendorFromSourceMap',
  setup(build) {
    const emptySourceMap =
      '\n//# sourceMappingURL=data:application/json;base64,' +
      Buffer.from(
        JSON.stringify({
          version: 3,
          sources: [''],
          mappings: 'A'
        })
      ).toString('base64');

    build.onLoad({ filter: /node_modules/u }, (args) => {
      if (
        /\.[mc]?js$/.test(args.path) &&
        !new RegExp(includes.join('|'), 'u').test(
          args.path.split(path.sep).join(path.posix.sep)
        )
      ) {
        return {
          contents: `${fs.readFileSync(args.path, 'utf8')}${emptySourceMap}`,
          loader: 'default'
        };
      }
    });
  }
});

// default export should be an array of plugins
module.exports = [
  esbuildPluginTsc(),
  lodashTransformer({
    outLodashPackage: 'lodash-es'
  }),
  excludeVendorFromSourceMap(['@calo'])
];
