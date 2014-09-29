express-nexus
=============

A route module for express

# Samples
## Basic routing
```
module.exports = {
    '/': {
        get: function() {
            return 'your_view_name';
        }
    },
    '/:id': {
        get: function(req, res) {
            // Get the path variable from request with 'req.params.id'
            // and do some works here
        }
    }
};
```