## Documentation folder structure

Documentation folder has 3 level tree-like structure, inspired by ZenDesk documentation structure:

```
category/
├── meta.json
├── section/
│   ├── meta.json
│   ├── article/
│   │   ├── content.md
│   │   ├── meta.json
│   │   ├── image.png
│   │   ├── image.jpg
│   │   ├── image.jpeg
│   │   └── document.pdf
│   └── another_article/
│       ├── content.md
│       ├── meta.json
│       ├── image.png
│       ├── image.jpg
│       ├── image.jpeg
│       └── document.pdf
└── another_section/
    ├── meta.json
    ├── article/
    │   ├── content.md
    │   ├── meta.json
    │   ├── image.png
    │   ├── image.jpg
    │   ├── image.jpeg
    │   └── document.pdf
    └── another_article/
        ├── content.md
        ├── meta.json
        ├── image.png
        ├── image.jpg
        ├── image.jpeg
        └── document.pdf
```

## Tree levels

### Root (Category) level

Root level of your documentation folder represents ZenDesk category. It may contain following items:
- Category metadata written in file named `meta.json`. This file contains category title, description, etc. You can find more details [here](metadata.md)
- Section folders. Each folder represents a section under the category.
All folders in category folder are being recognized as sections. All files expect `meta.json` will be ignored for category.
Metadata file `meta.json` required to be in the folder. If it's missing, upload will fail with error.
It is OK to not have any sections under category. In this case only category itself will be created/updated.

Example of valid category level:

```
project_root/
├── meta.json
├── section/
├── another_section/
└── cool_section/
```

### Category level

Second folder level represents category level of your documentation. It may contain following items:

- Section metadata written in file named `meta.json`. This file contains section title, description, etc. You can find more detail [here](metadata.md)
- Article folders. Each folder represents an article under section.

All folders in section folder are being recognized as articles. All files expect `meta.json` will be ignored for section.
Metadata file `meta.json` required to be in the folder. If it's missing, upload will fail with error.
It is OK to not have any articles under section. In this case only section itself will be created/updated.

Example of valid section level:

```
section/
├── meta.json
├── article/
├── cool_article/
└── another_cool_article/
```

### Article level

Third folder level represents article level of your documentation folder. It may contain following items:

- Article metadata written in file named `meta.json`. This file contains section title, description, etc. You can find more detail [here](metadata.md)
- Article contents written in `%filename%.md`. Please note, that name of this file may have any name, only extension `.md` is required.
- Static files in following formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.pdf`.

All folders in article folder will be ignored. All files except `meta.json`, article content and supported static files will be ignored for article.
Metadata file `meta.json` required to be in the folder. If it's missing, upload will fail with error.
One and only one `.md` file must exist in article folder. If there will be no markdown content, or content will be ambiguous (i.e. more then one `.md` file),
upload will fail with error.

Example of valid article level:

```
article/
├── meta.json
├── content.md
├── photo.jpg
├── picture.png
└── document.pdf
```
