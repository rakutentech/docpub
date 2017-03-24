# DocPub configuration

**DocPub** is configured using `docpub.conf` file at the root of the project.

Complete example with all available settings looks like this, but you'll need
to specify only a few settings specific for your project:

```javascript
{
    "username": "user@example.com"
    "token": "abc123def456ghi789"
    "url": "example.zendesk.com"
    "rendering": {
        "highlight": true
    }
}
```

## Available settings

### Generic settings:

* `username` (required) — name of ZenDesk user with documentation publish access rights.
  On ZenDesk, this user would be displayed as documentation publisher.

* `token` (required) — access token of the user above.

* `url` (required) — fully qualified URL of your `ZenDesk` space. Please note, that this should
  be only base URL, path shall not be included. Example: `example.zendesk.com`

### Rendering settings

Rendering settings are controlling Markdown to HTML conversion process. Mostly control appearance,
but may add impact on resulting HTML structure too.

Settings list:

* `highlight` - should highlighting be applied to code block in markdown or not.
  If enabled, will add HTML markup and CSS classes provided by [highlight.js](https://highlightjs.org).
  Please note, that stylesheets themselves will be neither linked nor inlined into
  the resulting HTML because, by default, such content considered as unsafe and
  stripped out by ZenDesk. Stylesheets shall be added separately to the ZenDesk template.
  Default option value: `true`.

## Overriding settings

All options can also be overridden via command-line flags or environment
variables. Priorities are the following:

* command-line option has the highest priority. It overrides environment
  variable and config file value.

* environment variable has second priority. It overrides config file value.

* config file value has the lowest priority.

* if no command-line option, environment variable or config file option
  specified, default is used.

To override config setting with CLI option, convert full option path to
`--kebab-case`. For example, if you want publish documents to different ZenDesk
space, call:

```sh
docpub --url http://example.com
```

To disable code highlighting in resulting HTML, you may do following:

```sh
docpub --rendering-highlight=false
```

To override setting with environment variable, convert its full path to
`snake_case` and add `docpub_` prefix. Above examples can be rewritten to use
environment variables instead of CLI options:

```
docpub_url=http://example.com docpub
docpub_rendering_highlight=false docpub
```
