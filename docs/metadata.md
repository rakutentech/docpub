# Metadata Format

Metadata for the category, sections, and articles should always be in a file named `meta.json` and be placed appropriately in the directory tree, as explained in the folder structure [specs](folder-structure.md). The metadata is in `json` format, so it should always follow the format as shown below:

```json
{
    "propertyName": "value",
    "propertyName2": "value"
}
```

## Category
The category metadata should be in a file named `meta.json` in the root folder of the category.

| Property    | Type    | Description                                                                                    | Required |
|-------------|---------|------------------------------------------------------------------------------------------------|----------|
| title       | string  | Title of the category.                                                                         | Yes      |
| description | string  | Description of the category which is typically displayed beneath the title.                    | No       |
| position    | integer | Position number of the category relative to other categories when listed.                      | No       |
| locale      | string  | Locale that the category is displayed in. `en-us` is used by default if no locale is provided. | No       |

**Example:**

```json
{
    "title": "Section Title",
    "description": "Description goes here.",
    "position": 1,
    "locale": "en-us"
}
```

## Section
The section metadata should be in a file named `meta.json` in the root folder of the section.

| Property     | Type    | Description                                                                                                 | Required |
|--------------|---------|-------------------------------------------------------------------------------------------------------------|----------|
| title        | string  | Title of the section.                                                                                       | Yes      |
| description  | string  | Description of the section which is typically displayed beneath the title.                                  | No       |
| position     | integer | Position number of the section relative to other sections when listed.                                      | No       |
| locale       | string  | Locale that the section is displayed in. `en-us` is used by default if no locale is provided.               | No       |
| viewableBy   | string  | Set of users who can view content in this section. Value can be `everybody`, `signed_in_users`, or `staff`. | No       |
| manageableBy | string  | Set of users who can manage content in this section. Value can be `staff`, or `managers`.                   | No       |

**Example:**

```json
{
    "title": "Section Title",
    "description": "Description goes here.",
    "position": 1,
    "viewableBy": "staff",
    "manageableBy": "managers",
    "locale": "en-us"
}
```

## Article
The article metadata should be in a file named `meta.json` in the root folder of the article.

| Property | Type                       | Description                                                                                       | Required |
|----------|----------------------------|---------------------------------------------------------------------------------------------------|----------|
| title    | string                     | Title of the article.                                                                             | Yes      |
| labels   | string or array of strings | Labels associated with this article as an array of strings or a string of comma separated labels. | No       |
| position | integer                    | Position number of the article relative to other articles when listed.                            | No       |
| locale   | string                     | Locale that the category is displayed in. `en-us` is used by default if no locale is provided.    | No       |

**Example:**

```json
{
    "title": "Section Title",
    "labels": "label1, label2, label3",
    "position": 1,
    "locale": "en-us"
}
```
