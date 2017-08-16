var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var ora = require('ora');
var ghpages = require('gh-pages');
var denodeify = require('denodeify');
var hjson = require('./hack/hack.json');

exports.run = function(options) {
  options = options || {};

  var access = denodeify(fs.access);
  var readFile = denodeify(fs.readFile);
  var publish = denodeify(ghpages.publish);

  const spinner = ora('Start deployment...').start();

  var dir = path.join(process.cwd(), options.dir);

  if (options.name && options.email) {
    options.user = {
      name: options.name,
      email: options.email
    };
  }

  // clean the cache directory
  ghpages.clean();

  return (
    Promise.resolve()
      /**
       * Tests user's permissions for the directory
       */
      .then(() => access(dir, fs.constants.F_OK))
      .catch(error => {
        spinner.fail(
          'Dist folder does not exist. Check the dir --dir parameter or build the project first!\n'
        );

        return Promise.reject(error);
      })
      /**
       * The Single Page App hack for GitHub Pages
       */
      .then(() => {
        // Create .nojekyll
        fse.ensureFile(path.join(dir, '.nojekyll')).catch(error => {
          spinner.warn(
            '.nojekyll could not be created. Please create manually. Continuing without an error.\n'
          );
        });

        // Setting up a custom domain
        if (options.CNAME) {
          // Output CNAME
          fse
            .outputFile(path.join(dir, 'CNAME'), options.CNAME)
            .catch(error => {
              spinner.warn('CNAME could not be created. Please create manually. Continuing without an error.\n');
            });

          // Output 404.html, setting segmentCount = 0
          fse
            .outputFile(
              path.join(dir, '404.html'),
              hjson.notFoundHtml.replace(
                /segmentCount\s=\s1/,
                'segmentCount = 0'
              )
            )
            .catch(error => {
              spinner.fail('404.html could not be created. An error occurred:\n' + error);
            });
        } else {
          // Output default 404.html for Project Pages site
          fse
            .outputFile(path.join(dir, '404.html'), hjson.notFoundHtml)
            .catch(error => {
              spinner.fail('404.html could not be created. An error occurred:\n' + error);
            });
        }

        /**
         * Inject redirect code to index.html
         */
        readFile(path.join(dir, 'index.html'), 'utf8')
          .then(data => {
            // Inject only once redirect code
            if (data.indexOf('indexRedirect') === -1) {
              fse
                .outputFile(
                  path.join(dir, 'index.html'),
                  data.replace(/<head>/, '<head>' + hjson.indexRedirect)
                )
                .catch(error => {
                  spinner.fail('index.html could not be created. An error occurred:\n' + error);
                });
            }
          })
          .catch(error => {
            spinner.fail('index.html could not be created. An error occurred:\n' + error);
          });
      })
      /**
       * Publish via ghpages
       */
      .then(() => {
        spinner.text = 'Deploying, please wait a moment...';
        return publish(dir, options);
      })
      // Success
      .then(() => {
        spinner.succeed('Successfully deployed!');
      })
      .catch(error => {
        spinner.fail('Error occurred:\n' + error);
        return Promise.reject(error);
      })
  );
};
