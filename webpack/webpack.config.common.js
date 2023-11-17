const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const ejs = require('ejs');
const ESLintPlugin = require('eslint-webpack-plugin');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');

// import and configure dotenv
require('dotenv-defaults').config();

const paths = require('./paths');

let publicUrl = process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : '/';
if (!publicUrl) {
  publicUrl = '/';
} else if (!publicUrl.endsWith('/')) {
  // ensure last slash exists
  publicUrl = publicUrl + '/';
}

module.exports = {
  entry: {
    index: `${paths.src}/index.js`,
  },
  output: {
    path: paths.dist,
    filename: 'js/[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      // Image assets
      {
        test: /\.(gif|ico|jpe?g|png|svg|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
      // Fonts
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]',
        },
      },
      // EJS Templates
      {
        test: /\.ejs$/i,
        loader: 'html-loader',
        options: {
          sources: {
            urlFilter: (attribute, value) => {
              return !value.startsWith(publicUrl);
            },
          },
          preprocessor: (content, loaderContext) => {
            try {
              const templatePath = `${paths.src}/index.ejs`;

              // trigger re-compile if partial has changed
              // see: https://github.com/webpack-contrib/html-loader/issues/386
              const partialsPath = `${paths.src}/partials`;
              fs.readdirSync(partialsPath).forEach((file) => {
                if (file.endsWith('.ejs')) {
                  const filePath = `${partialsPath}/${file}`;
                  loaderContext.addDependency(filePath);
                }
              });

              // expose htmlWebpackPlugin object in EJS templates
              const currentHtmlWebpackPlugin = loaderContext._compiler.options.plugins.filter(
                (plugin) =>
                  typeof plugin === 'object' &&
                  plugin.options &&
                  plugin.options.template &&
                  plugin.options.template === loaderContext.resourcePath,
              )[0];

              const templateParameters = {};

              if (typeof currentHtmlWebpackPlugin === 'object') {
                Object.assign(templateParameters, {
                  htmlWebpackPlugin: currentHtmlWebpackPlugin,
                });

                if (typeof currentHtmlWebpackPlugin.options.templateParameters !== 'function') {
                  Object.assign(templateParameters, {
                    ...currentHtmlWebpackPlugin.options.templateParameters,
                  });
                }
              }

              return ejs.render(content, templateParameters, { filename: templatePath });
            } catch (error) {
              loaderContext.emitError(error);

              return content;
            }
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `${paths.src}/index.ejs`,
      filename: 'index.html',
      templateParameters: {
        bodyClass: 'page-index',
        publicUrl: publicUrl.slice(0, -1),
      },
      title: 'Index | Webpack Starter',
    }),
    new HtmlWebpackPlugin({
      template: `${paths.src}/about.ejs`,
      filename: 'about.html',
      templateParameters: {
        bodyClass: 'page-about',
        publicUrl: publicUrl.slice(0, -1),
      },
      title: 'About | Webpack Starter',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: '**/*',
          context: paths.public,
        },
      ],
    }),
    new ESLintPlugin({
      extensions: 'js',
      context: paths.src,
    }),
    new StylelintPlugin({
      extensions: ['css', 'scss'],
      context: paths.src,
    }),
    new Dotenv(),
  ],
};
