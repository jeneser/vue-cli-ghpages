# Hack

> The Single Page App Hack for GitHub Pages

## hack.json

Instructions:

- **name** - hack.json
- **version** - Version
- **description** - Description
- **nojekyll** - Turns off Jekyll for GitHub Pages
- **CNAME** - Setting up a custom domain
- **notFoundHtml** - The custom 404.html page contains a script that takes the current url and converts the path and query string into just a query string,and then redirects the browser to the new url with only a query string and hash fragment. 
- **indexRedirect** - This script checks to see if a redirect is present in the query string and converts it back into the correct url and adds it to the browser's history using window.history.replaceState(...)

Learn more: https://github.com/rafrex/spa-github-pages

## License

MIT Copyright (c) 2017 [Jeneser](https://github.com/jeneser)

MIT Copyright (c) 2016 [Rafael Pedicini](https://github.com/rafrex)
