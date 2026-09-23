# Graph Report - SporMatch  (2026-08-19)

## Corpus Check
- 171 files · ~113,502 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 738 nodes · 2027 edges · 62 communities (29 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f8112e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SporMatch — Play Store Yayın Hazırlığı
- expo-router
- useAuth
- expo
- program/[id].tsx
- scripts
- tsconfig.json
- event/create.tsx
- dependencies
- SporMatch
- reset-project.js
- expo-image
- Spacing
- expo-symbols
- migrate.mjs
- css.d.ts
- AGENTS.md
- useColors
- displayName
- programs.tsx
- post/[id].tsx
- expo-image-picker
- @supabase/supabase-js
- expo-location
- expo-notifications
- useColors.ts
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
- screen.tsx
- constants/theme.ts
- react-native-svg
- react-native-url-polyfill
- react-native-web
- react-native-webview
- react-native-worklets
- user/[id].tsx
- @tanstack/react-query
- zustand
- events.tsx
- react-native-safe-area-context
- expo-linking
- SporMatch — Kullanım Şartları
- react-native-screens
- chats.tsx
- profile-view.tsx
- expo-device
- error-boundary.tsx
- expo-font
- expo-dev-client
- expo-splash-screen
- edit.tsx

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 143 edges
2. `useAuth()` - 55 edges
3. `Spacing` - 50 edges
4. `expo-router` - 43 edges
5. `displayName()` - 42 edges
6. `Screen()` - 35 edges
7. `supabase` - 30 edges
8. `Button()` - 21 edges
9. `Avatar()` - 19 edges
10. `useProfile()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `TabsLayout()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/hooks/useColors.ts
- `RequestRow()` --calls--> `displayName()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/lib/displayName.ts
- `ConversationRow()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/hooks/useColors.ts
- `NavCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts
- `ProgramCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (62 total, 33 thin omitted)

### Community 0 - "SporMatch — Play Store Yayın Hazırlığı"
Cohesion: 0.12
Nodes (15): 1a. Yeni Google (Gmail) hesabı aç, 1b. Play Console geliştirici kaydı, Adım 10 — Yayın stratejisi, Adım 1 — Google Play Console hesabı (SEN yapmalısın, ödeme + kimlik gerekiyor), Adım 2 — Gizlilik politikasını yayınlama (GitHub Pages), Adım 3 — Store listing metinleri (hazır, kopyala-yapıştır), Adım 4 — Grafik varlıklar, Adım 5 — İçerik derecelendirmesi (IARC anketi) — Play Console'da doldurulacak (+7 more)

### Community 2 - "useAuth"
Cohesion: 0.06
Nodes (56): CreateChallengeScreen(), RootNavigator(), ICON, NotificationRow(), NotificationsScreen(), styles, timeAgo(), LEVELS (+48 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, blockedPermissions, googleServicesFile, package (+30 more)

### Community 4 - "program/[id].tsx"
Cohesion: 0.06
Nodes (47): LEVELS, mapError(), OnboardingScreen(), styles, DURATIONS, GOALS, METRICS, styles (+39 more)

### Community 5 - "scripts"
Cohesion: 0.10
Nodes (19): devDependencies, pg, @types/react, typescript, main, name, private, scripts (+11 more)

### Community 6 - "tsconfig.json"
Cohesion: 0.18
Nodes (10): ./assets/*, expo/tsconfig.base, **/*.ts, **/*.tsx, compilerOptions, paths, strict, extends (+2 more)

### Community 7 - "event/create.tsx"
Cohesion: 0.06
Nodes (43): CAPACITIES, CreateEventScreen(), DAYS, FALLBACK, nextSlotIdx(), SLOTS, styles, EventDetailScreen() (+35 more)

### Community 8 - "dependencies"
Cohesion: 0.22
Nodes (9): expo, expo-constants, expo-glass-effect, @expo/vector-icons, dependencies, expo, expo-constants, expo-glass-effect (+1 more)

### Community 9 - "SporMatch"
Cohesion: 0.22
Nodes (8): Kalan: development build (push + gömülü harita), Kurulum, Proje yapısı, SporMatch, Teknoloji, Test, Veritabanı (migration), Özellikler

### Community 10 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 12 - "Spacing"
Cohesion: 0.17
Nodes (14): ReportsScreen(), styles, EmptyProps, Props, EmptyState(), styles, ErrorState(), styles (+6 more)

### Community 14 - "migrate.mjs"
Cohesion: 0.67
Nodes (3): here, main(), readDbUrl()

### Community 17 - "useColors"
Cohesion: 0.16
Nodes (16): FollowsScreen(), styles, TAB_OPTIONS, ReportRow(), SearchScreen(), styles, SavedCard(), Avatar() (+8 more)

### Community 18 - "displayName"
Cohesion: 0.19
Nodes (14): DiscoverCard(), PERIODS, ProgramsDiscoverScreen(), SORTS, styles, DiscoverScreen(), PostPreview(), ProgramPreview() (+6 more)

### Community 19 - "programs.tsx"
Cohesion: 0.14
Nodes (16): Mode, NavCard(), ProgramCard(), ProgramsScreen(), SEGMENT_OPTIONS, styles, IconButton(), Props (+8 more)

### Community 20 - "post/[id].tsx"
Cohesion: 0.24
Nodes (13): FeedScreen(), PostCard(), styles, CreatePostScreen(), CommentRow(), PostDetailScreen(), styles, Card() (+5 more)

### Community 25 - "useColors.ts"
Cohesion: 0.07
Nodes (28): expo-router, SignInScreen(), styles, SignUpScreen(), styles, ChallengeStackLayout(), ChatStackLayout(), EventStackLayout() (+20 more)

### Community 26 - "challenges.tsx"
Cohesion: 0.09
Nodes (26): ChallengeDetailScreen(), METRIC_LABEL, styles, ChallengeCard(), ChallengesScreen(), METRIC_LABEL, Scope, SEGMENT_OPTIONS (+18 more)

### Community 28 - "SporMatch — Gizlilik Politikası"
Cohesion: 0.15
Nodes (12): 10. Değişiklikler, 11. İletişim, 1. İşlediğimiz veriler, 2. Verileri ne için kullanıyoruz, 3. Hukuki dayanak (KVKK / GDPR), 4. Paylaşım, 5. Uluslararası aktarım, 6. Saklama ve silme (+4 more)

### Community 38 - "screen.tsx"
Cohesion: 0.18
Nodes (12): fmtDistance(), LEVEL, MatchScreen(), styles, Placeholder(), Props, styles, Props (+4 more)

### Community 39 - "constants/theme.ts"
Cohesion: 0.09
Nodes (25): LeaderboardScreen(), MEDAL, MyRankBanner(), Row(), SEGMENT_OPTIONS, styles, AlertHost(), buttonColor() (+17 more)

### Community 45 - "user/[id].tsx"
Cohesion: 0.24
Nodes (10): BlockedScreen(), styles, LEVEL_LABEL, PublicProfileScreen(), styles, ProfileView(), useSendChatRequest(), useBlockedUsers() (+2 more)

### Community 48 - "events.tsx"
Cohesion: 0.25
Nodes (7): CityCard(), Mode, SEGMENT_OPTIONS, styles, Fab(), Props, styles

### Community 52 - "SporMatch — Kullanım Şartları"
Cohesion: 0.18
Nodes (10): 1. Uygunluk, 2. Hesabın, 3. Kabul edilebilir kullanım, 4. Kullanıcı içeriği, 5. Eşleşme ve yüz yüze buluşma — ÖNEMLİ, 6. Sorumluluğun sınırlandırılması, 7. Fesih, 8. Uygulanacak hukuk (+2 more)

### Community 54 - "chats.tsx"
Cohesion: 0.26
Nodes (9): ChatsScreen(), ConversationRow(), RequestRow(), styles, Conversation, useConversations(), ChatRequest, SendRequestResult (+1 more)

### Community 57 - "profile-view.tsx"
Cohesion: 0.12
Nodes (19): BadgesScreen(), styles, Props, styles, level(), MONTHS, styles, WorkoutHeatmap() (+11 more)

### Community 62 - "error-boundary.tsx"
Cohesion: 0.20
Nodes (5): ErrorBoundary, Fallback(), Props, State, styles

### Community 72 - "edit.tsx"
Cohesion: 0.08
Nodes (38): cloneExercise(), ExerciseEditor(), move(), ProgramEditScreen(), styles, TYPE_LABELS, ProgramDetailScreen(), LogWorkoutScreen() (+30 more)

## Knowledge Gaps
- **285 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `useAuth`, `program/[id].tsx`, `screen.tsx`, `event/create.tsx`, `constants/theme.ts`, `edit.tsx`, `Spacing`, `user/[id].tsx`, `events.tsx`, `displayName`, `programs.tsx`, `post/[id].tsx`, `chats.tsx`, `useColors.ts`, `challenges.tsx`, `error-boundary.tsx`, `profile-view.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useColors.ts` to `useAuth`, `expo`, `program/[id].tsx`, `screen.tsx`, `event/create.tsx`, `constants/theme.ts`, `edit.tsx`, `Spacing`, `user/[id].tsx`, `events.tsx`, `useColors`, `displayName`, `programs.tsx`, `post/[id].tsx`, `chats.tsx`, `profile-view.tsx`, `challenges.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SporMatch — Play Store Yayın Hazırlığı` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.06111111111111111 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `program/[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059227921734531994 - nodes in this community are weakly interconnected._