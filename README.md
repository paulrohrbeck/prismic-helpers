# Prismic helpers
A helpful script for working with the CMS Prismic.

## Features

- Find a string anywhere in your Prismic content
- Find any references to a specific record to see if it's still used
- Filter by a specific slice to see how it's used
- Filter by specific content type to see how it's used
- Show a list of all slice types and call out rarely used ones
- List all pages in the system

## Usage
Add this to the `package.json`:

```
  "scripts": {
    "slice-usage": "node ./slice-usage.mjs",
  },
```

Add your repo name to the `slice-usage.mjs` file and uncomment the script sections you need. Note that this is not a turnkey tool with all the bells and whistles.

Then run with `npm run slice-usage`
