/**
 * Constants for the Zendesk API request properties
 */
module.exports = {
    HELP_CENTER_ENDPOINT: '/api/v2/help_center',
    // Common Zendesk properties
    LOCALE: 'locale',
    POSITION: 'position',
    ID: 'id',
    // Article Zendesk properties
    ARTICLE: {
        TITLE: 'title',
        HTML: 'body',
        LABELS: 'label_names'
    },
    // Section Zendesk properties
    SECTION: {
        TITLE: 'name',
        DESCRIPTION: 'description',
        ACCESS_POLICY: 'access_policy',
        VIEWABLE_BY: 'viewable_by',
        MANAGEABLE_BY: 'manageable_by'
    }
};
