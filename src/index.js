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

  var ensureFile = fse.ensureFile;
  var outputFile = fse.outputFile;

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
          'Dist folder does not exist. Check the dir --dir parameter or build the project first!'
        );
        return Promise.reject(error);
      })
      /**
       * Create .nojekyll
       */
      .then(() => ensureFile(path.join(dir, '.nojekyll')))
      .catch(error =>
        spinner.warn(
          '.nojekyll could not be created. Please create manually. Continuing without an error.'
        )
      )
      /**
       * Setting up custom domain
       */
      .then(() => ensureFile(path.join(dir, 'CNAME')))
      .then(() => readFile(path.join(dir, 'CNAME'), 'utf8'))
      .then(data =>
        outputFile(
          path.join(dir, 'CNAME'),
          options.CNAME ? options.CNAME : data.replace(/\s+/, '')
        )
      )
      .catch(() =>
        spinner.warn(
          'CNAME could not be created. Please create manually. Continuing without an error.'
        )
      )
      /**
       * Output 404.html, setting segmentCount
       */
      .then(() => readFile(path.join(dir, 'CNAME'), 'utf8'))
      .then(data =>
        outputFile(
          path.join(dir, '404.html'),
          data
            ? hjson.notFoundHtml.replace(
                /segmentCount\s=\s1/,
                'segmentCount = 0'
              )
            : hjson.notFoundHtml
        )
      )
      .catch(error => {
        spinner.fail(
          '404.html could not be created. An error occurred:\n' + error
        );
        return Promise.reject(error);
      })
      /**
       * Inject redirect code to index.html
       */
      .then(() => readFile(path.join(dir, 'index.html'), 'utf8'))
      .then(data =>
        outputFile(
          path.join(dir, 'index.html'),
          data.includes('indexRedirect')
            ? data
            : data.replace(/<head>/, '<head>' + hjson.indexRedirect)
        )
      )
      .catch(error => {
        spinner.fail(
          'Unable to inject redirection code to index.html. Error occurred:\n' +
            error
        );
        return Promise.reject(error);
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
