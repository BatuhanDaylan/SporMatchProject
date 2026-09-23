# Graph Report - SporMatch  (2026-08-13)

## Corpus Check
- 133 files · ~91,332 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 573 nodes · 1353 edges · 55 communities (22 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f8112e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- settings.tsx
- @supabase/supabase-js
- program/[id].tsx
- expo
- constants/theme.ts
- scripts
- tsconfig.json
- useMatch.ts
- dependencies
- SporMatch
- reset-project.js
- useColors
- animated-icon.tsx
- animated-icon.web.tsx
- migrate.mjs
- css.d.ts
- AGENTS.md
- useAuth
- expo-device
- expo-font
- rest-timer.tsx
- expo-image-picker
- profile-edit.tsx
- expo-location
- expo-notifications
- expo-image
- expo-splash-screen
- expo-status-bar
- SporMatch — Gizlilik Politikası
- expo-system-ui
- @expo/ui
- expo-web-browser
- react
- react-dom
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-reanimated
- expo-symbols
- expo-dev-client
- react-native-svg
- react-native-url-polyfill
- react-native-web
- react-native-webview
- react-native-worklets
- comments-section.tsx
- @tanstack/react-query
- zustand
- react-native-safe-area-context
- expo-linking
- SporMatch — Kullanım Şartları
- react-native-screens
- expo

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 93 edges
2. `useAuth()` - 46 edges
3. `Spacing` - 39 edges
4. `expo-router` - 31 edges
5. `Screen()` - 25 edges
6. `supabase` - 23 edges
7. `Loading()` - 16 edges
8. `expo` - 15 edges
9. `Avatar()` - 14 edges
10. `useSports()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `OnboardingScreen()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(auth)/onboarding.tsx → src/hooks/useColors.ts
- `SignInScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(auth)/sign-in.tsx → src/lib/auth.tsx
- `SignUpScreen()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(auth)/sign-up.tsx → src/hooks/useColors.ts
- `SignUpScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(auth)/sign-up.tsx → src/lib/auth.tsx
- `TabsLayout()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (55 total, 33 thin omitted)

### Community 0 - "settings.tsx"
Cohesion: 0.18
Nodes (11): SignUpScreen(), styles, styles, THEME_OPTIONS, PRIVACY_URL, TERMS_URL, mapAuthError(), ThemeMode (+3 more)

### Community 2 - "program/[id].tsx"
Cohesion: 0.06
Nodes (54): cloneExercise(), ExerciseEditor(), move(), ProgramEditScreen(), styles, TYPE_LABELS, NUMERIC, ProgramDetailScreen() (+46 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (36): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, googleServicesFile, package, permissions (+28 more)

### Community 4 - "constants/theme.ts"
Cohesion: 0.11
Nodes (19): styles, ExternalLink(), Props, HintRowProps, styles, styles, ThemedText(), ThemedTextProps (+11 more)

### Community 5 - "scripts"
Cohesion: 0.10
Nodes (19): devDependencies, pg, @types/react, typescript, main, name, private, scripts (+11 more)

### Community 6 - "tsconfig.json"
Cohesion: 0.18
Nodes (10): ./assets/*, expo/tsconfig.base, **/*.ts, **/*.tsx, compilerOptions, paths, strict, extends (+2 more)

### Community 7 - "useMatch.ts"
Cohesion: 0.22
Nodes (10): fmtDistance(), MatchScreen(), cancelMyActiveSession(), getCoords(), MatchPartner, StartResult, useIncomingMatchListener(), useMatchActions() (+2 more)

### Community 8 - "dependencies"
Cohesion: 0.22
Nodes (9): expo-constants, expo-glass-effect, expo-router, @expo/vector-icons, dependencies, expo-constants, expo-glass-effect, expo-router (+1 more)

### Community 9 - "SporMatch"
Cohesion: 0.22
Nodes (8): Kalan: development build (push + gömülü harita), Kurulum, Proje yapısı, SporMatch, Teknoloji, Test, Veritabanı (migration), Özellikler

### Community 10 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 11 - "useColors"
Cohesion: 0.05
Nodes (76): expo-router, SignInScreen(), styles, styles, Bubble(), ChatThreadScreen(), styles, ChatStackLayout() (+68 more)

### Community 12 - "animated-icon.tsx"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 13 - "animated-icon.web.tsx"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 14 - "migrate.mjs"
Cohesion: 0.67
Nodes (3): here, main(), readDbUrl()

### Community 17 - "useAuth"
Cohesion: 0.06
Nodes (60): LEVELS, mapError(), OnboardingScreen(), styles, BadgesScreen(), styles, BlockedScreen(), navTheme() (+52 more)

### Community 20 - "rest-timer.tsx"
Cohesion: 0.50
Nodes (4): fmt(), PRESETS, RestTimer(), styles

### Community 22 - "profile-edit.tsx"
Cohesion: 0.14
Nodes (13): LEVELS, styles, PickerField(), Props, styles, Props, styles, TextField() (+5 more)

### Community 28 - "SporMatch — Gizlilik Politikası"
Cohesion: 0.15
Nodes (12): 10. Değişiklikler, 11. İletişim, 1. İşlediğimiz veriler, 2. Verileri ne için kullanıyoruz, 3. Hukuki dayanak (KVKK / GDPR), 4. Paylaşım, 5. Uluslararası aktarım, 6. Saklama ve silme (+4 more)

### Community 45 - "comments-section.tsx"
Cohesion: 0.18
Nodes (15): CommentRow(), CommentsSection(), styles, timeAgo(), Conversation, Message, useMessages(), Comment (+7 more)

### Community 52 - "SporMatch — Kullanım Şartları"
Cohesion: 0.18
Nodes (10): 1. Uygunluk, 2. Hesabın, 3. Kabul edilebilir kullanım, 4. Kullanıcı içeriği, 5. Eşleşme ve yüz yüze buluşma — ÖNEMLİ, 6. Sorumluluğun sınırlandırılması, 7. Fesih, 8. Uygulanacak hukuk (+2 more)

## Knowledge Gaps
- **221 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `useColors` to `settings.tsx`, `program/[id].tsx`, `expo`, `constants/theme.ts`, `useAuth`, `profile-edit.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `useColors()` connect `useColors` to `settings.tsx`, `program/[id].tsx`, `useMatch.ts`, `comments-section.tsx`, `useAuth`, `rest-timer.tsx`, `profile-edit.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `program/[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06151062867480778 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `constants/theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10793650793650794 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._