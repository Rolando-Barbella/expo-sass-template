---
name: react-native-best-standards
description: Enforces React Native best coding standards, including TypeScript checks for all files, no use of type any, 2-space indentation, and Colors.light tokens in StyleSheet-based colors.
---

# React Native Best Coding Standards

Use this skill when creating or editing React Native code in this repo.

## TypeScript rules

- Prefer TypeScript for all source files; use `.ts`/`.tsx` where applicable.
- Avoid `any` in types, props, and state. Use explicit types or generics instead.
- Keep types close to usage (local type aliases or interfaces inside files) unless shared.

## Formatting

- Use 2-space indentation.
- Keep imports grouped and ordered: React/React Native, third-party, then local.
- Name component files using CamelCase (e.g. `GoogleSignInSheet.tsx`).
- Ensure there are no TypeScript warnings in any file.

## Styling

- All color values must come from `Colors.light` in `constants/theme.ts`.
- Do not use `useThemeColor`; set colors directly in `StyleSheet.create` (example: `backgroundColor: Colors.light.background`).
- Do not hardcode hex/rgb values in styles; reference `Colors.light` tokens instead.
