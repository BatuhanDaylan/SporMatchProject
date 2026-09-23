# Graph Report - SporMatch  (2026-08-17)

## Corpus Check
- 166 files · ~113,505 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 719 nodes · 1986 edges · 61 communities (28 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f8112e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SporMatch — Play Store Yayın Hazırlığı
- expo-router
- program/[id].tsx
- expo
- match.tsx
- scripts
- tsconfig.json
- event/create.tsx
- dependencies
- SporMatch
- reset-project.js
- feed.tsx
- programs.tsx
- screen.tsx
- migrate.mjs
- css.d.ts
- AGENTS.md
- useColors.ts
- constants/theme.ts
- alert-host.tsx
- expo
- expo-image-picker
- @supabase/supabase-js
- expo-location
- expo-notifications
- Spacing
- challenges.tsx
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
- react-native-svg
- react-native-url-polyfill
- react-native-web
- react-native-webview
- react-native-worklets
- @tanstack/react-query
- zustand
- workout-heatmap.tsx
- react-native-safe-area-context
- expo-linking
- SporMatch — Kullanım Şartları
- react-native-screens
- event/[id].tsx
- useAuth
- useColors
- challenge/[id].tsx
- expo-device
- expo-font
- chats.tsx
- expo-image
- expo-splash-screen

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 143 edges
2. `useAuth()` - 55 edges
3. `Spacing` - 50 edges
4. `expo-router` - 43 edges
5. `displayName()` - 42 edges
6. `Screen()` - 35 edges
7. `supabase` - 30 edges
8. `Loading()` - 23 edges
9. `Avatar()` - 21 edges
10. `Button()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `RequestRow()` --calls--> `displayName()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/lib/displayName.ts
- `ConversationRow()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/hooks/useColors.ts
- `NavCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts
- `ProgramCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts
- `ChallengeCard()` --calls--> `shortDate()`  [EXTRACTED]
  src/app/challenges.tsx → src/lib/datetime.ts

## Import Cycles
- None detected.

## Communities (61 total, 33 thin omitted)

### Community 0 - "SporMatch — Play Store Yayın Hazırlığı"
Cohesion: 0.12
Nodes (15): 1a. Yeni Google (Gmail) hesabı aç, 1b. Play Console geliştirici kaydı, Adım 10 — Yayın stratejisi, Adım 1 — Google Play Console hesabı (SEN yapmalısın, ödeme + kimlik gerekiyor), Adım 2 — Gizlilik politikasını yayınlama (GitHub Pages), Adım 3 — Store listing metinleri (hazır, kopyala-yapıştır), Adım 4 — Grafik varlıklar, Adım 5 — İçerik derecelendirmesi (IARC anketi) — Play Console'da doldurulacak (+7 more)

### Community 2 - "program/[id].tsx"
Cohesion: 0.06
Nodes (49): cloneExercise(), ExerciseEditor(), move(), ProgramEditScreen(), styles, TYPE_LABELS, NUMERIC, ProgramDetailScreen() (+41 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, blockedPermissions, googleServicesFile, package (+30 more)

### Community 4 - "match.tsx"
Cohesion: 0.18
Nodes (16): fmtDistance(), LEVEL, MatchScreen(), styles, MatchScreen(), RADII, styles, cancelMyActiveSession() (+8 more)

### Community 5 - "scripts"
Cohesion: 0.10
Nodes (19): devDependencies, pg, @types/react, typescript, main, name, private, scripts (+11 more)

### Community 6 - "tsconfig.json"
Cohesion: 0.18
Nodes (10): ./assets/*, expo/tsconfig.base, **/*.ts, **/*.tsx, compilerOptions, paths, strict, extends (+2 more)

### Community 7 - "event/create.tsx"
Cohesion: 0.06
Nodes (42): CAPACITIES, CreateEventScreen(), DAYS, FALLBACK, nextSlotIdx(), SLOTS, styles, CityCard() (+34 more)

### Community 8 - "dependencies"
Cohesion: 0.22
Nodes (9): expo-constants, expo-dev-client, expo-glass-effect, @expo/vector-icons, dependencies, expo-constants, expo-dev-client, expo-glass-effect (+1 more)

### Community 9 - "SporMatch"
Cohesion: 0.22
Nodes (8): Kalan: development build (push + gömülü harita), Kurulum, Proje yapısı, SporMatch, Teknoloji, Test, Veritabanı (migration), Özellikler

### Community 10 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 11 - "feed.tsx"
Cohesion: 0.12
Nodes (25): FeedScreen(), PostCard(), styles, CreatePostScreen(), styles, CommentRow(), PostDetailScreen(), styles (+17 more)

### Community 12 - "programs.tsx"
Cohesion: 0.18
Nodes (12): Mode, NavCard(), ProgramCard(), ProgramsScreen(), SavedCard(), SEGMENT_OPTIONS, styles, Card() (+4 more)

### Community 13 - "screen.tsx"
Cohesion: 0.07
Nodes (31): SignInScreen(), styles, SignUpScreen(), styles, DURATIONS, GOALS, METRICS, styles (+23 more)

### Community 14 - "migrate.mjs"
Cohesion: 0.67
Nodes (3): here, main(), readDbUrl()

### Community 17 - "useColors.ts"
Cohesion: 0.19
Nodes (8): navTheme(), RootLayout(), ErrorBoundary, Colors, queryClient, ThemeState, useResolvedScheme(), useThemeStore

### Community 18 - "constants/theme.ts"
Cohesion: 0.14
Nodes (14): Fallback(), Props, State, styles, LocationPickerModal(), Props, styles, Button() (+6 more)

### Community 19 - "alert-host.tsx"
Cohesion: 0.47
Nodes (5): AlertHost(), buttonColor(), styles, Type, useAlertStore

### Community 25 - "Spacing"
Cohesion: 0.05
Nodes (68): BlockedScreen(), styles, Bubble(), ChatThreadScreen(), styles, FollowsScreen(), styles, LeaderboardScreen() (+60 more)

### Community 26 - "challenges.tsx"
Cohesion: 0.13
Nodes (15): ChallengeCard(), ChallengesScreen(), METRIC_LABEL, Scope, SEGMENT_OPTIONS, STATUS_LABEL, styles, Fab() (+7 more)

### Community 28 - "SporMatch — Gizlilik Politikası"
Cohesion: 0.15
Nodes (12): 10. Değişiklikler, 11. İletişim, 1. İşlediğimiz veriler, 2. Verileri ne için kullanıyoruz, 3. Hukuki dayanak (KVKK / GDPR), 4. Paylaşım, 5. Uluslararası aktarım, 6. Saklama ve silme (+4 more)

### Community 48 - "workout-heatmap.tsx"
Cohesion: 0.36
Nodes (7): level(), MONTHS, styles, WorkoutHeatmap(), ymd(), HeatDay, useHeatmap()

### Community 52 - "SporMatch — Kullanım Şartları"
Cohesion: 0.18
Nodes (10): 1. Uygunluk, 2. Hesabın, 3. Kabul edilebilir kullanım, 4. Kullanıcı içeriği, 5. Eşleşme ve yüz yüze buluşma — ÖNEMLİ, 6. Sorumluluğun sınırlandırılması, 7. Fesih, 8. Uygulanacak hukuk (+2 more)

### Community 54 - "event/[id].tsx"
Cohesion: 0.23
Nodes (9): EventDetailScreen(), styles, MapView(), Props, styles, ErrorState(), styles, useEventActions() (+1 more)

### Community 57 - "useAuth"
Cohesion: 0.07
Nodes (55): LEVELS, mapError(), OnboardingScreen(), styles, BadgesScreen(), styles, CreateChallengeScreen(), RootNavigator() (+47 more)

### Community 58 - "useColors"
Cohesion: 0.20
Nodes (9): expo-router, ChallengeStackLayout(), ChatStackLayout(), EventStackLayout(), MatchStackLayout(), PostStackLayout(), ProgramLayout(), TabsLayout() (+1 more)

### Community 59 - "challenge/[id].tsx"
Cohesion: 0.23
Nodes (9): ChallengeDetailScreen(), METRIC_LABEL, styles, MetaRow(), Props, styles, ProgressBar(), useChallengeActions() (+1 more)

### Community 66 - "chats.tsx"
Cohesion: 0.23
Nodes (10): ChatsScreen(), ConversationRow(), RequestRow(), styles, Conversation, Message, useConversations(), ChatRequest (+2 more)

## Knowledge Gaps
- **277 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+272 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `program/[id].tsx`, `chats.tsx`, `match.tsx`, `event/create.tsx`, `feed.tsx`, `programs.tsx`, `screen.tsx`, `workout-heatmap.tsx`, `useColors.ts`, `constants/theme.ts`, `alert-host.tsx`, `event/[id].tsx`, `useAuth`, `challenges.tsx`, `challenge/[id].tsx`, `Spacing`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useColors` to `program/[id].tsx`, `expo`, `match.tsx`, `chats.tsx`, `event/create.tsx`, `feed.tsx`, `programs.tsx`, `screen.tsx`, `useColors.ts`, `event/[id].tsx`, `useAuth`, `challenges.tsx`, `challenge/[id].tsx`, `Spacing`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _277 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SporMatch — Play Store Yayın Hazırlığı` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `program/[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06370543541788427 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._