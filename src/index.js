var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var chalk = require('chalk');
var ghpages = require('gh-pages');
var denodeify = require('denodeify');
var hjson = require('./hack/hack.json');

exports.run = function(options) {
  // config
  options = options || {};

  var access = denodeify(fs.access);
  var publish = denodeify(ghpages.publish);

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
      // Tests user's permissions for the directory
      .then(() => access(dir, fs.constants.F_OK))
      .catch(error => {
        console.error(
          chalk.white.bgRed('ERROR') +
            chalk.red(
              ' Dist folder does not exist. Check the dir --dir parameter or build the project first!\n'
            )
        );
        return Promise.reject(error);
      })
      // Hack
      .then(() => {
        // Create .nojekyll
        fse
          .ensureFile(path.join(process.cwd(), '/dist/.nojekyll'))
          .catch(error => console.log(error));

        if (options.CNAME) {
          // Output CNAME
          fse
            .outputFile(path.join(process.cwd(), '/dist/CNAME'), options.CNAME)
            .catch(error => console.log(error));
          // Output 404.html
          fse
            .outputFile(path.join(process.cwd(), '/dist/404.html'), hjson.notFoundHtml)
            .catch(error => console.log(error))
        } else {
          // Output 404.html
          fse
            .outputFile(path.join(process.cwd(), '/dist/404.html'), hjson.notFoundHtml)
            .catch(error => console.log(error))
        }
        
        // Index redirect

      })
      // Publish
      .then(() => {
        console.log('Published ok!');
        // publish(dir, options)
      })
      // Success
      .then(() => console.log(chalk.green('Successfully published!\n')))
      .catch(error => {
        console.error(chalk.red('An error occurred:\n %s'), error);
        return Promise.reject(error);
      })
  );
};
