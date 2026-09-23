# Graph Report - SporMatch  (2026-08-14)

## Corpus Check
- 167 files · ~110,040 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 711 nodes · 1830 edges · 71 communities (38 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f8112e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- line-chart.tsx
- expo-router
- edit.tsx
- expo
- constants/theme.ts
- scripts
- tsconfig.json
- match.tsx
- dependencies
- SporMatch
- reset-project.js
- feed.tsx
- animated-icon.tsx
- animated-icon.web.tsx
- migrate.mjs
- css.d.ts
- AGENTS.md
- user/[id].tsx
- expo-device
- expo-font
- event/create.tsx
- expo-image-picker
- profile-edit.tsx
- expo-location
- expo-notifications
- empty-state.tsx
- expo
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
- auth.tsx
- @tanstack/react-query
- zustand
- react-native-safe-area-context
- expo-linking
- SporMatch — Kullanım Şartları
- react-native-screens
- avatar.tsx
- useColors
- useAuth
- workout-heatmap.tsx
- challenge/[id].tsx
- expo-router
- program/[id].tsx
- moderation.ts
- index.tsx
- programs.tsx
- useProgramSocial.ts
- leaderboard.tsx
- loading.tsx
- expo-image
- notifications.tsx
- error-boundary.tsx
- expo-splash-screen

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 131 edges
2. `useAuth()` - 53 edges
3. `Spacing` - 51 edges
4. `expo-router` - 43 edges
5. `Screen()` - 34 edges
6. `supabase` - 29 edges
7. `Loading()` - 22 edges
8. `Avatar()` - 20 edges
9. `Button()` - 19 edges
10. `useSports()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `ConversationRow()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/hooks/useColors.ts
- `ProgramPreview()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/index.tsx → src/hooks/useColors.ts
- `PostPreview()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/index.tsx → src/hooks/useColors.ts
- `NavCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts
- `ProgramCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (71 total, 33 thin omitted)

### Community 0 - "line-chart.tsx"
Cohesion: 0.40
Nodes (5): ChartPoint, formatNum(), LineChart(), Props, styles

### Community 2 - "edit.tsx"
Cohesion: 0.22
Nodes (13): cloneExercise(), ExerciseEditor(), move(), ProgramEditScreen(), styles, TYPE_LABELS, Exercise, ExerciseField (+5 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, blockedPermissions, googleServicesFile, package (+30 more)

### Community 4 - "constants/theme.ts"
Cohesion: 0.08
Nodes (27): styles, ExternalLink(), Props, HintRowProps, styles, fmt(), PRESETS, RestTimer() (+19 more)

### Community 5 - "scripts"
Cohesion: 0.10
Nodes (19): devDependencies, pg, @types/react, typescript, main, name, private, scripts (+11 more)

### Community 6 - "tsconfig.json"
Cohesion: 0.18
Nodes (10): ./assets/*, expo/tsconfig.base, **/*.ts, **/*.tsx, compilerOptions, paths, strict, extends (+2 more)

### Community 7 - "match.tsx"
Cohesion: 0.17
Nodes (16): fmtDistance(), LEVEL, MatchScreen(), styles, MatchScreen(), RADII, styles, Type (+8 more)

### Community 8 - "dependencies"
Cohesion: 0.22
Nodes (9): expo-constants, expo-glass-effect, @expo/vector-icons, dependencies, expo-constants, expo-glass-effect, @expo/vector-icons, @supabase/supabase-js (+1 more)

### Community 9 - "SporMatch"
Cohesion: 0.22
Nodes (8): Kalan: development build (push + gömülü harita), Kurulum, Proje yapısı, SporMatch, Teknoloji, Test, Veritabanı (migration), Özellikler

### Community 10 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 11 - "feed.tsx"
Cohesion: 0.24
Nodes (10): FeedScreen(), PostCard(), styles, CreatePostScreen(), styles, FeedPost, useFeed(), useFeedActions() (+2 more)

### Community 12 - "animated-icon.tsx"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 13 - "animated-icon.web.tsx"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 14 - "migrate.mjs"
Cohesion: 0.67
Nodes (3): here, main(), readDbUrl()

### Community 17 - "user/[id].tsx"
Cohesion: 0.10
Nodes (29): BadgesScreen(), styles, LEVEL_LABEL, ProfileScreen(), styles, LEVEL_LABEL, PublicProfileScreen(), styles (+21 more)

### Community 20 - "event/create.tsx"
Cohesion: 0.07
Nodes (38): CAPACITIES, CreateEventScreen(), DAYS, FALLBACK, nextSlotIdx(), SLOTS, styles, EventDetailScreen() (+30 more)

### Community 22 - "profile-edit.tsx"
Cohesion: 0.15
Nodes (15): LEVELS, mapError(), OnboardingScreen(), styles, LEVELS, styles, AVAILABILITY_OPTIONS, GOAL_OPTIONS (+7 more)

### Community 25 - "empty-state.tsx"
Cohesion: 0.38
Nodes (5): FollowsScreen(), styles, EmptyState(), styles, useFollowList()

### Community 28 - "SporMatch — Gizlilik Politikası"
Cohesion: 0.15
Nodes (12): 10. Değişiklikler, 11. İletişim, 1. İşlediğimiz veriler, 2. Verileri ne için kullanıyoruz, 3. Hukuki dayanak (KVKK / GDPR), 4. Paylaşım, 5. Uluslararası aktarım, 6. Saklama ve silme (+4 more)

### Community 45 - "auth.tsx"
Cohesion: 0.23
Nodes (11): RootNavigator(), fetchProfile(), useProfile(), usePushNotifications(), AuthContext, AuthContextValue, AuthProvider(), registerForPushNotifications() (+3 more)

### Community 52 - "SporMatch — Kullanım Şartları"
Cohesion: 0.18
Nodes (10): 1. Uygunluk, 2. Hesabın, 3. Kabul edilebilir kullanım, 4. Kullanıcı içeriği, 5. Eşleşme ve yüz yüze buluşma — ÖNEMLİ, 6. Sorumluluğun sınırlandırılması, 7. Fesih, 8. Uygulanacak hukuk (+2 more)

### Community 54 - "avatar.tsx"
Cohesion: 0.20
Nodes (12): BlockedScreen(), styles, CommentRow(), CommentsSection(), styles, timeAgo(), Avatar(), Props (+4 more)

### Community 55 - "useColors"
Cohesion: 0.24
Nodes (8): ChallengeStackLayout(), ChatStackLayout(), EventStackLayout(), MatchStackLayout(), PostStackLayout(), ProgramLayout(), TabsLayout(), useColors()

### Community 56 - "useAuth"
Cohesion: 0.29
Nodes (11): ProfileEditScreen(), ProgramsScreen(), useComments(), cloneTemplate(), normalize(), ProgramInput, useMyPrograms(), useProgramMutations() (+3 more)

### Community 57 - "workout-heatmap.tsx"
Cohesion: 0.36
Nodes (7): level(), MONTHS, styles, WorkoutHeatmap(), ymd(), HeatDay, useHeatmap()

### Community 58 - "challenge/[id].tsx"
Cohesion: 0.13
Nodes (19): ChallengeDetailScreen(), METRIC_LABEL, styles, ChallengeCard(), ChallengesScreen(), METRIC_LABEL, Scope, STATUS_LABEL (+11 more)

### Community 59 - "expo-router"
Cohesion: 0.06
Nodes (41): expo-router, SignInScreen(), styles, SignUpScreen(), styles, CreateChallengeScreen(), DURATIONS, GOALS (+33 more)

### Community 60 - "program/[id].tsx"
Cohesion: 0.15
Nodes (18): NUMERIC, ProgramDetailScreen(), styles, LogWorkoutScreen(), today(), useProgram(), useProgramSocial(), usePublicProfile() (+10 more)

### Community 61 - "moderation.ts"
Cohesion: 0.60
Nodes (5): BANNED_EXACT, BANNED_ROOTS, hasBannedWords(), LONG_ROOTS, normalize()

### Community 62 - "index.tsx"
Cohesion: 0.13
Nodes (16): DiscoverCard(), PERIODS, ProgramsDiscoverScreen(), SORTS, styles, DiscoverScreen(), PostPreview(), ProgramPreview() (+8 more)

### Community 63 - "programs.tsx"
Cohesion: 0.11
Nodes (18): styles, Mode, NavCard(), ProgramCard(), SavedCard(), styles, LocationPickerModal(), Props (+10 more)

### Community 64 - "useProgramSocial.ts"
Cohesion: 0.60
Nodes (3): DiscoverProgram, ProgramSocial, ProgramTemplate

### Community 65 - "leaderboard.tsx"
Cohesion: 0.27
Nodes (8): LeaderboardScreen(), MEDAL, MyRankBanner(), styles, LeaderboardEntry, MyRank, useLeaderboard(), useMyLeaderboardRank()

### Community 66 - "loading.tsx"
Cohesion: 0.12
Nodes (18): Bubble(), ChatThreadScreen(), styles, SearchScreen(), styles, ChatsScreen(), ConversationRow(), styles (+10 more)

### Community 69 - "notifications.tsx"
Cohesion: 0.33
Nodes (7): ICON, NotificationRow(), NotificationsScreen(), styles, timeAgo(), AppNotification, useNotifications()

### Community 70 - "error-boundary.tsx"
Cohesion: 0.20
Nodes (5): ErrorBoundary, Fallback(), Props, State, styles

## Knowledge Gaps
- **263 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `line-chart.tsx`, `edit.tsx`, `constants/theme.ts`, `match.tsx`, `feed.tsx`, `user/[id].tsx`, `event/create.tsx`, `profile-edit.tsx`, `empty-state.tsx`, `avatar.tsx`, `useAuth`, `workout-heatmap.tsx`, `challenge/[id].tsx`, `expo-router`, `program/[id].tsx`, `index.tsx`, `programs.tsx`, `leaderboard.tsx`, `loading.tsx`, `notifications.tsx`, `error-boundary.tsx`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `edit.tsx`, `expo`, `constants/theme.ts`, `match.tsx`, `feed.tsx`, `user/[id].tsx`, `event/create.tsx`, `profile-edit.tsx`, `empty-state.tsx`, `auth.tsx`, `avatar.tsx`, `useColors`, `challenge/[id].tsx`, `program/[id].tsx`, `index.tsx`, `programs.tsx`, `leaderboard.tsx`, `loading.tsx`, `notifications.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _263 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `constants/theme.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0821256038647343 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `user/[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._