/**
 * Automatic Routing Module
 *
 * This module reads routing configuration from filesystem and register endpoint to Express app.
 *
 * @author xxvvii
 */

var walk = require('walk');
var path = require('path');

var files = [];

var loggerFn = function(str) {
    console.log(str);
};

var logger = {
    debug: loggerFn,
    error: loggerFn,
    info: loggerFn
};

/**
 *
 * @param router
 * @param method
 * @param path
 * @param route
 */
function applyRoute(router, route) {
    var args = [],
        method = route.method || 'get';

    args.push(route.path);
    // TODO push filters...
    args.push(function(req, res) {
        var ret = route.route(req, res);
        var contentType = res.getHeader('Content-Type');

        if (!res.headersSent && !contentType) {
            // set default response content type
            res.header({'Content-Type': 'text/html'});
        }

        if (ret) {
            if (typeof ret === 'string') {
                res.render(ret);//path.relative('/', route.path + ret));
            }
        }
    });
    router[method].apply(router, args);
    logger.debug(method.toUpperCase() + ': ' + route.path + "");
}

/**
 * apply route group
 *
 * @param router
 * @param routes
 * @param key
 */
function applyRouteGroup(router, routes, key) {
    if (typeof routes === 'object') {
        // if param is a array of objects
        Object.keys(routes).forEach(function(path) {
            var route = routes[path];

            Object.keys(route).forEach(function(method) {
                applyRoute(router, {
                    method: method,
                    path: key + (path || ''),
                    route: route[method]
                });
            });
        });
    }
    else if (typeof routes === 'function') {
        applyRoute(router, {
            method: 'get',
            path: key,
            route: routes
        });
    }
}

/**
 * @param router
 */
exports.route = function(router) {
    // Walker options
    var base = 'routes';
    var walker = walk.walk(base, { followLinks: false });

    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        var extname = path.extname(stat.name),
            basename = path.basename(stat.name, extname);

        if (extname === '.js') {
            var endpoint = basename === 'index' ? '' : basename;
            var parent = path.relative(base, root);

            var obj = {};

            if (parent.indexOf('/') !== 0) {
                parent = '/' + parent;
            }

            obj[parent + endpoint] = root + '/' + basename;
            files.push(obj);
        }
        next();
    });

    walker.on('end', function() {
        files.forEach(function(file) {
            Object.keys(file).forEach(function(key) {
                var routes = require("../" + file[key]);

                if (routes) {
                    applyRouteGroup(router, routes, key);
                }
                else {
                    logger.warn('No routes found in "' + key + '".');
                }
            });
        });

        logger.info('Routing endpoints has been registered.');
    });
};