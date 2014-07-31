var Metalsmith = require('metalsmith'),
    markdown = require('metalsmith-markdown'),
    templates = require('metalsmith-templates'),
    Handlebars = require('handlebars'),
    fs = require('fs'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    tags = require('metalsmith-tags'),
    beautify = require('metalsmith-beautify'),
    slug = require('slug-component'),
    moment = require('moment');

Handlebars.registerPartial('header', fs.readFileSync(__dirname + '/templates/partials/header.hbs').toString());
Handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/templates/partials/footer.hbs').toString());
Handlebars.registerPartial('posts-list-item', fs.readFileSync(__dirname + '/templates/partials/posts-list-item.hbs').toString());

Handlebars.registerHelper('shortDate', function (date) {
    return moment(date).utc().format('M/D YYYY');
});

Metalsmith(__dirname)
    .use(collections({
        pages: {
            pattern: 'content/pages/*.md'
        },
        blog : {
            pattern: '_posts/*.md',
            sortBy : 'date',
            reverse: true
        }
    }))
    .use(tags({
        handle  : 'tags', // yaml key for tag list in you pages
        path    : 'blog/tags', // path for result pages
        template: '/blog-tag.hbs', // template to use for tag listing
        sortBy  : 'date', // provide posts sorted by 'date' (optional)
        reverse : true // sort direction (optional)
    }))
    .use(appendMetadata())
    .use(markdown())
    .use(permalinks({
        pattern: ':collection/:date/:title',
        date   : 'YYYY/MM'
    }))
    .use(beautify({
        "css" : false,
        "js"  : false,
        "html": {
            "wrap_line_length": 80
        }
    }))
    .use(embedGist({
        user            : 's-stude',
        placeholderRegex: /\{gist#[a-zA-Z0-9]+\}/,
        gistIdRegex     : /[^gist{#][a-zA-Z0-9]+[^}]/
    }))
    .use(templates('handlebars'))
    .destination('./build')
    .clean(true)
    .build(function (err) {
        if (err) throw err;
    });


function embedGist(config) {
    return function (files, metalsmith, done) {
        var metadata = metalsmith.metadata();

        var embedTemplate = '<script src="https://gist.github.com/$USER$/$GISTID$.js"></script>';

        metadata.blog.forEach(function (_post) {

            if (config.placeholderRegex.test(_post.contents.toString())) {

                var gistPlaceholder = _post.contents.toString().match(config.placeholderRegex)[0];
                var gistId = gistPlaceholder.match(config.gistIdRegex)[0];

                var template = embedTemplate
                    .replace('$USER$', config.user)
                    .replace('$GISTID$', gistId);

                var replacedContent = _post.contents.toString().replace(config.placeholderRegex, template);

                _post.contents = new Buffer(replacedContent);
            }
        });

        done();
    }
}

function appendMetadata(config) {
    return function (files, metalsmith, done) {
        var metadata = metalsmith.metadata();

        metadata.blog.forEach(function (_post) {
            var slugVal = slug(_post.title);
            var datePart = moment(_post.date).utc().format('YYYY/MM');
            _post.url = '/blog/' + datePart + '/' + slugVal;
        });

        done();
    };
};