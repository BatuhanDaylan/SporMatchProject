# Graph Report - SporMatch  (2026-08-18)

## Corpus Check
- 170 files · ~113,399 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 732 nodes · 2006 edges · 74 communities (41 shown, 33 thin omitted)
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
- match.tsx
- scripts
- tsconfig.json
- event/create.tsx
- dependencies
- SporMatch
- reset-project.js
- post/[id].tsx
- displayName
- expo-symbols
- migrate.mjs
- css.d.ts
- AGENTS.md
- comments-section.tsx
- events.tsx
- programs.tsx
- programs-discover.tsx
- expo-image-picker
- @supabase/supabase-js
- expo-location
- expo-notifications
- settings.tsx
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
- useEvents.ts
- leaderboard.tsx
- react-native-svg
- react-native-url-polyfill
- react-native-web
- react-native-webview
- react-native-worklets
- Spacing
- @tanstack/react-query
- zustand
- workout-heatmap.tsx
- react-native-safe-area-context
- expo-linking
- SporMatch — Kullanım Şartları
- react-native-screens
- chats.tsx
- constants/theme.ts
- challenge/[id].tsx
- user/[id].tsx
- useColors
- event/[id].tsx
- expo-device
- useColors.ts
- error-boundary.tsx
- expo-font
- expo-dev-client
- challenge/create.tsx
- sign-in.tsx
- search.tsx
- datetime.ts
- line-chart.tsx
- follows.tsx
- expo-splash-screen
- rest-timer.tsx
- expo

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 144 edges
2. `useAuth()` - 55 edges
3. `Spacing` - 50 edges
4. `expo-router` - 43 edges
5. `displayName()` - 42 edges
6. `Screen()` - 35 edges
7. `supabase` - 30 edges
8. `Avatar()` - 19 edges
9. `Button()` - 19 edges
10. `useProfile()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `RequestRow()` --calls--> `displayName()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/lib/displayName.ts
- `ConversationRow()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/chats.tsx → src/hooks/useColors.ts
- `NavCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts
- `ProgramCard()` --calls--> `useColors()`  [EXTRACTED]
  src/app/(tabs)/programs.tsx → src/hooks/useColors.ts
- `Bubble()` --calls--> `useColors()`  [EXTRACTED]
  src/app/chat/[id].tsx → src/hooks/useColors.ts

## Import Cycles
- None detected.

## Communities (74 total, 33 thin omitted)

### Community 0 - "SporMatch — Play Store Yayın Hazırlığı"
Cohesion: 0.12
Nodes (15): 1a. Yeni Google (Gmail) hesabı aç, 1b. Play Console geliştirici kaydı, Adım 10 — Yayın stratejisi, Adım 1 — Google Play Console hesabı (SEN yapmalısın, ödeme + kimlik gerekiyor), Adım 2 — Gizlilik politikasını yayınlama (GitHub Pages), Adım 3 — Store listing metinleri (hazır, kopyala-yapıştır), Adım 4 — Grafik varlıklar, Adım 5 — İçerik derecelendirmesi (IARC anketi) — Play Console'da doldurulacak (+7 more)

### Community 2 - "useAuth"
Cohesion: 0.05
Nodes (73): LEVELS, mapError(), OnboardingScreen(), styles, RootNavigator(), LEVELS, ProfileEditScreen(), styles (+65 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, blockedPermissions, googleServicesFile, package (+30 more)

### Community 4 - "match.tsx"
Cohesion: 0.10
Nodes (26): fmtDistance(), LEVEL, MatchScreen(), styles, MatchScreen(), RADII, styles, MapView() (+18 more)

### Community 5 - "scripts"
Cohesion: 0.10
Nodes (19): devDependencies, pg, @types/react, typescript, main, name, private, scripts (+11 more)

### Community 6 - "tsconfig.json"
Cohesion: 0.18
Nodes (10): ./assets/*, expo/tsconfig.base, **/*.ts, **/*.tsx, compilerOptions, paths, strict, extends (+2 more)

### Community 7 - "event/create.tsx"
Cohesion: 0.19
Nodes (11): CAPACITIES, DAYS, FALLBACK, nextSlotIdx(), SLOTS, styles, PickerField(), Props (+3 more)

### Community 8 - "dependencies"
Cohesion: 0.22
Nodes (9): expo-constants, expo-glass-effect, expo-image, @expo/vector-icons, dependencies, expo-constants, expo-glass-effect, expo-image (+1 more)

### Community 9 - "SporMatch"
Cohesion: 0.22
Nodes (8): Kalan: development build (push + gömülü harita), Kurulum, Proje yapısı, SporMatch, Teknoloji, Test, Veritabanı (migration), Özellikler

### Community 10 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 11 - "post/[id].tsx"
Cohesion: 0.19
Nodes (15): CreatePostScreen(), styles, PostDetailScreen(), styles, useFeedActions(), usePostDetail(), PostComment, usePostComments() (+7 more)

### Community 12 - "displayName"
Cohesion: 0.19
Nodes (15): FeedScreen(), PostCard(), styles, CommentRow(), DiscoverScreen(), PostPreview(), ProgramPreview(), styles (+7 more)

### Community 14 - "migrate.mjs"
Cohesion: 0.67
Nodes (3): here, main(), readDbUrl()

### Community 17 - "comments-section.tsx"
Cohesion: 0.16
Nodes (15): BlockedScreen(), styles, CommentRow(), CommentsSection(), styles, timeAgo(), Avatar(), Props (+7 more)

### Community 18 - "events.tsx"
Cohesion: 0.17
Nodes (12): EventsScreen(), MineCard(), Mode, SEGMENT_OPTIONS, styles, Badge(), Props, Fab() (+4 more)

### Community 19 - "programs.tsx"
Cohesion: 0.16
Nodes (13): Mode, NavCard(), ProgramCard(), ProgramsScreen(), SEGMENT_OPTIONS, styles, Option, Props (+5 more)

### Community 20 - "programs-discover.tsx"
Cohesion: 0.20
Nodes (11): DiscoverCard(), PERIODS, ProgramsDiscoverScreen(), SORTS, styles, Card(), Props, styles (+3 more)

### Community 25 - "settings.tsx"
Cohesion: 0.22
Nodes (9): SignUpScreen(), styles, SettingsScreen(), styles, THEME_OPTIONS, PRIVACY_URL, TERMS_URL, ThemeMode (+1 more)

### Community 26 - "challenges.tsx"
Cohesion: 0.19
Nodes (11): ChallengeCard(), ChallengesScreen(), METRIC_LABEL, Scope, SEGMENT_OPTIONS, STATUS_LABEL, styles, ProgressBar() (+3 more)

### Community 28 - "SporMatch — Gizlilik Politikası"
Cohesion: 0.15
Nodes (12): 10. Değişiklikler, 11. İletişim, 1. İşlediğimiz veriler, 2. Verileri ne için kullanıyoruz, 3. Hukuki dayanak (KVKK / GDPR), 4. Paylaşım, 5. Uluslararası aktarım, 6. Saklama ve silme (+4 more)

### Community 38 - "useEvents.ts"
Cohesion: 0.20
Nodes (11): CreateEventScreen(), CityEvent, CreateEventInput, EventDetail, getCoords(), MiniProfile, MiniSport, MyEvent (+3 more)

### Community 39 - "leaderboard.tsx"
Cohesion: 0.24
Nodes (10): LeaderboardScreen(), MEDAL, MyRankBanner(), Row(), SEGMENT_OPTIONS, styles, LeaderboardEntry, MyRank (+2 more)

### Community 45 - "Spacing"
Cohesion: 0.23
Nodes (9): LocationPickerModal(), Props, styles, Button(), Props, styles, styles, Elevation (+1 more)

### Community 48 - "workout-heatmap.tsx"
Cohesion: 0.36
Nodes (7): level(), MONTHS, styles, WorkoutHeatmap(), ymd(), HeatDay, useHeatmap()

### Community 52 - "SporMatch — Kullanım Şartları"
Cohesion: 0.18
Nodes (10): 1. Uygunluk, 2. Hesabın, 3. Kabul edilebilir kullanım, 4. Kullanıcı içeriği, 5. Eşleşme ve yüz yüze buluşma — ÖNEMLİ, 6. Sorumluluğun sınırlandırılması, 7. Fesih, 8. Uygulanacak hukuk (+2 more)

### Community 54 - "chats.tsx"
Cohesion: 0.09
Nodes (28): Bubble(), ChatThreadScreen(), styles, ReportRow(), ReportsScreen(), styles, ChatsScreen(), ConversationRow() (+20 more)

### Community 55 - "constants/theme.ts"
Cohesion: 0.20
Nodes (9): Placeholder(), Props, styles, Props, styles, BottomTabInset, Fonts, MaxContentWidth (+1 more)

### Community 56 - "challenge/[id].tsx"
Cohesion: 0.25
Nodes (9): ChallengeDetailScreen(), METRIC_LABEL, styles, ChallengeDetail, ChallengeLeader, ChallengeStatus, CreateChallengeInput, useChallengeActions() (+1 more)

### Community 57 - "user/[id].tsx"
Cohesion: 0.09
Nodes (34): BadgesScreen(), styles, ICON, NotificationRow(), NotificationsScreen(), styles, timeAgo(), LEVEL_LABEL (+26 more)

### Community 58 - "useColors"
Cohesion: 0.18
Nodes (10): expo-router, SignInScreen(), ChallengeStackLayout(), ChatStackLayout(), EventStackLayout(), MatchStackLayout(), PostStackLayout(), ProgramLayout() (+2 more)

### Community 59 - "event/[id].tsx"
Cohesion: 0.25
Nodes (9): EventDetailScreen(), styles, CityCard(), MetaRow(), Props, styles, useEventActions(), useEventDetail() (+1 more)

### Community 61 - "useColors.ts"
Cohesion: 0.36
Nodes (6): navTheme(), RootLayout(), Colors, queryClient, ThemeState, useResolvedScheme()

### Community 62 - "error-boundary.tsx"
Cohesion: 0.20
Nodes (5): ErrorBoundary, Fallback(), Props, State, styles

### Community 65 - "challenge/create.tsx"
Cohesion: 0.25
Nodes (7): CreateChallengeScreen(), DURATIONS, GOALS, METRICS, styles, ChallengeMetric, useCreateChallenge()

### Community 66 - "sign-in.tsx"
Cohesion: 0.32
Nodes (5): styles, Props, styles, TextField(), mapAuthError()

### Community 67 - "search.tsx"
Cohesion: 0.38
Nodes (5): SearchScreen(), styles, SearchProgram, SearchUser, useSearch()

### Community 68 - "datetime.ts"
Cohesion: 0.29
Nodes (5): DAYS, hhmm(), MONTHS, nextDays(), timeSlots()

### Community 69 - "line-chart.tsx"
Cohesion: 0.40
Nodes (5): ChartPoint, formatNum(), LineChart(), Props, styles

### Community 70 - "follows.tsx"
Cohesion: 0.50
Nodes (4): FollowsScreen(), styles, TAB_OPTIONS, useFollowList()

### Community 72 - "rest-timer.tsx"
Cohesion: 0.50
Nodes (4): fmt(), PRESETS, RestTimer(), styles

## Knowledge Gaps
- **282 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+277 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useColors()` connect `useColors` to `useAuth`, `match.tsx`, `event/create.tsx`, `post/[id].tsx`, `displayName`, `comments-section.tsx`, `events.tsx`, `programs.tsx`, `programs-discover.tsx`, `settings.tsx`, `challenges.tsx`, `useEvents.ts`, `leaderboard.tsx`, `Spacing`, `workout-heatmap.tsx`, `chats.tsx`, `constants/theme.ts`, `challenge/[id].tsx`, `user/[id].tsx`, `event/[id].tsx`, `useColors.ts`, `error-boundary.tsx`, `challenge/create.tsx`, `sign-in.tsx`, `search.tsx`, `line-chart.tsx`, `follows.tsx`, `rest-timer.tsx`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `expo-router` connect `useColors` to `useAuth`, `expo`, `match.tsx`, `event/create.tsx`, `post/[id].tsx`, `displayName`, `comments-section.tsx`, `events.tsx`, `programs.tsx`, `programs-discover.tsx`, `settings.tsx`, `challenges.tsx`, `leaderboard.tsx`, `chats.tsx`, `challenge/[id].tsx`, `user/[id].tsx`, `event/[id].tsx`, `useColors.ts`, `challenge/create.tsx`, `sign-in.tsx`, `search.tsx`, `follows.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _282 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SporMatch — Play Store Yayın Hazırlığı` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05171717171717172 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `match.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._