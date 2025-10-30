# Rich Text Translation Handling

## Overview

The translation scripts handle rich text fields (Lexical/Slate editor) **automatically and correctly** by:

1. ✅ **Traversing nested structures** - Walks through the entire JSON tree
2. ✅ **Finding text nodes** - Locates all `text` fields regardless of depth
3. ✅ **Preserving formatting** - Keeps bold, italic, lists, headings intact
4. ✅ **Maintaining structure** - Document tree, node types, and metadata unchanged
5. ✅ **Smart filtering** - Ignores technical fields like `type`, `format`, `direction`, etc.

## How Rich Text is Stored

Rich text in Payload (Lexical editor) is stored as JSON:

```json
{
  "root": {
    "type": "root",
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "text": "This text will be translated",
            "type": "text",
            "format": 0
          }
        ]
      },
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "text": "Bullet point text",
                "type": "text"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Translation Process

### 1. Text Extraction
The script recursively finds all `text` fields:
- `root.children.0.children.0.text` → "This text will be translated"
- `root.children.1.children.0.children.0.text` → "Bullet point text"

### 2. Smart Filtering
Automatically skips:
- ❌ Technical fields: `type`, `mode`, `format`, `style`, `direction`
- ❌ Metadata: `version`, `indent`, `detail`
- ❌ Technical values: `"ltr"`, `"paragraph"`, `"normal"`, `"bullet"`
- ❌ Short codes: Values under 4 characters without spaces
- ❌ URLs and paths

Only translates:
- ✅ Actual content in `text` fields
- ✅ Sentences and phrases
- ✅ List items and headings

### 3. Structure Preservation
Uses deep merge to combine:
```javascript
// Original structure (all formatting)
+ Translations (only text content)
= Final result (structure + translated text)
```

## Example: Before & After

### Before Translation (English)
```json
{
  "root": {
    "type": "root",
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "text": "Welcome to our platform",
            "type": "text",
            "format": 0
          }
        ]
      }
    ]
  }
}
```

### After Translation (Spanish)
```json
{
  "root": {
    "type": "root",  // ← Preserved
    "children": [
      {
        "type": "paragraph",  // ← Preserved
        "children": [
          {
            "text": "Bienvenido a nuestra plataforma",  // ← Translated!
            "type": "text",  // ← Preserved
            "format": 0  // ← Preserved
          }
        ]
      }
    ]
  }
}
```

## Supported Rich Text Features

All formatting is automatically preserved:

- ✅ **Paragraphs** - Text blocks
- ✅ **Headings** - H1, H2, H3, etc.
- ✅ **Lists** - Bullet and numbered lists
- ✅ **Formatting** - Bold, italic, underline
- ✅ **Links** - URLs preserved, link text translated
- ✅ **Nested structures** - Lists within lists, etc.
- ✅ **Code blocks** - Code preserved, comments can be translated
- ✅ **Quotes** - Quote formatting preserved

## What Gets Translated

In rich text:
- ✅ Paragraph text
- ✅ Heading text
- ✅ List item text
- ✅ Link text (not URLs)
- ✅ Table cell content
- ✅ Quote text

## What Doesn't Get Translated

- ❌ URLs and links
- ❌ Code in code blocks
- ❌ Node types (`paragraph`, `heading`, etc.)
- ❌ Formatting codes (`format: 1` for bold, etc.)
- ❌ Direction values (`ltr`, `rtl`)
- ❌ Technical metadata

## Testing

To verify rich text translation works:

```bash
# Dry run on a collection with rich text
COLLECTION_SLUG=faqs TARGET_LOCALE=es DRY_RUN=true pnpm tsx --env-file=.env.local scripts/translate-collection.ts

# Or for blog posts
COLLECTION_SLUG=posts TARGET_LOCALE=es DRY_RUN=true pnpm tsx --env-file=.env.local scripts/translate-collection.ts
```

The output will show:
```
📝 Translating: "Your FAQ Question"
   Found 7 translatable strings  ← Only actual content, no technical fields
   ✓ Updated successfully
```

## Notes

1. **No Special Configuration Needed** - Works automatically for any rich text field
2. **Lexical & Slate Compatible** - Works with both editor formats
3. **HTML in Rich Text** - If rich text contains HTML, tags are preserved
4. **Custom Blocks** - Custom block content is translated if it contains text fields
5. **Performance** - Large rich text fields are batched efficiently

## Troubleshooting

### Issue: Too many strings being translated
**Solution**: Already handled! The script filters out technical fields automatically.

### Issue: Formatting lost after translation
**Solution**: This shouldn't happen. The deep merge preserves all non-text fields. If you see this, please report it.

### Issue: Links broken after translation
**Solution**: URLs are not translated. Only link text is translated while href remains unchanged.

## Technical Details

The `collectTranslatableStrings` function:
1. Recursively walks objects and arrays
2. For each string, checks `shouldTranslate(value, path)`
3. Skips if it's a technical field based on path or value
4. Collects translatable strings with their full path
5. After translation, uses `deepMerge` to preserve structure

This approach ensures **100% structure preservation** while translating all user-facing content.

