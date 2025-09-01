# Translation System for Anza Management System

This project includes a comprehensive translation system supporting English and Swahili languages.

## Overview

The translation system consists of:

- **Translation files**: Located in `/app/locales/`
- **Translation provider**: Context provider for managing language state
- **Language toggle**: Bottom-right toggle component for switching languages
- **Translation hook**: `useTranslation()` hook for accessing translations in components

## Files Structure

```
app/locales/
├── index.js          # Translation provider and utilities
├── en.js            # English translations
└── sw.js            # Swahili translations (empty for translators)
```

## For Translators

### Swahili Translation File (`/app/locales/sw.js`)

This file contains all the text that needs to be translated to Swahili. Each empty string (`""`) should be filled with the appropriate Swahili translation.

**Example:**

```javascript
// Before translation
dashboard: "",
users: "",
logout: "",

// After translation
dashboard: "Dashibodi",
users: "Watumiaji",
logout: "Ondoka",
```

### Translation Categories

The translations are organized into logical sections:

1. **common**: General words used throughout the app
2. **navigation**: Menu items and navigation elements
3. **auth**: Authentication related text
4. **business**: Business information forms and labels
5. **investment**: Investment opportunities content
6. **programs**: Program management content
7. **users**: User profiles and management
8. **forms**: Form validation and upload messages
9. **filters**: Search and filter functionality
10. **errors**: Error messages
11. **success**: Success messages
12. **actions**: Button and action labels

### Guidelines for Translation

1. **Maintain context**: Consider the context where the text appears
2. **Keep formatting**: Preserve any special characters or formatting
3. **Cultural adaptation**: Adapt content to Tanzanian/Swahili cultural context
4. **Consistency**: Use consistent terminology throughout
5. **Length consideration**: Keep translations reasonable in length for UI elements

## For Developers

### Using Translations in Components

Import the translation hook and use it in your components:

```javascript
import { useTranslation } from "@/app/locales";

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("common.dashboard", "Dashboard")}</h1>
      <button>{t("actions.save", "Save")}</button>
    </div>
  );
};
```

### Translation Function Parameters

The `t()` function accepts:

- **key**: Dot notation path to translation (e.g., 'common.dashboard')
- **fallback** (optional): English text to display if translation is missing

### Adding New Translations

1. Add the English text to `/app/locales/en.js`
2. Add an empty string to the same path in `/app/locales/sw.js`
3. Use the translation in your component with `t('path.to.key', 'Fallback Text')`

**Example:**

```javascript
// In en.js
export const en = {
  mySection: {
    newText: "This is new text",
  },
};

// In sw.js
export const sw = {
  mySection: {
    newText: "", // For translator to fill
  },
};

// In component
const text = t("mySection.newText", "This is new text");
```

### Language Toggle Component

The language toggle is automatically included in the main layout and appears in the bottom-right corner. Users can click it to switch between English and Swahili.

### Translation Provider

The `TranslationProvider` is wrapped around the entire application in the main layout, providing translation context to all components.

### Local Storage

Language preferences are automatically saved to localStorage and persist across browser sessions.

## Implementation Examples

### Basic Usage

```javascript
// Simple text translation
<h1>{t('common.welcome', 'Welcome')}</h1>

// Button text
<button>{t('actions.submit', 'Submit')}</button>

// Form labels
<label>{t('forms.emailRequired', 'Email is required')}</label>
```

### Complex Usage

```javascript
// With dynamic content
<span>{t('users.welcome', 'Welcome')} {userName}!</span>

// Conditional translations
<div>
  {isLoading ? t('common.loading', 'Loading') : t('common.ready', 'Ready')}
</div>
```

## Testing Translations

1. Use the language toggle to switch between languages
2. Verify all text updates correctly
3. Check for any missing translations (will show the key or fallback text)
4. Test on different screen sizes to ensure translated text fits properly

## Current Translation Status

- **English**: Complete ✅
- **Swahili**: Pending translation ⏳

## Notes for Translators

- The system is designed for Tanzania, so use appropriate Swahili dialects
- Some technical terms might need to be adapted or kept in English if commonly used
- UI elements should be concise while remaining clear
- Feel free to suggest organizational or cultural adaptations

## Support

For questions about the translation system or implementation, contact the development team.
