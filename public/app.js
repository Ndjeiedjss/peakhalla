const $ = (selector) => document.querySelector(selector);

const translations = {
  en: {
    navLeaderboard: 'Ranked', navQueue: 'Queue', navArena: 'Arena Wall', rankedSolo: 'Solo ranked search', rankedDoubles: 'Team ranked search', rankedThrees: '3-player team search', queueSolo: 'Find solo players', queueDoubles: 'Find a ranked partner', queueThrees: 'Build a 3-player team', queueSoloLive: 'Solo ranked activity', queueDoublesLive: 'Team ranked activity', queueThreesLive: '3-player ranked activity', navDiscord: 'Join Discord', discordAria: 'Join the PeakHalla Discord server', navClans: 'Clans', navEsports: 'Esports', powerRankingNavNote: 'Official regional player rankings', tournamentsNav: 'Tournaments', tournamentsNavNote: 'Official and community events', navAbout: 'About', navDonation: 'Donation', liveData: 'LIVE DATA',
    heroTitle: 'Brawlhalla Tracker.<br><em>Live stats, ELO & rankings.</em>', heroText: 'PeakHalla is a fast, free Brawlhalla tracker for live player stats, current and peak ELO, legends, clans, 2v2 teams, and competitive rankings.',
    seoTitle: 'Free Brawlhalla tracker for player stats, ELO and rankings', seoIntro: 'Search any known Brawlhalla player by current name, old name, or Brawlhalla ID. PeakHalla combines live ranked data, lifetime account progression, legend performance, clans, 2v2 teammates, leaderboards, and esports rankings in one place.', seoPlayerTitle: 'Live player statistics', seoPlayerText: 'View current ELO, season peak, ranked tier, wins, losses, account XP, legend levels, match time, weapons, and lifetime combat data.', seoSearchTitle: 'Current and previous names', seoSearchText: 'Find profiles using a current name, a known old name, or a Brawlhalla ID without needing the player to be currently ranked.', seoRankingsTitle: 'Rankings, clans and esports', seoRankingsText: 'Browse regional ranked leaderboards, top clans by lifetime XP, clan rosters, 2v2 teammates, esports power rankings, and tournaments.', seoSearchLink: 'Search a player', seoRankedLink: 'Ranked leaderboards', seoClansLink: 'Brawlhalla clans', seoEsportsLink: 'Brawlhalla esports', seoFaqTitle: 'Brawlhalla tracker questions', seoFaqQ1: 'How do I track a Brawlhalla player?', seoFaqA1: 'Enter the player’s current name, previous name, or Brawlhalla ID in the search box. PeakHalla opens the matching profile and refreshes official data automatically.', seoFaqQ2: 'Does PeakHalla show current and peak ELO?', seoFaqA2: 'Yes. Player profiles show current ELO, season peak ELO, ranked tier, regional rank, wins, losses, and ranked legend performance when available.', seoFaqQ3: 'Can I search by an old Brawlhalla name?', seoFaqA3: 'Yes. PeakHalla searches known aliases as well as current names and Brawlhalla IDs.', seoFaqQ4: 'Can I view clans and ranked 2v2 teammates?', seoFaqA4: 'Yes. PeakHalla includes clan profiles and rosters, lifetime clan XP, and current-season ranked 2v2 teammates when official data is available.',
    mainLegendFeature: 'Main legend', aliasFeature: 'Name history', boardsFeature: 'All regions', esportsFeature: 'Esports power rankings', findPlayer: 'Find a player',
    playerName: 'Player name, old name, or BH ID', playerPlaceholder: 'Sandstorm', region: 'Region', gameMode: 'Mode', searchButton: 'Search player',
    searchNote: 'Searches player profiles directly by current name, old name, or BH ID across all regions.', searchResults: 'Search results', playerIdLabel: 'BH ID', updatedLabel: 'Updated', currentRank: 'Current rank',
    eloProgress: 'Elo progress', last120: '120 days', firstSnapshot: 'First snapshot saved. The chart grows when the tracker sees this account again.',
    playerSummary: 'Player summary', knownNames: 'Known names', knownNamesNote: 'Previous names are loaded automatically from the fresh Corehalla alias history whenever the player page opens.',
    bestLegends: 'Ranked legends', legend: 'Legend', weapons: 'Weapons', games: 'Games', wins: 'Wins', winRate: 'Win rate', peak: 'Peak', refresh: 'Refresh',
    aboutTitle: 'Built like a real stats site.', aboutText: 'Official ranked data, main legends based on lifetime games, daily Elo snapshots, and a competitive section for esports fans.',
    madeBy: 'Made by <strong>Nad</strong>', followText: 'Brawlhalla clips and tracker updates.', disclaimer: 'Unofficial community project. Not affiliated with Ubisoft or Blue Mammoth Games.', footerMade: 'Made by', footerTagline: 'Brawlhalla statistics', rightsReserved: 'All rights reserved.',
    searching: 'Searching all known player profiles…', loadingPlayer: 'Loading player profile…', fetchError: 'Could not load the data right now.',
    noSearchResults: 'No profile matched that name yet. Check the spelling or search by BH ID.', oldNameMatch: 'Old name match', result: 'result', results: 'results', seasonalPeak: 'Season peak', currentElo: 'Current ELO', peakElo: 'Peak ELO', rankedOverview: 'Ranked overview', offPeak: 'off peak', atPeak: 'at season peak', globalRank: 'Global rank', rankedGames: 'Ranked games', rankedWins: 'Ranked wins',
    accountLevel: 'Account level', accountXP: 'Account XP', xpProgress: 'XP progress', gameTime: 'Online match time', mainWeapons: 'Main weapons', topLegends: 'Main legends', regionRank: 'Region rank', totalGames: 'Total games', totalWins: 'Total wins', overallWinRate: 'Overall win rate', liveOfficialData: 'Live player data', corehallaStats: 'Corehalla-compatible stats', currentAlias: 'Current name', previousAliases: 'Previous names', refreshLiveStats: 'Refresh live stats', refreshingLiveStats: 'Refreshing official stats…', notReported: 'Not reported by API', statsAccuracyNote: 'Account XP and legend levels are checked against fresh Brawlhalla and Corehalla data. PeakHalla keeps the highest reported progression value so older data cannot replace newer levels.', legendLevelLimit: 'Some legend XP and levels may be unavailable if that legend has not been played since Patch 9.07.',
    fullPlayerStats: 'Full player stats', officialLifetimeData: 'Official lifetime data', allLegendStats: 'Every legend · lifetime stats', searchLegends: 'Search legends', legendSearchPlaceholder: 'Legend or weapon', show: 'Show', playedOnly: 'Played only', allLegends: 'All legends', sortBy: 'Sort by', level: 'Level', xp: 'XP', losses: 'Losses', damageDealt: 'Damage dealt', damageTaken: 'Damage taken', kos: 'KOs', falls: 'Falls', kdRatio: 'K/D ratio', damageRatio: 'Damage ratio', suicides: 'Suicides', teamKOs: 'Team KOs', unarmedDamage: 'Unarmed damage', thrownDamage: 'Thrown-item damage', gadgetDamage: 'Gadget damage', gadgetKOs: 'Gadget KOs', unarmedKOs: 'Unarmed KOs', bombDamage: 'Bomb damage', mineDamage: 'Mine damage', spikeballDamage: 'Spikeball damage', sidekickDamage: 'Sidekick damage', snowballHits: 'Snowball hits', bombKOs: 'Bomb KOs', mineKOs: 'Mine KOs', sidekickKOs: 'Sidekick KOs', snowballKOs: 'Snowball KOs', spikeballKOs: 'Spikeball KOs', matchTime: 'Match time', seasonRanked: 'Current season ranked', lifetimeCombat: 'Lifetime combat', weaponBreakdown: 'Weapon breakdown', noLifetimeStats: 'No legends matched these filters.', legendsTotal: 'legends', playedLegends: 'played',
    legendUsed: 'legend used', legendsUsed: 'legends used', noRankedLegends: 'No ranked legend games found.', nameSeen: 'name recorded', namesSeen: 'names recorded', currentName: 'Current', previousName: 'Previous',
    firstSeen: 'First seen', lastSeen: 'Last seen', formerly: 'Formerly', aliasMatch: 'Old-name match', main: 'Main', unknownLegend: 'Main unknown',
    leaderboardPrefix: 'Top players ·', leaderboardSearch: 'Find a rank', leaderboardSearchPlaceholder: 'Search a player', leaderboardSearchTitle: 'Ranking search', emptyData: 'No data available right now.', allRegions: 'All regions', loadMorePlayers: 'Load next 20 players', loadingMorePlayers: 'Loading 20 more…', playersShown: 'players shown',
    clansTitle: 'Top clans by lifetime XP', clansText: 'Browse the highest-XP Brawlhalla clans, then open a dedicated roster page for every clan.', clanSearch: 'Find a clan', clanSearchPlaceholder: 'Clan name or guild ID', clanRank: 'XP rank', clanTier: 'Tier', clanMembers: 'Members', clanPoints: 'Weekly points', clanXp: 'Lifetime XP', clanRecruiting: 'Recruiting', clanClosed: 'Closed', clanOpen: 'Open clan', clanDetails: 'Clan profile', clanRoster: 'Clan roster', clanRole: 'Role', clanJoined: 'Joined', clanMemberXp: 'Member XP', clanNoData: 'No clan data is available right now. Refresh in a moment.', clanLoading: 'Loading top clans by XP…', clanUpdated: 'Updated', clanDiscoveryNote: 'Top clans are ordered by lifetime XP.', clanView: 'View clan', clanBack: 'Back to clans', clanRoleOrder: 'Role hierarchy', clanRecruit: 'Recruit', clanMember: 'Member', clanOfficer: 'Officer', clanLeader: 'Leader', clanProfileNote: 'Members are ordered from Recruit to Leader.', playerClan: 'PLAYER CLAN', viewClanProfile: 'Open clan profile', noClan: 'No clan',
    MiddleEast: 'Middle East', Europe: 'Europe', USEast: 'US East', USWest: 'US West', SouthernAfrica: 'Southern Africa', SoutheastAsia: 'Southeast Asia', Brazil: 'Brazil', Australia: 'Australia', Japan: 'Japan',
    esportsHubTitle: 'PeakHalla Esports', esportsHubText: 'Official power rankings and a live tournament directory for Brawlhalla esports.', esportsTitle: 'Esports power rankings', esportsText: 'Official competitive names, medals, earnings, and major tournament results.', powerRanking: 'Power rankings', player: 'Player', earnings: 'Earnings', tournamentDirectory: 'Tournament directory', tournamentDirectoryText: 'New Brawlhalla tournament announcements are checked automatically and added here.', liveTournamentFeed: 'LIVE TOURNAMENT FEED', autoUpdating: 'AUTO UPDATING', officialTournaments: 'Official tournaments', communityTournaments: 'Community tournaments', tournamentRegion: 'Tournament region', tournamentMode: 'Tournament mode', allTournamentModes: 'All modes', loadingTournaments: 'Loading tournaments…', noTournaments: 'No tournaments matched these filters yet.', tournamentEvents: 'events', tournamentSource: 'Open tournament', announced: 'Announced',
    officialSource: 'Open official rankings ↗', tournamentList: 'Tournament list', proWinners: 'Pro players & major titles', notExhaustive: 'Featured titles, not a complete career list',
    rankingsUpdated: 'Updated', noPowerData: 'No official ranking data came back right now. Try Refresh in a moment.', powerSearch: 'Find a player', powerSearchPlaceholder: 'Search the power ranking', loadMorePowerPlayers: 'Load 20 more players', loadingMorePowerPlayers: 'Loading 20 more…', powerPlayersShown: 'players shown', powerSearchResults: 'ranking results', title: 'title', titles: 'titles',
    viewCareer: 'View tournament career', tournamentCareer: 'TOURNAMENT CAREER', loadingCareer: 'Loading tournament history…',
    allModes: 'All', top8Only: 'Top 8', careerEvents: 'Events', careerTitles: 'Titles', careerPodiums: 'Podiums', careerTop8: 'Top 8', bestFinish: 'Best finish',
    noPlacements: 'No official tournament placements were found for this player yet.', careerSource: 'Tournament data source ↗', officialEventsOnly: 'Official events only',
    onlineEvent: 'Online', offlineEvent: 'LAN', playerCareerNotFound: 'No tournament profile was found for this player.', placementLabel: 'Placement',
    twoVTwoPartners: 'Ranked 2v2 teammates', twoVTwoPartnersNote: 'Official current-season teams from the player teams endpoint.', teammateElo: 'Player ELO', teamElo: 'Team ELO', noTeammates: 'No current-season 2v2 teammate was found for this account.', loadingTeammates: 'Loading 2v2 teammates…', backToTracker: 'Back to tracker', queueLiveTracking: 'LIVE ACTIVITY TRACKING', queueEyebrowLive: 'RANKED ACTIVITY', queueTitleLive: 'Who is playing ranked right now?', queueIntroLive: 'Tracks the top 500 leaderboard entries and shows players whose ranked games changed during the last 10 minutes.', queueActiveNow: 'ACTIVE NOW', queueDisclaimerLive: "Activity means leaderboard stats changed recently. It cannot see Brawlhalla's private matchmaking screen.", queueWarming: 'Building the first leaderboard snapshot. Active players appear after the next scan.', queueNoActivity: 'No ranked activity was detected in the top 500 during the last 10 minutes.', queueTrackedTop: 'Top entries tracked', queueLastScan: 'Last scan', queueNextScan: 'Next scan', queueGameDetected: 'game detected', queueGamesDetected: 'games detected', queueEloChange: 'ELO change', queueWatching: 'Watching the leaderboard live', queueError: 'Could not refresh live activity right now.',
    arenaCommunity: 'COMMUNITY SCREENSHOTS', arenaEyebrow: 'COMMUNITY', arenaTitle: 'Arena Wall', arenaIntro: 'Share Brawlhalla screenshots, add a caption, and talk with other players through comments and replies.', arenaWhat: 'What is Arena Wall?', arenaWhatText: 'A community gallery for match screenshots, rank moments, funny clips captured as images, tournament results, and anything worth sharing from Brawlhalla. Create an account using only a username and password—no email or verification code.', arenaCreateAccount: 'Create account', arenaSignIn: 'Sign in', arenaNoEmail: 'NO EMAIL NEEDED', arenaJoinTitle: 'Join the wall', arenaJoinText: 'Choose a username and password. No email, verification code, or social login.', arenaUsername: 'Username', arenaPassword: 'Password', arenaPostingAs: 'Posting as', arenaLogout: 'Log out', arenaChooseScreenshot: 'Choose a screenshot', arenaImageLimit: 'PNG, JPG, or WebP · up to 5 MB', arenaCaption: 'Caption', arenaCaptionPlaceholder: 'What happened in this match?', arenaPublish: 'Publish screenshot', arenaLatest: 'LATEST DROPS', arenaFeed: 'Community feed', arenaLoading: 'Loading the wall…', arenaComments: 'Comments', arenaReply: 'Reply', arenaReplyingTo: 'Replying to', arenaCancelReply: 'Cancel', arenaWriteComment: 'Write a comment…', arenaSend: 'Send', arenaSignInToComment: 'Sign in to comment or reply.', arenaNoPosts: 'No screenshots yet. Be the first to post.', arenaChooseImageFirst: 'Choose a screenshot first.', arenaPosted: 'Screenshot published.', arenaAccountReady: 'Account created. Welcome to Arena Wall.', arenaSignedIn: 'Signed in.', arenaAuthError: 'Could not complete that request.', arenaPostError: 'Could not publish the screenshot.', friendlyProblem: 'Couldn’t reach Brawlhalla right now. Try again in a moment.'
  },
  ar: {
    navLeaderboard: 'الرانك', navQueue: 'الكيو', navArena: 'ساحة الصور', rankedSolo: 'بحث رانك فردي', rankedDoubles: 'بحث رانك ثنائي', rankedThrees: 'بحث فريق 3 لاعبين', queueSolo: 'دور لاعبين 1v1', queueDoubles: 'دور شريك رانك', queueThrees: 'كوّن فريق 3 لاعبين', queueSoloLive: 'نشاط رانك 1v1', queueDoublesLive: 'نشاط فرق 2v2', queueThreesLive: 'نشاط فرق 3v3', navDiscord: 'دخول الديسكورد', discordAria: 'انضم إلى سيرفر PeakHalla في ديسكورد', navClans: 'الكلانات', navEsports: 'البطولات', powerRankingNavNote: 'ترتيب اللاعبين الرسمي حسب الريجون', tournamentsNav: 'البطولات', tournamentsNavNote: 'بطولات رسمية ومجتمعية', navAbout: 'عن الموقع', navDonation: 'دعم الموقع', liveData: 'البيانات مباشرة',
    heroTitle: 'تراكر براولهالا.<br><em>إحصائيات وإيلو وترتيب مباشر.</em>', heroText: 'PeakHalla تراكر براولهالا سريع ومجاني يعرض بيانات اللاعبين المباشرة، الإيلو الحالي والبيك، الشخصيات، الكلانات، فرق 2v2، والترتيب التنافسي.',
    seoTitle: 'تراكر براولهالا مجاني لإحصائيات اللاعبين والإيلو والترتيب', seoIntro: 'ابحث عن أي لاعب معروف بالاسم الحالي أو الاسم القديم أو رقم Brawlhalla ID. يجمع PeakHalla بيانات الرانك المباشرة، تقدم الحساب، أداء الشخصيات، الكلانات، شركاء 2v2، لوحات الترتيب، وبطولات الإيسبورت في مكان واحد.', seoPlayerTitle: 'إحصائيات اللاعب مباشرة', seoPlayerText: 'شاهد الإيلو الحالي، بيك الموسم، رتبة الرانك، الفوز والخسارة، إكس بي الحساب، لفلات الشخصيات، وقت اللعب، الأسلحة، وإحصائيات الحساب.', seoSearchTitle: 'الأسماء الحالية والقديمة', seoSearchText: 'ابحث بالاسم الحالي أو اسم قديم معروف أو رقم Brawlhalla ID حتى لو لم يكن اللاعب مصنفًا حاليًا.', seoRankingsTitle: 'الترتيب والكلانات والبطولات', seoRankingsText: 'تصفح ترتيب الرانك حسب المنطقة، أفضل الكلانات حسب Lifetime XP، أعضاء الكلان، شركاء 2v2، باور رانكنق المحترفين، والبطولات.', seoSearchLink: 'ابحث عن لاعب', seoRankedLink: 'ترتيب الرانك', seoClansLink: 'كلانات براولهالا', seoEsportsLink: 'بطولات براولهالا', seoFaqTitle: 'أسئلة تراكر براولهالا', seoFaqQ1: 'كيف أبحث عن لاعب براولهالا؟', seoFaqA1: 'اكتب اسم اللاعب الحالي أو اسمه القديم أو رقم Brawlhalla ID في مربع البحث. يفتح PeakHalla البروفايل ويحدث البيانات الرسمية تلقائيًا.', seoFaqQ2: 'هل يظهر PeakHalla الإيلو الحالي والبيك؟', seoFaqA2: 'نعم. يظهر البروفايل الإيلو الحالي وبيك الموسم ورتبة الرانك وترتيب المنطقة والفوز والخسارة وأداء الشخصيات في الرانك عند توفر البيانات.', seoFaqQ3: 'هل أقدر أبحث بالاسم القديم؟', seoFaqA3: 'نعم. يبحث PeakHalla في الأسماء القديمة المعروفة إلى جانب الاسم الحالي ورقم Brawlhalla ID.', seoFaqQ4: 'هل أقدر أشوف الكلان وشركاء 2v2؟', seoFaqA4: 'نعم. يعرض PeakHalla صفحة الكلان والأعضاء وLifetime XP وشركاء رانك 2v2 للموسم الحالي عند توفر البيانات الرسمية.',
    mainLegendFeature: 'الشخصية الأساسية', aliasFeature: 'الأسماء القديمة', boardsFeature: 'كل المناطق', esportsFeature: 'باور رانكنق البطولات', findPlayer: 'دور على لاعب',
    playerName: 'اسم اللاعب أو اسمه القديم أو BH ID', playerPlaceholder: 'مثال: Sandstorm', region: 'المنطقة', gameMode: 'النمط', searchButton: 'ابحث',
    searchNote: 'يبحث مباشرة في بروفايلات اللاعبين بالاسم الحالي أو القديم أو BH ID في كل المناطق.', searchResults: 'نتائج البحث', playerIdLabel: 'معرّف BH', updatedLabel: 'آخر تحديث', currentRank: 'الرانك الحالي',
    eloProgress: 'تطور الإيلو', last120: '١٢٠ يوم', firstSnapshot: 'حفظنا أول لقطة، والرسم يكبر كل ما نشوف الحساب مرة ثانية.',
    playerSummary: 'زبدة الحساب', knownNames: 'الأسماء المعروفة', knownNamesNote: 'تُجلب الأسماء السابقة تلقائيًا من سجل Corehalla المحدث عند فتح صفحة اللاعب.',
    bestLegends: 'شخصيات الرانك', legend: 'الشخصية', weapons: 'الأسلحة', games: 'المباريات', wins: 'الفوز', winRate: 'نسبة الفوز', peak: 'أعلى إيلو', refresh: 'حدّث',
    aboutTitle: 'مبني مثل مواقع الإحصائيات الصح.', aboutText: 'بيانات رانك رسمية، وشخصية أساسية حسب مباريات الحساب، ولقطات إيلو يومية، وقسم كامل للمحترفين.',
    madeBy: 'من إنشاء <strong>Nad</strong>', followText: 'مقاطع براولهالا وتحديثات التراكر.', disclaimer: 'مشروع جماهيري غير رسمي، وغير تابع لـ Ubisoft أو Blue Mammoth Games.', footerMade: 'من إنشاء', footerTagline: 'إحصائيات براولهالا', rightsReserved: 'جميع الحقوق محفوظة.',
    searching: 'ندور في كل بروفايلات اللاعبين…', loadingPlayer: 'نفتح ملف اللاعب…', fetchError: 'ما قدرنا نجيب البيانات الحين.',
    noSearchResults: 'ما لقينا بروفايل بهذا الاسم للحين. راجع الكتابة أو ابحث بـ BH ID.', result: 'نتيجة', results: 'نتائج', seasonalPeak: 'قمة الموسم', currentElo: 'الإيلو الحالي', peakElo: 'أعلى إيلو', rankedOverview: 'ملخص الرانك', offPeak: 'عن القمة', atPeak: 'على قمة الموسم', globalRank: 'الترتيب العالمي', rankedGames: 'مباريات الرانك', rankedWins: 'فوز الرانك',
    accountLevel: 'لفل الحساب', accountXP: 'إكس بي الحساب', xpProgress: 'تقدم اللفل', gameTime: 'وقت المباريات الأونلاين', mainWeapons: 'الأسلحة الأساسية', topLegends: 'الشخصيات الأساسية', regionRank: 'ترتيب المنطقة', totalGames: 'كل المباريات', totalWins: 'كل الفوز', overallWinRate: 'نسبة الفوز العامة', liveOfficialData: 'بيانات اللاعب مباشرة', corehallaStats: 'إحصائيات متوافقة مع Corehalla', currentAlias: 'الاسم الحالي', previousAliases: 'الأسماء السابقة', refreshLiveStats: 'حدّث البيانات مباشرة', refreshingLiveStats: 'نحدّث البيانات الرسمية…', notReported: 'غير متوفر من الـAPI', statsAccuracyNote: 'يتم فحص إكس بي الحساب ولفلات الشخصيات من Brawlhalla وCorehalla مباشرة، ويعتمد PeakHalla أعلى قيمة تقدم حتى لا تستبدل البيانات القديمة اللفلات الأحدث.', legendLevelLimit: 'بعض لفلات وإكس بي الشخصيات قد لا تظهر إذا لم تُلعب الشخصية منذ تحديث 9.07.',
    fullPlayerStats: 'إحصائيات اللاعب كاملة', officialLifetimeData: 'بيانات رسمية طوال عمر الحساب', allLegendStats: 'كل الشخصيات · إحصائيات العمر الكامل', searchLegends: 'ابحث في الشخصيات', legendSearchPlaceholder: 'اسم شخصية أو سلاح', show: 'العرض', playedOnly: 'اللي لعب بها فقط', allLegends: 'كل الشخصيات', sortBy: 'الترتيب حسب', level: 'اللفل', xp: 'الإكس بي', losses: 'الخسائر', damageDealt: 'الضرر المسبب', damageTaken: 'الضرر المستلم', kos: 'الإقصاءات', falls: 'مرات السقوط', kdRatio: 'نسبة K/D', damageRatio: 'نسبة الضرر', suicides: 'سقوط ذاتي', teamKOs: 'إقصاء الزملاء', unarmedDamage: 'ضرر بدون سلاح', thrownDamage: 'ضرر الأدوات المرميّة', gadgetDamage: 'ضرر الأدوات', gadgetKOs: 'إقصاءات الأدوات', unarmedKOs: 'إقصاءات بدون سلاح', bombDamage: 'ضرر القنابل', mineDamage: 'ضرر الألغام', spikeballDamage: 'ضرر الكرة الشائكة', sidekickDamage: 'ضرر المساعد', snowballHits: 'إصابات كرة الثلج', bombKOs: 'إقصاءات القنابل', mineKOs: 'إقصاءات الألغام', sidekickKOs: 'إقصاءات المساعد', snowballKOs: 'إقصاءات كرة الثلج', spikeballKOs: 'إقصاءات الكرة الشائكة', matchTime: 'وقت المباريات', seasonRanked: 'رانك الموسم الحالي', lifetimeCombat: 'قتال العمر الكامل', weaponBreakdown: 'تفاصيل الأسلحة', noLifetimeStats: 'ما فيه شخصيات مطابقة للفلاتر.', legendsTotal: 'شخصية', playedLegends: 'مستخدمة',
    legendUsed: 'شخصية مستخدمة', legendsUsed: 'شخصيات مستخدمة', noRankedLegends: 'ما لقينا مباريات رانك على الشخصيات.', nameSeen: 'اسم مسجل', namesSeen: 'أسماء مسجلة', currentName: 'الحالي', previousName: 'قديم',
    firstSeen: 'أول ظهور', lastSeen: 'آخر ظهور', formerly: 'كان اسمه', aliasMatch: 'تطابق اسم قديم', main: 'الأساسية', unknownLegend: 'الشخصية غير معروفة',
    leaderboardPrefix: 'المتصدرين ·', leaderboardSearch: 'ابحث في الترتيب', leaderboardSearchPlaceholder: 'اكتب اسم اللاعب', leaderboardSearchTitle: 'نتيجة الترتيب', emptyData: 'ما فيه بيانات الحين.', allRegions: 'كل المناطق', loadMorePlayers: 'اعرض 20 لاعب إضافي', loadingMorePlayers: 'نحمّل 20 لاعب إضافي…', playersShown: 'لاعب معروض',
    clansTitle: 'أفضل الكلانات حسب الخبرة', clansText: 'تصفح كلانات براولهالا الأعلى في Lifetime XP وافتح صفحة مستقلة ومنظمة لكل كلان.', clanSearch: 'ابحث عن كلان', clanSearchPlaceholder: 'اسم الكلان أو رقم Guild ID', clanRank: 'ترتيب الخبرة', clanTier: 'المستوى', clanMembers: 'الأعضاء', clanPoints: 'نقاط الأسبوع', clanXp: 'Lifetime XP', clanRecruiting: 'يقبل أعضاء', clanClosed: 'مغلق', clanOpen: 'كلان مفتوح', clanDetails: 'صفحة الكلان', clanRoster: 'أعضاء الكلان', clanRole: 'الرتبة', clanJoined: 'تاريخ الانضمام', clanMemberXp: 'خبرة العضو', clanNoData: 'بيانات الكلانات غير متاحة الآن، جرّب التحديث بعد قليل.', clanLoading: 'نحمّل أفضل الكلانات حسب الخبرة…', clanUpdated: 'آخر تحديث', clanDiscoveryNote: 'الكلانات مرتبة حسب Lifetime XP.', clanView: 'افتح الكلان', clanBack: 'الرجوع للكلانات', clanRoleOrder: 'تسلسل الرتب', clanRecruit: 'Recruit', clanMember: 'Member', clanOfficer: 'Officer', clanLeader: 'Leader', clanProfileNote: 'الأعضاء مرتبون من Recruit إلى Leader.', playerClan: 'كلان اللاعب', viewClanProfile: 'افتح صفحة الكلان', noClan: 'بدون كلان',
    MiddleEast: 'الشرق الأوسط', Europe: 'أوروبا', USEast: 'شرق أمريكا', USWest: 'غرب أمريكا', SouthernAfrica: 'جنوب أفريقيا', SoutheastAsia: 'جنوب شرق آسيا', Brazil: 'البرازيل', Australia: 'أستراليا', Japan: 'اليابان',
    esportsHubTitle: 'بطولات PeakHalla', esportsHubText: 'الباور رانكنق الرسمي ودليل مباشر للبطولات الرسمية وبطولات الكومينيتي.', esportsTitle: 'باور رانكنق المحترفين', esportsText: 'ترتيب اللاعبين الرسمي، الميداليات، الأرباح، ونتائج البطولات الكبرى.', powerRanking: 'الباور رانكنق', player: 'اللاعب', earnings: 'الأرباح', tournamentDirectory: 'دليل البطولات', tournamentDirectoryText: 'يتم فحص إعلانات بطولات براولهالا تلقائيًا وإضافة البطولات الجديدة هنا.', liveTournamentFeed: 'تحديث البطولات المباشر', autoUpdating: 'تحديث تلقائي', officialTournaments: 'البطولات الرسمية', communityTournaments: 'بطولات الكومينيتي', tournamentRegion: 'ريجون البطولة', tournamentMode: 'نمط البطولة', allTournamentModes: 'كل الأنماط', loadingTournaments: 'نحمّل البطولات…', noTournaments: 'ما فيه بطولات مطابقة للفلاتر حاليًا.', tournamentEvents: 'بطولة', tournamentSource: 'افتح البطولة', announced: 'تاريخ الإعلان',
    officialSource: 'افتح الترتيب الرسمي ↗', tournamentList: 'قائمة البطولات', proWinners: 'المحترفين وأهم ألقابهم', notExhaustive: 'ألقاب مختارة، مو كل مسيرة اللاعب',
    rankingsUpdated: 'آخر تحديث', noPowerData: 'ما رجعت بيانات الترتيب الرسمي الحين. جرّب تحدث بعد شوي.', powerSearch: 'ابحث عن لاعب', powerSearchPlaceholder: 'اكتب اسم اللاعب في الباور رانكنق', loadMorePowerPlayers: 'اعرض 20 لاعب إضافي', loadingMorePowerPlayers: 'نحمّل 20 لاعب إضافي…', powerPlayersShown: 'لاعب معروض', powerSearchResults: 'نتيجة في الترتيب', title: 'لقب', titles: 'ألقاب',
    viewCareer: 'شوف بطولاته', tournamentCareer: 'مسيرة البطولات', loadingCareer: 'نجيب بطولات اللاعب…',
    allModes: 'الكل', top8Only: 'توب 8', careerEvents: 'بطولات', careerTitles: 'بطولات فاز فيها', careerPodiums: 'منصات', careerTop8: 'توب 8', bestFinish: 'أفضل مركز',
    noPlacements: 'ما لقينا نتائج بطولات رسمية لهذا اللاعب للحين.', careerSource: 'مصدر بيانات البطولات ↗', officialEventsOnly: 'بطولات رسمية فقط',
    onlineEvent: 'أونلاين', offlineEvent: 'حضوري', playerCareerNotFound: 'ما لقينا ملف بطولات لهذا اللاعب.', placementLabel: 'المركز',
    twoVTwoPartners: 'شركاء رانك 2v2', twoVTwoPartnersNote: 'الفرق الرسمية للموسم الحالي من بيانات اللاعب.', teammateElo: 'إيلو اللاعب', teamElo: 'إيلو الفريق', noTeammates: 'ما لقينا شريك 2v2 لهذا الحساب في الموسم الحالي.', loadingTeammates: 'نجيب شركاء 2v2…', backToTracker: 'ارجع للتراكر', queueLiveTracking: 'تتبّع النشاط المباشر', queueEyebrowLive: 'نشاط الرانك', queueTitleLive: 'مين قاعد يلعب رانك الحين؟', queueIntroLive: 'نتابع أعلى 500 نتيجة في الترتيب ونظهر اللاعبين اللي تغيّرت مبارياتهم خلال آخر 10 دقائق.', queueActiveNow: 'نشط الحين', queueDisclaimerLive: 'النشاط يعني أن بيانات الرانك تغيّرت مؤخرًا، وليس وصولًا إلى شاشة المطابقة الخاصة داخل اللعبة.', queueWarming: 'نبني أول لقطة للترتيب. اللاعبين النشطين يظهرون بعد الفحص الجاي.', queueNoActivity: 'ما رصدنا نشاط رانك ضمن أعلى 500 خلال آخر 10 دقائق.', queueTrackedTop: 'نتيجة نتابعها', queueLastScan: 'آخر فحص', queueNextScan: 'الفحص الجاي', queueGameDetected: 'مباراة مرصودة', queueGamesDetected: 'مباريات مرصودة', queueEloChange: 'تغيّر الإيلو', queueWatching: 'متابعة الترتيب مباشرة', queueError: 'ما قدرنا نحدّث النشاط المباشر الحين.',
    arenaCommunity: 'صور المجتمع', arenaEyebrow: 'المجتمع', arenaTitle: 'ساحة الصور', arenaIntro: 'شارك لقطات براولهالا، اكتب تعليقك، وتكلم مع اللاعبين من خلال التعليقات والردود.', arenaWhat: 'وش هي ساحة الصور؟', arenaWhatText: 'معرض مجتمعي للقطات المباريات، لحظات الرانك، النتائج واللقطات المضحكة. الحساب يحتاج يوزر وباسورد فقط، بدون إيميل أو رمز تحقق.', arenaCreateAccount: 'إنشاء حساب', arenaSignIn: 'تسجيل الدخول', arenaNoEmail: 'بدون إيميل', arenaJoinTitle: 'ادخل الساحة', arenaJoinText: 'اختر يوزر وباسورد فقط، بدون إيميل أو رمز تحقق أو تسجيل اجتماعي.', arenaUsername: 'اسم المستخدم', arenaPassword: 'كلمة المرور', arenaPostingAs: 'تنشر باسم', arenaLogout: 'تسجيل الخروج', arenaChooseScreenshot: 'اختر سكرين شوت', arenaImageLimit: 'PNG أو JPG أو WebP · حتى 5 ميجا', arenaCaption: 'وصف الصورة', arenaCaptionPlaceholder: 'وش صار في المباراة؟', arenaPublish: 'انشر الصورة', arenaLatest: 'أحدث الصور', arenaFeed: 'صور المجتمع', arenaLoading: 'نحمّل الساحة…', arenaComments: 'التعليقات', arenaReply: 'رد', arenaReplyingTo: 'ترد على', arenaCancelReply: 'إلغاء', arenaWriteComment: 'اكتب تعليق…', arenaSend: 'إرسال', arenaSignInToComment: 'سجل دخول عشان تعلق أو ترد.', arenaNoPosts: 'ما فيه صور للحين، كن أول واحد ينشر.', arenaChooseImageFirst: 'اختر صورة أول.', arenaPosted: 'تم نشر الصورة.', arenaAccountReady: 'تم إنشاء الحساب، حيّاك في الساحة.', arenaSignedIn: 'تم تسجيل الدخول.', arenaAuthError: 'ما قدرنا نكمل الطلب.', arenaPostError: 'ما قدرنا ننشر الصورة.', friendlyProblem: 'براولهالا ما ردت الحين، جرّب بعد شوي.'
  }
};

const copyrightYear = document.querySelector('#copyright-year');
if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());

const state = { language: localStorage.getItem('nad-bh-language') || 'en', currentPlayer: null, playerSignature: '', playerAutoRefreshTimer: null, playerLivePollTimer: null, playerRefreshController: null, playerRequestSequence: 0, playerRetryCount: 0, playerPrefetches: new Map(), playerSeeds: new Map(), esportsData: null, esportsCareer: null, esportsView: 'power', powerPage: 1, powerHasMore: false, powerLoadingMore: false, powerSearchTimer: null, esportsMenuPinned: false, esportsMenuTimer: null, tournamentType: 'official', tournamentMode: 'ALL', tournamentData: null, tournamentRefreshTimer: null, careerFilter: 'all', suggestionItems: [], suggestionIndex: -1, suggestionTimer: null, suggestionController: null, suggestionRequestId: 0, leaderboardSearchTimer: null, leaderboardSearchController: null, leaderboardPage: 1, leaderboardTotalPages: 1, leaderboardLoadingMore: false, queueMode: '1v1', queueRegion: 'EU', queueData: null, queueController: null, queueTimer: null, arenaUser: null, arenaPosts: [], arenaAuthMode: 'register', arenaImageData: null, arenaReplyTarget: null, clansData: null, clansSearchTimer: null, clansController: null, clansObserver: null, clansLoadStarted: false, selectedClan: null };


const PEAKHALLA_THEME_KEY = 'peakhalla-theme';
const PEAKHALLA_THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const PEAKHALLA_THEMES = {
  purple: { meta: '#0c0714', en: ['Royal Purple', 'Original PeakHalla'], ar: ['بنفسجي ملكي', 'ستايل PeakHalla الأصلي'] },
  crimson: { meta: '#100609', en: ['Dark Crimson', 'Deep red glow'], ar: ['أحمر غامق', 'توهج أحمر عميق'] },
  graphite: { meta: '#0b0d10', en: ['Dark Gray', 'Clean graphite'], ar: ['رمادي داكن', 'جرافيت هادئ'] },
  ice: { meta: '#061017', en: ['Ice Blue', 'Cool light blue'], ar: ['أزرق فاتح', 'أزرق جليدي هادئ'] }
};
let themeTransitionTimer = null;
function normalizedTheme(value) {
  return PEAKHALLA_THEMES[value] ? value : 'purple';
}
function readThemeCookie() {
  const prefix = `${PEAKHALLA_THEME_KEY}=`;
  const item = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!item) return '';
  try { return decodeURIComponent(item.slice(prefix.length)); } catch (_) { return item.slice(prefix.length); }
}
function readStoredTheme() {
  let value = '';
  try { value = localStorage.getItem(PEAKHALLA_THEME_KEY) || ''; } catch (_) {}
  if (!PEAKHALLA_THEMES[value]) value = readThemeCookie();
  return normalizedTheme(value);
}
function persistSiteTheme(theme) {
  const value = normalizedTheme(theme);
  try { localStorage.setItem(PEAKHALLA_THEME_KEY, value); } catch (_) {}
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  const sharedDomain = /(^|\.)peakhalla\.com$/i.test(location.hostname) ? '; Domain=.peakhalla.com' : '';
  document.cookie = `${PEAKHALLA_THEME_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=${PEAKHALLA_THEME_COOKIE_MAX_AGE}; SameSite=Lax${secure}${sharedDomain}`;
}
function currentTheme() {
  return normalizedTheme(document.documentElement.dataset.theme || readStoredTheme());
}
function syncThemePickerLanguage() {
  const picker = document.getElementById('theme-picker');
  if (!picker) return;
  const isArabic = state?.language === 'ar';
  const title = document.getElementById('theme-picker-title');
  const subtitle = document.getElementById('theme-picker-subtitle');
  if (title) title.textContent = isArabic ? 'ثيم الموقع' : 'Website theme';
  if (subtitle) subtitle.textContent = isArabic ? 'غيّره في أي وقت' : 'Change it anytime';
  picker.querySelectorAll('[data-theme-option]').forEach((button) => {
    const info = PEAKHALLA_THEMES[button.dataset.themeOption];
    if (!info) return;
    const [name, description] = isArabic ? info.ar : info.en;
    const nameNode = button.querySelector('[data-theme-name]');
    const descriptionNode = button.querySelector('[data-theme-description]');
    if (nameNode) nameNode.textContent = name;
    if (descriptionNode) descriptionNode.textContent = description;
  });
  const toggle = document.getElementById('theme-picker-toggle');
  if (toggle) toggle.setAttribute('aria-label', isArabic ? 'اختيار ثيم الموقع' : 'Choose website theme');
}
function applySiteTheme(theme, { persist = true, animate = true } = {}) {
  const next = PEAKHALLA_THEMES[theme] ? theme : 'purple';
  if (animate && next !== currentTheme()) {
    document.documentElement.classList.add('theme-changing');
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = window.setTimeout(() => document.documentElement.classList.remove('theme-changing'), 430);
  }
  document.documentElement.dataset.theme = next;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = PEAKHALLA_THEMES[next].meta;
  document.querySelectorAll('[data-theme-option]').forEach((button) => {
    const selected = button.dataset.themeOption === next;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (persist) persistSiteTheme(next);
  window.dispatchEvent(new CustomEvent('peakhalla-theme-changed', { detail: { theme: next } }));
}
function setupThemePicker() {
  const picker = document.getElementById('theme-picker');
  const toggle = document.getElementById('theme-picker-toggle');
  const menu = document.getElementById('theme-picker-menu');
  if (!picker || !toggle || !menu) return;
  const close = () => {
    picker.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  };
  const open = () => {
    picker.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  };
  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    picker.classList.contains('open') ? close() : open();
  });
  menu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-theme-option]');
    if (!option) return;
    applySiteTheme(option.dataset.themeOption);
    close();
  });
  document.addEventListener('click', (event) => { if (!picker.contains(event.target)) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  applySiteTheme(readStoredTheme(), { persist: false, animate: false });
  window.addEventListener('storage', (event) => {
    if (event.key === PEAKHALLA_THEME_KEY) applySiteTheme(normalizedTheme(event.newValue), { persist: false, animate: true });
  });
  syncThemePickerLanguage();
}
const playerPathMatch = location.pathname.match(/^\/player\/(\d+)\/?$/);
const clanPathMatch = location.pathname.match(/^\/clan\/(\d+)\/?$/);
const standalonePlayerId = playerPathMatch ? playerPathMatch[1] : null;
const standaloneClanId = clanPathMatch ? clanPathMatch[1] : null;
const isStandalonePlayerPage = Boolean(standalonePlayerId);
const isClanPage = Boolean(standaloneClanId);
const isLiveQueuePage = /^\/queue\/?$/.test(location.pathname);
const isArenaPage = /^\/arena(?:\/profile\/[^/]+)?\/?$/.test(location.pathname);
const esportsPathMatch = location.pathname.match(/^\/esports\/(power|tournaments)\/?$/);
const esportsRouteView = esportsPathMatch ? esportsPathMatch[1] : null;
const isEsportsPage = Boolean(esportsRouteView);
if (isStandalonePlayerPage) document.body.classList.add('player-page-mode', 'page-entering');
if (isClanPage) document.body.classList.add('clan-page-mode', 'page-entering');
if (isLiveQueuePage) document.body.classList.add('live-queue-page-mode', 'page-entering');
if (isArenaPage) document.body.classList.add('arena-page-mode', 'page-entering');
if (isEsportsPage) document.body.classList.add('esports-page-mode', `esports-${esportsRouteView}-page`, 'page-entering');
if (isStandalonePlayerPage || isClanPage || isLiveQueuePage || isArenaPage || isEsportsPage) { const brandLink = document.querySelector('.brand'); if (brandLink) brandLink.href = '/'; }
const els = {
  form: $('#search-form'), name: $('#player-name'), region: $('#search-region'), mode: null, suggestions: $('#search-suggestions'), status: $('#status'),
  resultsSection: $('#search-results'), resultsGrid: $('#results-grid'), resultCount: $('#result-count'), profile: $('#player-profile'), accountShowcase: $('#account-showcase'), profileAliases: $('#player-aliases'), playerClanCard: $('#player-clan-card'), playerClanName: $('#player-clan-name'), playerClanRole: $('#player-clan-role'),
  leaderboard: $('#leaderboard-list'), refreshLeaderboard: $('#refresh-leaderboard'), leaderboardRegion: $('#leaderboard-region'),
  leaderboardMode: $('#leaderboard-mode'), leaderboardSearch: $('#leaderboard-search'), leaderboardTitle: $('#leaderboard-title'), leaderboardLoadMore: $('#leaderboard-load-more'), leaderboardPageStatus: $('#leaderboard-page-status'), languageToggle: $('#language-toggle'), rankedNav: $('#ranked-nav-dropdown'), rankedToggle: $('#ranked-nav-toggle'), rankedMenu: $('#ranked-nav-menu'), rankedModeLabel: $('#ranked-mode-label'), queueNav: $('#queue-nav-dropdown'), queueToggle: $('#queue-nav-toggle'), queueMenu: $('#queue-nav-menu'), queueModeLabel: $('#queue-mode-label'), playerPeakRating: $('#player-peak-rating'), eloGap: $('#elo-gap'), rankProgressFill: $('#rank-progress-fill'),
  esportsRegion: $('#esports-region'), esportsMode: $('#esports-mode'), powerSearch: $('#power-ranking-search'), powerBody: $('#power-ranking-body'), powerLoadMore: $('#power-ranking-load-more'), powerPageStatus: $('#power-ranking-page-status'), esportsUpdated: $('#esports-updated'), esportsNav: $('#esports-nav-dropdown'), esportsToggle: $('#esports-nav-toggle'), esportsMenu: $('#esports-nav-menu'), esportsPowerView: $('#esports-power-view'), esportsTournamentsView: $('#esports-tournaments-view'), tournamentDirectoryRegion: $('#tournament-directory-region'), tournamentDirectoryMode: $('#tournament-directory-mode'), tournamentDirectoryList: $('#tournament-directory-list'), tournamentDirectoryUpdated: $('#tournament-directory-updated'), tournamentDirectoryCount: $('#tournament-directory-count'), tournamentDirectoryRefresh: $('#tournament-directory-refresh'), championsGrid: $('#champions-grid'), esportsSource: $('#esports-source'),
  clansGrid: $('#clans-grid'), clansSearch: $('#clans-search'), clansRefresh: $('#clans-refresh'), clansUpdated: $('#clans-updated'), clanPage: $('#clan-page'), clanPageName: $('#clan-page-name'), clanPageMeta: $('#clan-page-meta'), clanPageStats: $('#clan-page-stats'), clanPageStatus: $('#clan-page-status'), clanPageMembers: $('#clan-page-members'), clanPageMemberCount: $('#clan-page-member-count'), clanPageRoles: $('#clan-page-roles'), clanModal: $('#clan-modal'), clanModalName: $('#clan-modal-name'), clanModalMeta: $('#clan-modal-meta'), clanModalStats: $('#clan-modal-stats'), clanMembersBody: $('#clan-members-body'), clanMemberCount: $('#clan-member-count'), clanModalStatus: $('#clan-modal-status'),
  careerModal: $('#esports-player-modal'), careerName: $('#career-player-name'), careerMeta: $('#career-player-meta'), careerStatus: $('#career-status'),
  careerContent: $('#career-content'), careerSummary: $('#career-summary'), careerList: $('#career-placement-list'), careerCount: $('#career-count'), careerSource: $('#career-source'),
  lifetimeSummary: $('#lifetime-summary-grid'), lifetimeLegends: $('#lifetime-legends-grid'), lifetimeLegendsCount: $('#lifetime-legends-count'), legendStatsSearch: $('#legend-stats-search'), legendStatsFilter: $('#legend-stats-filter'), legendStatsSort: $('#legend-stats-sort'), refreshPlayerStats: $('#refresh-player-stats'), statsSourceNote: $('#stats-source-note'), statsAccuracyNote: $('#stats-accuracy-note'), teammatesPanel: $('#teammates-panel'), teammatesGrid: $('#teammates-grid'), teammatesCount: $('#teammates-count'), queuePage: $('#live-queue-page'), queueRegion: $('#queue-region'), queueRefresh: $('#queue-refresh'), queueList: $('#queue-activity-list'), queueStatus: $('#queue-status'), queueActiveCount: $('#queue-active-count'), queueScanMeta: $('#queue-scan-meta'), arenaPage: $('#arena-page'), arenaAuthPanel: $('#arena-auth-panel'), arenaAuthForm: $('#arena-auth-form'), arenaUsername: $('#arena-username'), arenaPassword: $('#arena-password'), arenaAuthSubmit: $('#arena-auth-submit'), arenaAuthStatus: $('#arena-auth-status'), arenaComposer: $('#arena-composer'), arenaCurrentUser: $('#arena-current-user'), arenaUserAvatar: $('#arena-user-avatar'), arenaLogout: $('#arena-logout'), arenaPostForm: $('#arena-post-form'), arenaImageInput: $('#arena-image-input'), arenaImagePreview: $('#arena-image-preview'), arenaUploadPrompt: $('#arena-upload-prompt'), arenaCaption: $('#arena-caption'), arenaPostSubmit: $('#arena-post-submit'), arenaPostStatus: $('#arena-post-status'), arenaFeed: $('#arena-feed'), arenaRefresh: $('#arena-refresh')
};

function t(key) { return translations[state.language][key] || translations.en[key] || key; }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function initials(name) { return String(name || 'BH').trim().slice(0, 2).toUpperCase(); }
function number(value, fallback = '—') { if (value === null || value === undefined || value === '') return fallback; const numeric = Number(value); return Number.isFinite(numeric) ? new Intl.NumberFormat(state.language === 'ar' ? 'ar-SA' : 'en-US').format(numeric) : fallback; }
function money(value) { return Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value)) : '—'; }
function dateTime(value) { return new Date(value).toLocaleString(state.language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }); }
function shortDate(value) { return new Date(value).toLocaleDateString(state.language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
function normalize(value) { return String(value || '').trim().toLowerCase(); }
const INVALID_HISTORY_NAMES = new Set(['menu','home','profile','club','meta','events','overview','details','matches','ranked','legends','weapons','settings','search','share','stats','statistics','account','player','players','main','history','identity','known names','about','help','contact','privacy','terms','followers','following','social','socials']);
function validHistoryName(value) {
  const clean = String(value || '').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length < 1 || clean.length > 32) return false;
  if (INVALID_HISTORY_NAMES.has(normalize(clean))) return false;
  if (!/[\p{L}\p{N}]/u.test(clean)) return false;
  if (/\b(function|return|const|let|var|undefined|null|document|window|onclick|classname)\b/i.test(clean)) return false;
  if (/=>|==|!=|&&|\|\||[{};:=<>]/.test(clean)) return false;
  return true;
}
const regionKeys = { ALL: 'allRegions', ME: 'MiddleEast', EU: 'Europe', 'US-E': 'USEast', 'US-W': 'USWest', SA: 'SouthernAfrica', SEA: 'SoutheastAsia', BRZ: 'Brazil', AUS: 'Australia', JPN: 'Japan' };
function regionLabel(code) { return t(regionKeys[code]) || code; }

function applyLanguage() {
  const isArabic = state.language === 'ar';
  document.documentElement.lang = state.language;
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.body.classList.toggle('is-arabic', isArabic);
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  els.languageToggle.innerHTML = isArabic ? '<span>EN</span><b>AR</b>' : '<b>EN</b><span>AR</span>';
  [els.region, els.mode, els.leaderboardRegion, els.leaderboardMode, els.esportsRegion, els.esportsMode, els.tournamentDirectoryRegion, els.tournamentDirectoryMode, els.queueRegion].forEach((select) => select?._motionSync?.());
  localStorage.setItem('nad-bh-language', state.language);
  syncThemePickerLanguage();
  if (state.currentPlayer) renderPlayer(state.currentPlayer, false);
  if (isLiveQueuePage) {
    if (state.queueData) renderLiveQueue(state.queueData);
  } else if (isEsportsPage) {
    if (state.esportsData && esportsRouteView === 'power') renderEsports(state.esportsData);
    showEsportsView(esportsRouteView, { scroll: false });
  } else if (!isStandalonePlayerPage && !isClanPage && !isArenaPage) {
    loadLeaderboard();
    if (state.clansData) renderClans(state.clansData); else scheduleClanSectionLoad();
  }
  if (isArenaPage) { renderArenaAccount(); renderArenaPosts(); }
  if (isClanPage && state.selectedClan) renderClanPage(state.selectedClan);
  if (state.esportsCareer && !els.careerModal.hidden) renderCareer(state.esportsCareer);
}

const LEGEND_ASSET_VERSION = '7.67.0';

function legendAssetSlug(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function localLegendImageCandidates(name = '') {
  const slug = legendAssetSlug(name);
  if (!slug) return [];
  return [
    `/assets/legends/${encodeURIComponent(slug)}.webp?v=${LEGEND_ASSET_VERSION}`,
    `/api/legend-image/${encodeURIComponent(String(name).trim())}?v=${LEGEND_ASSET_VERSION}`,
    `/api/legend-art/${encodeURIComponent(String(name).trim())}?v=${LEGEND_ASSET_VERSION}`
  ];
}

const legendImageObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const image = entry.target;
        image.dataset.imageVisible = '1';
        armLegendImageTimeout(image);
        legendImageObserver.unobserve(image);
      }
    }, { rootMargin: '280px 0px' })
  : null;

function clearLegendImageTimer(image) {
  const timer = Number(image?.dataset?.imageTimer || 0);
  if (timer) window.clearTimeout(timer);
  if (image?.dataset) delete image.dataset.imageTimer;
}

function handleLegendImageLoad(image) {
  clearLegendImageTimer(image);
  image.classList.add('is-loaded');
  image.closest('.legend-image-shell')?.classList.add('is-loaded');
}

function handleLegendImageError(image) {
  clearLegendImageTimer(image);
  let candidates = [];
  try { candidates = JSON.parse(image.dataset.imageCandidates || '[]'); } catch { candidates = []; }
  const currentIndex = Number(image.dataset.imageIndex || '0');
  const nextIndex = currentIndex + 1;
  if (candidates[nextIndex]) {
    image.dataset.imageIndex = String(nextIndex);
    image.classList.remove('is-loaded');
    image.hidden = false;
    image.src = candidates[nextIndex];
    if (image.dataset.imageVisible === '1' || image.loading === 'eager') armLegendImageTimeout(image);
    return;
  }

  // A CDN or mobile connection can transiently fail even for a local image.
  // Retry the local portrait twice with a cache-busting query before showing initials.
  const retryCount = Number(image.dataset.imageRetry || '0');
  if (candidates[0] && retryCount < 2) {
    image.dataset.imageRetry = String(retryCount + 1);
    image.dataset.imageIndex = '0';
    image.hidden = false;
    image.classList.remove('is-loaded');
    const separator = candidates[0].includes('?') ? '&' : '?';
    window.setTimeout(() => {
      if (!image.isConnected) return;
      image.src = `${candidates[0]}${separator}retry=${Date.now()}`;
      armLegendImageTimeout(image);
    }, 500 + (retryCount * 700));
    return;
  }

  image.hidden = true;
  image.closest('.legend-image-shell')?.classList.add('is-fallback');
  if (image.nextElementSibling) image.nextElementSibling.hidden = false;
}

function armLegendImageTimeout(image) {
  clearLegendImageTimer(image);
  if (image.complete && image.naturalWidth > 0) return handleLegendImageLoad(image);
  // Do not mark lazy off-screen images as failed before the browser starts them.
  if (image.loading === 'lazy' && image.dataset.imageVisible !== '1') {
    legendImageObserver?.observe(image);
    return;
  }
  const timer = window.setTimeout(() => {
    if (!image.complete || image.naturalWidth === 0) handleLegendImageError(image);
  }, 14_000);
  image.dataset.imageTimer = String(timer);
}
window.handleLegendImageError = handleLegendImageError;
window.handleLegendImageLoad = handleLegendImageLoad;

function legendImageMarkup(legend, options = {}) {
  const name = legend?.name || options.fallbackName || '';
  const fallback = escapeHtml(initials(name || 'BH'));
  const suppliedCandidates = Array.isArray(legend?.image_candidates)
    ? legend.image_candidates.filter(Boolean)
    : (legend?.image_url ? [legend.image_url] : []);
  const candidates = [...new Set([
    ...(options.localCandidates === false ? [] : localLegendImageCandidates(name)),
    ...suppliedCandidates
  ].filter(Boolean))];
  if (!candidates.length) return `<span class="legend-image-shell is-fallback"><span class="legend-fallback">${fallback}</span></span>`;
  // Portraits are small local assets. Eager loading is more reliable across
  // mobile browsers and avoids the old 'appears only after refresh' issue.
  // Very large lists can still opt into lazy loading explicitly.
  const eager = options.lazy !== true;
  const loading = eager ? 'loading="eager" fetchpriority="high" data-image-visible="1"' : 'loading="lazy" fetchpriority="auto"';
  return `<span class="legend-image-shell"><img src="${escapeHtml(candidates[0])}" alt="${escapeHtml(name)}" ${loading} decoding="async" referrerpolicy="no-referrer" data-legend-image data-image-candidates='${escapeHtml(JSON.stringify(candidates))}' data-image-index="0" data-image-retry="0" onload="handleLegendImageLoad(this)" onerror="handleLegendImageError(this)"><span class="legend-fallback" hidden>${fallback}</span></span>`;
}

function portraitMarkup(legend, className = 'row-portrait', options = {}) {
  return `<span class="${className}">${legendImageMarkup(legend, options)}</span>`;
}

function activateImageFallbacks(root = document) {
  root.querySelectorAll?.('[data-legend-image]').forEach((image) => {
    if (image.complete && image.naturalWidth > 0) handleLegendImageLoad(image);
    else if (image.loading === 'lazy' && image.dataset.imageVisible !== '1') legendImageObserver?.observe(image);
    else armLegendImageTimeout(image);
  });
}

function stabilizeLegendImages(root = document) {
  activateImageFallbacks(root);
  // A second and third pass catch images inserted during the same render frame
  // or restored from the browser back/forward cache without needing a refresh.
  window.requestAnimationFrame(() => activateImageFallbacks(root));
  window.setTimeout(() => activateImageFallbacks(root), 280);
  window.setTimeout(() => activateImageFallbacks(root), 1400);
}

function formerNames(player) {
  const current = normalize(player.username);
  return (player.known_names || []).map((item) => item.name).filter((name) => normalize(name) !== current).slice(0, 3);
}

function showStatus(message, type = 'loading') { els.status.hidden = false; els.status.className = `status shell ${type}`; els.status.textContent = message; }
function hideStatus() { els.status.hidden = true; }
async function getJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 15000);
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', abortFromCaller, { once: true });
  }
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t('fetchError'));
    return data;
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error(t('friendlyProblem'));
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

function playerPayloadSignature(data = {}) {
  const player = data.player || {};
  const legends = (player.lifetime_legends || []).map((legend) => [
    legend.legend_id, legend.name, legend.level, legend.xp, legend.games, legend.wins,
    legend.image_url, legend.image_candidates
  ]);
  const rankedLegends = (player.legends || []).map((legend) => [
    legend.legend_id, legend.name, legend.rating, legend.peak_rating, legend.games,
    legend.image_url, legend.image_candidates
  ]);
  const topLegends = (player.top_legends || []).map((legend) => [
    legend.legend_id, legend.name, legend.games, legend.image_url, legend.image_candidates
  ]);
  const mainWeapons = (player.main_weapons || []).map((weapon) => [weapon.name, weapon.games, weapon.kos, weapon.match_time_seconds]);
  const mainLegend = player.main_legend ? [
    player.main_legend.legend_id, player.main_legend.name,
    player.main_legend.image_url, player.main_legend.image_candidates
  ] : null;
  const names = (data.known_names || []).map((item) => item?.name || item);
  const regionRanks = (player.region_ranks || []).map((item) => [item.region, item.rank]);
  return JSON.stringify([
    player.brawlhalla_id, player.name, player.account_xp, player.level,
    player.game_time_seconds, player.lifetime_games, player.lifetime_wins,
    player.rating, player.peak_rating, player.tier, player.region, player.global_rank,
    player.ranked_games, player.ranked_wins, player.ranked_win_rate, regionRanks,
    player.guild?.guild_id || null, mainLegend, topLegends, mainWeapons,
    names, legends, rankedLegends, player.updated_at,
    Boolean(data.partial || player.data_quality?.partial),
    Boolean(player.data_quality?.official_lifetime_ok),
    Boolean(player.data_quality?.official_ranked_ok),
    Boolean(player.data_quality?.official_guild_ok)
  ]);
}

const PLAYER_BROWSER_CACHE_KEY = 'peakhalla-player-cache-v5';
const PLAYER_BROWSER_CACHE_MAX_AGE_MS = 60 * 60_000;
function readPlayerBrowserCache(id) {
  try {
    const all = JSON.parse(localStorage.getItem(PLAYER_BROWSER_CACHE_KEY) || '{}');
    const entry = all[String(id)];
    const age = Date.now() - Number(entry?.saved_at || 0);
    if (!entry?.data || !Number.isFinite(age) || age > PLAYER_BROWSER_CACHE_MAX_AGE_MS) return null;
    // Render cached stats instantly, but never trust cached clan membership.
    // A player can leave a clan between visits, so the live profile request is
    // the only source allowed to show the clan card.
    const data = typeof structuredClone === 'function'
      ? structuredClone(entry.data)
      : JSON.parse(JSON.stringify(entry.data));
    if (data?.player) data.player.guild = null;
    return data;
  } catch { return null; }
}

function writePlayerBrowserCache(id, data) {
  try {
    const all = JSON.parse(localStorage.getItem(PLAYER_BROWSER_CACHE_KEY) || '{}');
    all[String(id)] = { saved_at: Date.now(), data };
    const trimmed = Object.entries(all)
      .sort((a, b) => Number(b[1]?.saved_at || 0) - Number(a[1]?.saved_at || 0))
      .slice(0, 50);
    localStorage.setItem(PLAYER_BROWSER_CACHE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch { /* localStorage can be unavailable or full */ }
}

const PLAYER_NAV_SEED_KEY = 'peakhalla-player-nav-seed-v1';
function makePlayerSeedPayload(item = {}, player = {}) {
  const id = Number(player.id || player.brawlhalla_id);
  const name = player.username || player.name || `Player ${id}`;
  const knownNames = [];
  const seen = new Set();
  const pushName = (value) => {
    const clean = String(value?.name || value || '').trim();
    const key = normalize(clean);
    if (!clean || seen.has(key)) return;
    seen.add(key);
    knownNames.push({ name: clean, is_current: key === normalize(name) });
  };
  pushName(name);
  (player.known_names || []).forEach(pushName);
  (player.matched_aliases || []).forEach(pushName);
  const mainLegend = player.main_legend || null;
  return {
    seed_only: true,
    player: {
      brawlhalla_id: id,
      name,
      level: null,
      xp_percentage: null,
      account_xp: null,
      game_time_seconds: 0,
      game_time_display: '—',
      lifetime_games: null,
      lifetime_wins: null,
      lifetime_win_rate: null,
      rating: item.rating ?? null,
      peak_rating: item.best_rating ?? item.peak_rating ?? null,
      tier: item.tier || 'Unranked',
      region: item.region || '—',
      global_rank: item.rank ?? null,
      region_ranks: [],
      ranked_games: item.games ?? null,
      ranked_wins: item.wins ?? null,
      ranked_win_rate: null,
      main_legend: mainLegend,
      top_legends: mainLegend ? [{ ...mainLegend, games: 0 }] : [],
      main_weapons: [],
      lifetime_totals: {},
      lifetime_legends: [],
      legends: [],
      guild: null,
      data_quality: { source: 'Instant search preview · live stats loading', corehalla_enriched: false, live_fetch: false },
      updated_at: new Date().toISOString()
    },
    history: [],
    known_names: knownNames,
    background_refresh_recommended: true
  };
}

function writePlayerNavigationSeed(data) {
  try { sessionStorage.setItem(PLAYER_NAV_SEED_KEY, JSON.stringify({ saved_at: Date.now(), data })); }
  catch { /* session storage can be unavailable */ }
}

function readPlayerNavigationSeed(id) {
  try {
    const entry = JSON.parse(sessionStorage.getItem(PLAYER_NAV_SEED_KEY) || 'null');
    sessionStorage.removeItem(PLAYER_NAV_SEED_KEY);
    if (!entry?.data || Date.now() - Number(entry.saved_at || 0) > 2 * 60_000) return null;
    if (Number(entry.data?.player?.brawlhalla_id) !== Number(id)) return null;
    return entry.data;
  } catch { return null; }
}

function prefetchPlayerProfile(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) return Promise.resolve(null);
  const cached = readPlayerBrowserCache(numericId);
  const cacheAge = cached?.player?.updated_at ? Date.now() - new Date(cached.player.updated_at).getTime() : Infinity;
  if (cached && cacheAge < 2 * 60_000 && !cached.seed_only) return Promise.resolve(cached);
  if (state.playerPrefetches.has(numericId)) return state.playerPrefetches.get(numericId);
  const promise = fetch(`/api/player/${encodeURIComponent(numericId)}?fast=1&prefetch=1&_=${Date.now()}`, {
    cache: 'no-store',
    keepalive: true,
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
  })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      const complete = data?.player
        && !playerResponseIsPartial(data)
        && data.player.data_quality?.official_lifetime_ok
        && data.player.data_quality?.official_ranked_ok
        && data.player.data_quality?.official_guild_ok;
      if (complete) writePlayerBrowserCache(numericId, data);
      return data;
    })
    .catch(() => null)
    .finally(() => state.playerPrefetches.delete(numericId));
  state.playerPrefetches.set(numericId, promise);
  return promise;
}

function setupPlayerPrefetch(container, selector, datasetKey) {
  const buttons = [...container.querySelectorAll(selector)].filter((button) => button.dataset.prefetchBound !== '1');
  const warm = (button) => prefetchPlayerProfile(button.dataset[datasetKey]);
  for (const button of buttons) {
    button.dataset.prefetchBound = '1';
    button.addEventListener('pointerenter', () => warm(button), { once: true, passive: true });
    button.addEventListener('focus', () => warm(button), { once: true });
    button.addEventListener('touchstart', () => warm(button), { once: true, passive: true });
  }
}

async function fetchPlayerPortrait(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) return null;
  try {
    const data = await getJson(`/api/player/${encodeURIComponent(numericId)}/portrait`, { timeoutMs: 4200 });
    return data?.main_legend || null;
  } catch {
    return null;
  }
}

const PLAYER_PORTRAIT_CACHE_KEY = 'peakhalla-portrait-cache-v1';
const PLAYER_PORTRAIT_CACHE_AGE_MS = 24 * 60 * 60_000;

function readPlayerPortraitCache(ids = []) {
  const result = new Map();
  try {
    const all = JSON.parse(localStorage.getItem(PLAYER_PORTRAIT_CACHE_KEY) || '{}');
    const now = Date.now();
    for (const id of ids) {
      const entry = all[String(id)];
      if (entry?.legend && now - Number(entry.savedAt || 0) <= PLAYER_PORTRAIT_CACHE_AGE_MS) {
        result.set(Number(id), entry.legend);
      }
    }
  } catch {}
  return result;
}

function writePlayerPortraitCache(id, legend) {
  if (!legend || !Number(id)) return;
  try {
    const all = JSON.parse(localStorage.getItem(PLAYER_PORTRAIT_CACHE_KEY) || '{}');
    all[String(id)] = { savedAt: Date.now(), legend };
    const trimmed = Object.entries(all)
      .sort((a, b) => Number(b[1]?.savedAt || 0) - Number(a[1]?.savedAt || 0))
      .slice(0, 220);
    localStorage.setItem(PLAYER_PORTRAIT_CACHE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {}
}

async function fetchPlayerPortraitBatch(ids = []) {
  const uniqueIds = [...new Set(ids.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 80);
  if (!uniqueIds.length) return new Map();
  const result = readPlayerPortraitCache(uniqueIds);
  const missing = uniqueIds.filter((id) => !result.has(id));
  if (!missing.length) return result;
  try {
    const params = new URLSearchParams({ ids: missing.join(','), warm: '1' });
    const data = await getJson(`/api/players/portraits?${params}`, { timeoutMs: 3200 });
    for (const [rawId, legend] of Object.entries(data?.portraits || {})) {
      const id = Number(rawId);
      if (!legend) continue;
      result.set(id, legend);
      writePlayerPortraitCache(id, legend);
    }
  } catch {}
  return result;
}

function patchPlayerPortrait(button, legend, portraitSelector) {
  if (!button || !legend) return;
  const portrait = button.querySelector(portraitSelector);
  if (!portrait || button.dataset.needsPortrait !== '1') return;
  portrait.innerHTML = legendImageMarkup(legend, { lazy: false, fallbackName: legend.name });
  button.dataset.needsPortrait = '0';
  writePlayerPortraitCache(Number(button.dataset.playerId || button.dataset.leaderId || button.dataset.queuePlayerId), legend);
  const label = button.querySelector('.suggestion-copy small');
  if (label && !label.textContent.includes(':')) {
    const region = button.dataset.playerRegion || '—';
    label.textContent = `${legend.name || t('unknownLegend')} · ${region}`;
  }
  const fighterMain = button.querySelector('.fighter-main');
  if (fighterMain) fighterMain.textContent = `${t('main')}: ${legend.name || t('unknownLegend')}`;
  const leaderMeta = button.querySelector('.leader-legend-meta');
  if (leaderMeta) leaderMeta.textContent = legend.name || t('unknownLegend');
  if (button.matches?.('.queue-live-player')) {
    const queueMeta = button.querySelector(':scope > span:last-child small');
    if (queueMeta) queueMeta.textContent = legend.name || t('unknownLegend');
  }
  activateImageFallbacks(button);
}

function enrichRenderedPortraits(container, buttonSelector, portraitSelector, concurrency = 3) {
  if (!container) return;
  const targets = [...container.querySelectorAll(buttonSelector)]
    .filter((button) => button.dataset.needsPortrait === '1' && Number(button.dataset.playerId) > 0);
  if (!targets.length) return;

  (async () => {
    const batch = await fetchPlayerPortraitBatch(targets.map((button) => Number(button.dataset.playerId)));
    for (const button of targets) {
      const legend = batch.get(Number(button.dataset.playerId));
      if (legend && button.isConnected) patchPlayerPortrait(button, legend, portraitSelector);
    }

    const queue = targets.filter((button) => button.isConnected && button.dataset.needsPortrait === '1').slice(0, 12);
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const button = queue[cursor++];
        const id = Number(button.dataset.playerId);
        const legend = await fetchPlayerPortrait(id);
        if (!button.isConnected) continue;
        if (legend) {
          patchPlayerPortrait(button, legend, portraitSelector);
          continue;
        }
        const attempts = Number(button.dataset.portraitAttempts || 0) + 1;
        button.dataset.portraitAttempts = String(attempts);
        if (attempts < 3) {
          window.setTimeout(() => {
            if (button.isConnected && button.dataset.needsPortrait === '1') {
              enrichRenderedPortraits(container, buttonSelector, portraitSelector, 1);
            }
          }, 1200 + attempts * 900);
        } else {
          button.dataset.needsPortrait = '0';
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  })().catch(() => null);
}

function playerCard(item, player) {
  const mainLegend = player.main_legend; const rank = item.rank ? `#${number(item.rank)}` : '—';
  const matchedAliases = [...new Set((player.matched_aliases || []).filter((name) => normalize(name) !== normalize(player.username)))];
  const allAliases = [...new Set([
    ...matchedAliases,
    ...(player.known_names || []).map((item) => typeof item === 'string' ? item : item?.name)
  ].filter((name) => name && normalize(name) !== normalize(player.username)))];
  const matchLine = allAliases.length
    ? `<span class="fighter-alias-match"><span>${escapeHtml(t('knownNames'))}</span><b>${allAliases.slice(0, 10).map(escapeHtml).join(' · ')}</b></span>`
    : '';
  return `<button class="fighter-card" data-player-id="${Number(player.id)}" data-needs-portrait="${mainLegend ? '0' : '1'}">
    ${mainLegend ? portraitMarkup(mainLegend, 'fighter-portrait') : portraitMarkup(null, 'fighter-portrait', { fallbackName: player.username, localCandidates: false })}
    <span class="fighter-data">
      <span class="fighter-top"><span>${escapeHtml(item.region || '—')}</span><span>BH ${Number(player.id)}</span></span>
      <h3>${escapeHtml(player.username || 'Unknown')}</h3>
      ${matchLine}
      <span class="fighter-main">${escapeHtml(mainLegend ? `${t('main')}: ${mainLegend.name}` : t('unknownLegend'))}</span>
      <span class="fighter-metrics"><span>RANK<b>${rank}</b></span><span>${escapeHtml(t('currentElo'))}<b>${number(item.rating)}</b></span><span>${escapeHtml(t('peakElo'))}<b>${number(item.best_rating ?? item.peak_rating)}</b></span><span>${escapeHtml(t('wins'))}<b>${number(item.wins)}</b></span></span>
    </span>
  </button>`;
}

function warmVisiblePlayerProfiles(container, limit = 6) {
  if (!container) return;
  const ids = [...container.querySelectorAll('[data-player-id]')]
    .map((button) => Number(button.dataset.playerId))
    .filter((id, index, all) => Number.isSafeInteger(id) && id > 0 && all.indexOf(id) === index)
    .slice(0, limit);
  const run = async () => {
    let cursor = 0;
    const worker = async () => {
      while (cursor < ids.length) {
        const id = ids[cursor++];
        await prefetchPlayerProfile(id).catch(() => null);
      }
    };
    await Promise.all(Array.from({ length: Math.min(2, ids.length) }, worker));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(() => run(), { timeout: 900 });
  else window.setTimeout(run, 120);
}

function renderSearchResults(rankings = []) {
  els.resultsSection.hidden = false;
  const playerCount = rankings.reduce((sum, item) => sum + (item.players?.length || 0), 0);
  els.resultCount.textContent = `${number(playerCount)} ${playerCount === 1 ? t('result') : t('results')}`;
  if (!rankings.length) {
    els.resultsGrid.innerHTML = `<div class="no-results"><span>?</span><strong>${escapeHtml(t('noSearchResults'))}</strong></div>`;
    els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  state.playerSeeds.clear();
  const cards = [];
  for (const item of rankings) {
    for (const player of item.players || []) {
      const id = Number(player.id);
      state.playerSeeds.set(id, makePlayerSeedPayload(item, player));
      cards.push(playerCard(item, player));
    }
  }
  els.resultsGrid.innerHTML = cards.join('');
  els.resultsGrid.querySelectorAll('[data-player-id]').forEach((button) => button.addEventListener('click', () => {
    const id = Number(button.dataset.playerId);
    navigateToPlayer(id, state.playerSeeds.get(id));
  }));
  setupPlayerPrefetch(els.resultsGrid, '[data-player-id]', 'playerId');
  activateImageFallbacks();
  enrichRenderedPortraits(els.resultsGrid, '.fighter-card[data-player-id]', '.fighter-portrait', 4);
  warmVisiblePlayerProfiles(els.resultsGrid, 6);
  els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function statCard(label, value, note) { return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(note)}</small></article>`; }

const CANONICAL_WEAPON_NAMES = {
  hammer: 'Hammer',
  sword: 'Sword',
  blaster: 'Blasters',
  blasters: 'Blasters',
  pistol: 'Blasters',
  pistols: 'Blasters',
  lance: 'Rocket Lance',
  rocketlance: 'Rocket Lance',
  rocketlances: 'Rocket Lance',
  spear: 'Spear',
  katar: 'Katars',
  katars: 'Katars',
  axe: 'Axe',
  bow: 'Bow',
  gauntlet: 'Gauntlets',
  gauntlets: 'Gauntlets',
  fist: 'Gauntlets',
  fists: 'Gauntlets',
  scythe: 'Scythe',
  cannon: 'Cannon',
  orb: 'Orb',
  greatsword: 'Greatsword',
  greatswords: 'Greatsword',
  boot: 'Battle Boots',
  boots: 'Battle Boots',
  battleboot: 'Battle Boots',
  battleboots: 'Battle Boots',
  chakram: 'Chakram',
  chakrams: 'Chakram'
};

function canonicalWeaponName(name = '') {
  const raw = String(name || '').trim();
  if (!raw || raw === '—') return raw || '—';
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return CANONICAL_WEAPON_NAMES[key] || raw;
}

const WEAPON_ICON_FILES = Object.freeze({
  Hammer: 'hammer.svg',
  Sword: 'sword.svg',
  Blasters: 'blasters.svg',
  'Rocket Lance': 'rocket-lance.svg',
  Spear: 'spear.svg',
  Katars: 'katars.svg',
  Axe: 'axe.svg',
  Bow: 'bow.svg',
  Gauntlets: 'gauntlets.svg',
  Scythe: 'scythe.svg',
  Cannon: 'cannon.svg',
  Orb: 'orb.svg',
  Greatsword: 'greatsword.svg',
  'Battle Boots': 'battle-boots.svg',
  Chakram: 'chakram.svg'
});

function weaponGlyph(name = '') {
  const canonical = canonicalWeaponName(name);
  const map = {
    Hammer: 'H', Sword: 'S', Blasters: 'B', 'Rocket Lance': 'RL', Spear: 'SP', Katars: 'K', Axe: 'A', Bow: 'BW', Gauntlets: 'G', Scythe: 'SC', Cannon: 'C', Orb: 'O', Greatsword: 'GS', 'Battle Boots': 'BB', Chakram: 'CH'
  };
  return map[canonical] || '•';
}

function weaponIconMarkup(name = '') {
  const canonical = canonicalWeaponName(name);
  const file = WEAPON_ICON_FILES[canonical];
  const fallback = escapeHtml(weaponGlyph(canonical));
  if (!file) return `<span class="weapon-icon-fallback">${fallback}</span>`;
  return `<img class="weapon-icon-image" src="/assets/weapons/${file}" alt="" aria-hidden="true" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="weapon-icon-fallback" hidden>${fallback}</span>`;
}

function weaponSlug(name = '') {
  return canonicalWeaponName(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'weapon';
}

function showcaseMetric(title, value, meta = '', extra = '') {
  return `<article class="showcase-card showcase-metric"><span class="showcase-label">${escapeHtml(title)}</span><strong>${value}</strong>${meta ? `<small>${escapeHtml(meta)}</small>` : ''}${extra}</article>`;
}

function legendShowcase(topLegends = []) {
  const items = topLegends.slice(0, 3);
  return `<article class="showcase-card showcase-legends"><span class="showcase-label">${escapeHtml(t('topLegends'))}</span><div class="showcase-strip">${items.map((legend) => `<div class="mini-legend">${portraitMarkup(legend, 'mini-portrait')}<div><strong>${escapeHtml(legend.name)}</strong><small>${number(legend.games)} ${escapeHtml(t('games'))}</small></div></div>`).join('')}</div></article>`;
}

function weaponShowcase(weapons = []) {
  const items = weapons.slice(0, 3);
  return `<article class="showcase-card showcase-weapons"><span class="showcase-label">${escapeHtml(t('mainWeapons'))}</span><div class="weapon-grid">${items.map((weapon) => `<div class="weapon-tile weapon-${escapeHtml(weaponSlug(weapon.name))}"><span class="weapon-glyph">${weaponIconMarkup(weapon.name)}</span><div><strong>${escapeHtml(canonicalWeaponName(weapon.name))}</strong><small>${escapeHtml(weapon.time_held_display || '—')} · ${number(weapon.kos)} ${escapeHtml(t('kos'))}</small></div></div>`).join('')}</div></article>`;
}

function renderPlayerClan(guild) {
  if (!els.playerClanCard) return;
  const guildId = Number(guild?.guild_id);
  if (!Number.isSafeInteger(guildId) || guildId <= 0) {
    els.playerClanCard.hidden = true;
    els.playerClanCard.removeAttribute('data-clan-id');
    return;
  }
  const clanName = String(guild.guild_name || guild.name || `Clan ${guildId}`).trim();
  const role = clanRoleLabel(guild.rank || 'member');
  els.playerClanName.textContent = clanName;
  els.playerClanRole.textContent = `${role} · ID ${guildId}`;
  els.playerClanCard.dataset.clanId = String(guildId);
  els.playerClanCard.title = t('viewClanProfile');
  els.playerClanCard.hidden = false;
}

function renderAccountShowcase(player) {
  const xpPercent = Number.isFinite(Number(player.xp_percentage)) ? Number(player.xp_percentage) : null;
  const accountLevel = player.level === null || player.level === undefined ? t('notReported') : number(player.level);
  const xpValue = player.account_xp === null || player.account_xp === undefined ? t('notReported') : number(player.account_xp);
  const gameTimeValue = player.game_time_seconds > 0 ? player.game_time_display : t('notReported');
  const sourceNote = player.data_quality?.corehalla_enriched ? t('corehallaStats') : t('liveOfficialData');
  els.accountShowcase.innerHTML = [
    showcaseMetric(t('accountLevel'), accountLevel, sourceNote),
    showcaseMetric(t('accountXP'), xpValue, sourceNote),
    showcaseMetric(t('gameTime'), gameTimeValue, sourceNote),
    legendShowcase(player.top_legends || []),
    weaponShowcase(player.main_weapons || [])
  ].join('');
}

function lifetimeMetric(label, value, note = '', tone = 'default') {
  return `<article class="lifetime-metric lifetime-metric-${tone}"><span>${escapeHtml(label)}</span><strong>${value}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ''}</article>`;
}

function renderLifetimeSummary(totals = {}) {
  const kd = Number.isFinite(Number(totals.kd_ratio)) ? number(totals.kd_ratio) : '—';
  const damageRatio = Number.isFinite(Number(totals.damage_ratio)) ? number(totals.damage_ratio) : '—';
  const primary = [
    lifetimeMetric(t('totalGames'), number(totals.games), '', 'primary'),
    lifetimeMetric(t('totalWins'), number(totals.wins), '', 'primary'),
    lifetimeMetric(t('overallWinRate'), `${number(totals.win_rate)}%`, '', 'primary'),
    lifetimeMetric(t('gameTime'), totals.match_time_display || '—', '', 'primary'),
    lifetimeMetric(t('kos'), number(totals.kos), '', 'primary'),
    lifetimeMetric(t('damageDealt'), number(totals.damage_dealt), '', 'primary')
  ];
  const secondary = [
    lifetimeMetric(t('losses'), number(totals.losses)),
    lifetimeMetric(t('falls'), number(totals.falls)),
    lifetimeMetric(t('kdRatio'), kd),
    lifetimeMetric(t('damageTaken'), number(totals.damage_taken)),
    lifetimeMetric(t('damageRatio'), damageRatio),
    lifetimeMetric(t('suicides'), number(totals.suicides)),
    lifetimeMetric(t('teamKOs'), number(totals.team_kos)),
    lifetimeMetric(t('unarmedDamage'), number(totals.damage_unarmed)),
    lifetimeMetric(t('thrownDamage'), number(totals.damage_thrown_item)),
    lifetimeMetric(t('gadgetDamage'), number(totals.damage_gadgets)),
    lifetimeMetric(t('gadgetKOs'), number(totals.ko_gadgets)),
    lifetimeMetric(t('bombDamage'), number(totals.damage_bomb)),
    lifetimeMetric(t('mineDamage'), number(totals.damage_mine)),
    lifetimeMetric(t('spikeballDamage'), number(totals.damage_spikeball)),
    lifetimeMetric(t('sidekickDamage'), number(totals.damage_sidekick)),
    lifetimeMetric(t('snowballHits'), number(totals.hit_snowball)),
    lifetimeMetric(t('bombKOs'), number(totals.ko_bomb)),
    lifetimeMetric(t('mineKOs'), number(totals.ko_mine)),
    lifetimeMetric(t('sidekickKOs'), number(totals.ko_sidekick)),
    lifetimeMetric(t('snowballKOs'), number(totals.ko_snowball)),
    lifetimeMetric(t('spikeballKOs'), number(totals.ko_spikeball))
  ];
  els.lifetimeSummary.innerHTML = `<div class="lifetime-summary-primary">${primary.join('')}</div><div class="lifetime-summary-secondary">${secondary.join('')}</div>`;
}

function legendMetric(label, value) {
  return `<div class="legend-stat"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

function weaponDetail(stats = {}) {
  return `<article class="legend-weapon-card"><div class="legend-weapon-name"><span class="weapon-glyph">${weaponIconMarkup(stats.name)}</span><strong>${escapeHtml(canonicalWeaponName(stats.name || '—'))}</strong></div><div class="legend-mini-grid">${legendMetric(t('damageDealt'), number(stats.damage))}${legendMetric(t('kos'), number(stats.kos))}${legendMetric(t('gameTime'), escapeHtml(stats.time_held_display || '—'))}</div></article>`;
}

function lifetimeLegendCard(legend) {
  const rank = legend.ranked || {};
  const xpPercent = Number.isFinite(Number(legend.xp_percentage)) ? Number(legend.xp_percentage) : null;
  const xpBar = xpPercent !== null ? `<div class="legend-xp-bar"><div style="width:${Math.max(0, Math.min(100, xpPercent))}%"></div></div>` : '';
  return `<details class="lifetime-legend-card" data-legend-name="${escapeHtml(legend.name)}">
    <summary>
      ${portraitMarkup(legend, 'lifetime-legend-portrait', { lazy: Number(legend.games) <= 0 })}
      <div class="lifetime-legend-title"><strong>${escapeHtml(legend.name)}</strong><small>${escapeHtml(canonicalWeaponName(legend.weapon_one))} + ${escapeHtml(canonicalWeaponName(legend.weapon_two))}</small>${xpBar}</div>
      <div class="legend-head-metrics">
        ${legendMetric(t('games'), number(legend.games))}
        ${legendMetric(t('wins'), number(legend.wins))}
        ${legendMetric(t('winRate'), `${number(legend.win_rate)}%`)}
        ${legendMetric(t('level'), legend.level === null ? escapeHtml(t('notReported')) : number(legend.level))}
        ${legendMetric(t('gameTime'), escapeHtml(legend.match_time_display || '—'))}
      </div>
      <span class="details-chevron">⌄</span>
    </summary>
    <div class="lifetime-legend-details">
      <section><span class="legend-detail-title">${escapeHtml(t('lifetimeCombat'))}</span><div class="legend-detail-grid">
        ${legendMetric(t('xp'), legend.xp === null ? escapeHtml(t('notReported')) : number(legend.xp))}
        ${legendMetric(t('xpProgress'), legend.xp_percentage === null ? escapeHtml(t('notReported')) : `${number(legend.xp_percentage)}%`)}
        ${legendMetric(t('losses'), number(legend.losses))}
        ${legendMetric(t('kos'), number(legend.kos))}
        ${legendMetric(t('falls'), number(legend.falls))}
        ${legendMetric(t('kdRatio'), legend.kd_ratio === null ? '—' : number(legend.kd_ratio))}
        ${legendMetric(t('damageDealt'), number(legend.damage_dealt))}
        ${legendMetric(t('damageTaken'), number(legend.damage_taken))}
        ${legendMetric(t('damageRatio'), legend.damage_ratio === null ? '—' : number(legend.damage_ratio))}
        ${legendMetric(t('suicides'), number(legend.suicides))}
        ${legendMetric(t('teamKOs'), number(legend.team_kos))}
        ${legendMetric(t('unarmedDamage'), number(legend.damage_unarmed))}
        ${legendMetric(t('unarmedKOs'), number(legend.ko_unarmed))}
        ${legendMetric(t('thrownDamage'), number(legend.damage_thrown_item))}
        ${legendMetric(t('gadgetDamage'), number(legend.damage_gadgets))}
        ${legendMetric(t('gadgetKOs'), number(legend.ko_gadgets))}
      </div></section>
      <section><span class="legend-detail-title">${escapeHtml(t('weaponBreakdown'))}</span><div class="legend-weapons-detail">${weaponDetail(legend.weapon_one_stats)}${weaponDetail(legend.weapon_two_stats)}</div></section>
      <section><span class="legend-detail-title">${escapeHtml(t('seasonRanked'))}</span><div class="legend-detail-grid ranked-detail-grid">
        ${legendMetric(t('games'), number(rank.games))}
        ${legendMetric(t('wins'), number(rank.wins))}
        ${legendMetric('ELO', rank.rating === null ? '—' : number(rank.rating))}
        ${legendMetric(t('peak'), rank.peak_rating === null ? '—' : number(rank.peak_rating))}
        ${legendMetric(t('currentRank'), escapeHtml(rank.tier || '—'))}
      </div></section>
    </div>
  </details>`;
}

function renderLifetimeLegends() {
  const all = state.currentPlayer?.player?.lifetime_legends || [];
  const query = normalize(els.legendStatsSearch?.value || '');
  const filter = els.legendStatsFilter?.value || 'all';
  const sort = els.legendStatsSort?.value || 'games';
  const sortValues = {
    games: (legend) => legend.games,
    wins: (legend) => legend.wins,
    level: (legend) => legend.level ?? -1,
    xp: (legend) => legend.xp ?? -1,
    time: (legend) => legend.match_time_seconds,
    damage: (legend) => legend.damage_dealt,
    kos: (legend) => legend.kos
  };
  const filtered = all.filter((legend) => {
    if (filter === 'played' && Number(legend.games) <= 0) return false;
    if (!query) return true;
    return [legend.name, canonicalWeaponName(legend.weapon_one), canonicalWeaponName(legend.weapon_two)].some((value) => normalize(value).includes(query));
  }).sort((a, b) => (sortValues[sort]?.(b) || 0) - (sortValues[sort]?.(a) || 0) || a.name.localeCompare(b.name));
  const played = all.filter((legend) => Number(legend.games) > 0).length;
  els.lifetimeLegendsCount.textContent = `${number(all.length)} ${t('legendsTotal')} · ${number(played)} ${t('playedLegends')}`;
  els.lifetimeLegends.innerHTML = filtered.length ? filtered.map(lifetimeLegendCard).join('') : `<p class="empty-copy">${escapeHtml(t('noLifetimeStats'))}</p>`;
  activateImageFallbacks();
  registerScrollReveal(els.lifetimeLegends);
}

function renderHistory(history = []) {
  const chart = $('#history-chart'); const empty = $('#history-empty');
  const valid = history.filter((item) => Number.isFinite(Number(item.rating)));
  if (valid.length < 2) { chart.hidden = true; empty.hidden = false; return; }
  chart.hidden = false; empty.hidden = true;
  const min = Math.min(...valid.map((item) => item.rating)); const max = Math.max(...valid.map((item) => item.rating)); const spread = Math.max(max - min, 1);
  chart.innerHTML = valid.map((item) => { const height = 18 + ((item.rating - min) / spread) * 165; return `<div class="chart-column" title="${escapeHtml(item.date)} — ${number(item.rating)} Elo"><b>${number(item.rating)}</b><div class="chart-bar" style="height:${height}px"></div><span>${escapeHtml(item.date.slice(5))}</span></div>`; }).join('');
}

function renderKnownNames(names = [], currentName = '') {
  const unique = [];
  const seen = new Set();
  for (const item of names || []) {
    const cleanName = String(item?.name || '').normalize('NFKC').replace(/[-]/g, '').replace(/\s+/g, ' ').trim();
    if (!validHistoryName(cleanName)) continue;
    const key = normalize(cleanName);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...item, name: cleanName });
  }
  $('#aliases-count').textContent = `${number(unique.length)} ${unique.length === 1 ? t('nameSeen') : t('namesSeen')}`;
  const sorted = [...unique].sort((a, b) => {
    const aCurrent = normalize(a.name) === normalize(currentName) ? 1 : 0;
    const bCurrent = normalize(b.name) === normalize(currentName) ? 1 : 0;
    return (bCurrent - aCurrent) || (new Date(b.last_seen || 0) - new Date(a.last_seen || 0));
  });
  $('#aliases-list').innerHTML = sorted.length ? sorted.map((item, index) => {
    const current = normalize(item.name) === normalize(currentName);
    return `<div class="alias-row ${current ? 'current' : ''}"><span class="alias-index">${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(t('firstSeen'))}: ${escapeHtml(shortDate(item.first_seen))} · ${escapeHtml(t('lastSeen'))}: ${escapeHtml(shortDate(item.last_seen))}</small></div><span class="alias-state">${escapeHtml(current ? t('currentName') : t('previousName'))}</span></div>`;
  }).join('') : `<div class="alias-empty"><strong>${escapeHtml(currentName || '—')}</strong><span>${escapeHtml(t('knownNamesNote'))}</span></div>`;
}

function navigateToPlayer(id, seed = null) {
  if (!id) return;
  const preparedSeed = seed || state.playerSeeds.get(Number(id));
  if (preparedSeed) writePlayerNavigationSeed(preparedSeed);
  prefetchPlayerProfile(id);
  document.body.classList.add('page-leaving');
  window.setTimeout(() => { location.href = `/player/${encodeURIComponent(id)}`; }, 160);
}

function teammateCard(item) {
  const main = item.main_legend || { name: item.name };
  return `<button class="teammate-card" type="button" data-teammate-id="${Number(item.id)}" data-player-id="${Number(item.id)}" data-needs-portrait="${item.main_legend ? '0' : '1'}">
    ${portraitMarkup(main, 'teammate-portrait', { lazy: false })}
    <span class="teammate-copy">
      <span class="teammate-top"><b>${escapeHtml(item.name || 'Unknown')}</b><em>${escapeHtml(item.tier || item.team_tier || '—')}</em></span>
      <small>${escapeHtml(main?.name || t('unknownLegend'))}</small>
      <span class="teammate-stats teammate-team-only">
        <span><small>2V2 TEAM ELO</small><strong>${number(item.team_rating)}</strong><em>${escapeHtml(t('peak'))}: ${number(item.team_peak_rating)}</em></span>
        <span><small>${escapeHtml(t('games'))}</small><strong>${number(item.games)}</strong><em>${escapeHtml(t('wins'))}: ${number(item.wins)}</em></span>
      </span>
    </span>
    <span class="teammate-arrow">→</span>
  </button>`;
}

function makeTeammateSeedPayload(item = {}) {
  const id = Number(item.id);
  const name = String(item.name || `Player ${id}`);
  return {
    seed_only: true,
    player: {
      brawlhalla_id: id,
      name,
      level: null,
      xp_percentage: null,
      account_xp: null,
      game_time_seconds: 0,
      game_time_display: '—',
      lifetime_games: null,
      lifetime_wins: null,
      lifetime_win_rate: null,
      rating: null,
      peak_rating: null,
      tier: 'Loading…',
      region: item.region || '—',
      global_rank: null,
      region_ranks: [],
      ranked_games: null,
      ranked_wins: null,
      ranked_win_rate: null,
      main_legend: item.main_legend || null,
      top_legends: item.main_legend ? [{ ...item.main_legend, games: 0 }] : [],
      main_weapons: [],
      lifetime_totals: {},
      lifetime_legends: [],
      legends: [],
      guild: null,
      data_quality: { source: 'Instant 2v2 teammate preview · live profile loading', live_fetch: false },
      updated_at: new Date().toISOString()
    },
    history: [],
    known_names: [{ name, is_current: true }],
    background_refresh_recommended: true
  };
}

async function loadTeammates(id) {
  if (!els.teammatesGrid) return;
  const requestId = `${id}:${Date.now()}`;
  els.teammatesGrid.dataset.requestId = requestId;
  els.teammatesCount.textContent = '';
  els.teammatesGrid.innerHTML = `<div class="teammates-loading"><span>${escapeHtml(t('loadingTeammates'))}</span></div>`;
  try {
    let data = null;
    try {
      data = await getJson(`/api/player/${encodeURIComponent(id)}/teammates?_=${Date.now()}`, { timeoutMs: 32000 });
    } catch {
      data = null;
    }
    let teammates = data?.teammates || [];
    if (!teammates.length) {
      try {
        data = await getJson(`/api/player/${encodeURIComponent(id)}/teammates?refresh=1&_=${Date.now()}`, { timeoutMs: 45000 });
        teammates = data?.teammates || [];
      } catch {
        teammates = [];
      }
    }
    if (!els.teammatesGrid || els.teammatesGrid.dataset.requestId !== requestId) return;
    els.teammatesCount.textContent = teammates.length ? `${number(teammates.length)} ${t('twoVTwoPartners')}` : '';
    els.teammatesGrid.innerHTML = teammates.length ? teammates.map(teammateCard).join('') : `<p class="empty-copy">${escapeHtml(t('noTeammates'))}</p>`;
    const teammateSeeds = new Map(teammates.map((item) => [Number(item.id), makeTeammateSeedPayload(item)]));
    els.teammatesGrid.querySelectorAll('[data-teammate-id]').forEach((button) => button.addEventListener('click', () => {
      const teammateId = Number(button.dataset.teammateId);
      navigateToPlayer(teammateId, teammateSeeds.get(teammateId));
    }));
    stabilizeLegendImages(els.teammatesGrid);
    enrichRenderedPortraits(els.teammatesGrid, '.teammate-card', '.teammate-portrait', 4);
    registerScrollReveal(els.teammatesPanel);
  } catch {
    if (!els.teammatesGrid || els.teammatesGrid.dataset.requestId !== requestId) return;
    els.teammatesCount.textContent = '';
    els.teammatesGrid.innerHTML = `<p class="empty-copy">${escapeHtml(t('noTeammates'))}</p>`;
  }
}

function renderProfileAliases(names = [], currentName = '') {
  if (!els.profileAliases) return;
  const unique = [];
  const seen = new Set();
  const push = (value, isCurrent = false) => {
    const name = String(value || '').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
    if (!validHistoryName(name)) return;
    const key = normalize(name);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({ name, isCurrent: isCurrent || key === normalize(currentName) });
  };
  push(currentName, true);
  for (const item of names || []) push(item?.name || item, Boolean(item?.is_current));
  if (!unique.length) {
    els.profileAliases.hidden = true;
    els.profileAliases.innerHTML = '';
    return;
  }
  els.profileAliases.innerHTML = unique.slice(0, 10).map((item, index) => `<span class="profile-alias-chip ${item.isCurrent ? 'current' : ''}" style="--alias-index:${index}">${escapeHtml(item.name)}${item.isCurrent ? `<small>${escapeHtml(t('currentName'))}</small>` : ''}</span>`).join('');
  els.profileAliases.hidden = false;
}

function renderPlayer(data, shouldScroll = true, renderOptions = {}) {
  state.currentPlayer = data;
  const { player, history, known_names: knownNames = [] } = data;
  const profileUrl = `${location.origin}/player/${encodeURIComponent(player.brawlhalla_id)}`;
  const profileTitle = `${player.name} Brawlhalla Stats, ELO & Legends | PeakHalla`;
  const profileDescription = `View ${player.name}'s live Brawlhalla stats, current and peak ELO, ranked tier, legends, account XP, clans, aliases, and 2v2 teams.`;
  document.title = profileTitle;
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) canonicalLink.href = profileUrl;
  const seoValues = [
    ['meta[name="description"]', 'content', profileDescription],
    ['meta[property="og:title"]', 'content', profileTitle],
    ['meta[property="og:description"]', 'content', profileDescription],
    ['meta[property="og:url"]', 'content', profileUrl],
    ['meta[name="twitter:title"]', 'content', profileTitle],
    ['meta[name="twitter:description"]', 'content', profileDescription]
  ];
  for (const [selector, attribute, value] of seoValues) {
    const node = document.querySelector(selector);
    if (node) node.setAttribute(attribute, value);
  }
  const partial = playerResponseIsPartial(data);
  const rankedVerified = Boolean(player.data_quality?.official_ranked_ok);
  const lifetimeVerified = Boolean(player.data_quality?.official_lifetime_ok || player.data_quality?.corehalla_enriched);
  const hasLifetimePreview = lifetimeVerified || (player.account_xp !== null && player.account_xp !== undefined) || Boolean(player.main_legend) || Number(player.lifetime_games || 0) > 0;
  const updatingLabel = state.language === 'ar' ? 'جارٍ التحديث…' : 'UPDATING…';
  els.profile.hidden = false;
  els.profile.dataset.liveState = partial ? 'refreshing' : 'current';
  const avatar = $('#player-avatar');
  avatar.innerHTML = player.main_legend ? legendImageMarkup(player.main_legend, { lazy: false, fallbackName: player.name }) : `<span>${escapeHtml(initials(player.name))}</span>`;
  $('#main-legend-label').textContent = player.main_legend ? `${t('main')}: ${player.main_legend.name}` : (partial ? t('refreshingLiveStats') : t('unknownLegend'));
  const hasCurrentElo = player.rating !== null && player.rating !== undefined && player.rating !== '' && Number.isFinite(Number(player.rating));
  const hasPeakElo = player.peak_rating !== null && player.peak_rating !== undefined && player.peak_rating !== '' && Number.isFinite(Number(player.peak_rating));
  const tierText = partial && !rankedVerified && !hasCurrentElo ? updatingLabel : (player.tier || 'Unranked');
  $('#player-title').textContent = player.name; $('#player-id').textContent = player.brawlhalla_id; $('#player-region').textContent = player.region || '—'; $('#player-tier').textContent = tierText; $('#player-rating').textContent = number(player.rating); $('#updated-at').textContent = dateTime(player.updated_at); renderProfileAliases(knownNames, player.name);
  if (els.statsSourceNote) { els.statsSourceNote.title = `${player.data_quality?.source || 'Brawlhalla Developer API v1'} · ${dateTime(player.data_quality?.fetched_at || player.updated_at)}`; const label = els.statsSourceNote.querySelector('span'); if (label) label.textContent = partial ? t('refreshingLiveStats') : (player.data_quality?.corehalla_enriched ? t('corehallaStats') : t('liveOfficialData')); }
  if (els.statsAccuracyNote) els.statsAccuracyNote.textContent = t('statsAccuracyNote');
  const currentElo = hasCurrentElo ? Number(player.rating) : NaN;
  const peakElo = hasPeakElo ? Number(player.peak_rating) : NaN;
  if (els.playerPeakRating) els.playerPeakRating.textContent = Number.isFinite(peakElo) ? number(peakElo) : '—';
  const eloGap = Number.isFinite(currentElo) && Number.isFinite(peakElo) ? Math.max(0, peakElo - currentElo) : null;
  if (els.eloGap) els.eloGap.textContent = eloGap === null ? '—' : (eloGap === 0 ? t('atPeak') : `${number(eloGap)} ${t('offPeak')}`);
  const progress = Number.isFinite(currentElo) && Number.isFinite(peakElo) && peakElo > 0 ? Math.max(8, Math.min(100, (currentElo / peakElo) * 100)) : 0;
  if (els.rankProgressFill) requestAnimationFrame(() => { els.rankProgressFill.style.width = `${progress}%`; });
  renderPlayerClan(player.guild);
  renderAccountShowcase(player);
  if (partial && !hasLifetimePreview) els.lifetimeSummary.innerHTML = `<p class="empty-copy">${escapeHtml(t('refreshingLiveStats'))}</p>`;
  else renderLifetimeSummary(player.lifetime_totals || {});
  const rankedFallback = partial && !rankedVerified;
  $('#stats-grid').innerHTML = [
    statCard(t('globalRank'), player.global_rank ? `#${number(player.global_rank)}` : '—', 'WORLD POSITION'),
    statCard(t('rankedGames'), rankedFallback ? '—' : number(player.ranked_games), 'CURRENT SEASON'),
    statCard(t('rankedWins'), rankedFallback ? '—' : number(player.ranked_wins), 'CURRENT SEASON'),
    statCard(t('winRate'), rankedFallback ? '—' : `${number(player.ranked_win_rate)}%`, 'CURRENT SEASON')
  ].join('');
  const regionalRank = player.region_ranks?.find((rank) => rank.region === player.region)?.rank;
  const lifetimePlaceholder = partial && !hasLifetimePreview;
  $('#player-summary').innerHTML = `<div><dt>${escapeHtml(t('accountLevel'))}</dt><dd>${lifetimePlaceholder ? '—' : number(player.level)}</dd></div><div><dt>${escapeHtml(t('regionRank'))}</dt><dd>${regionalRank ? `#${number(regionalRank)}` : '—'}</dd></div><div><dt>${escapeHtml(t('totalGames'))}</dt><dd>${lifetimePlaceholder ? '—' : number(player.lifetime_games)}</dd></div><div><dt>${escapeHtml(t('totalWins'))}</dt><dd>${lifetimePlaceholder ? '—' : number(player.lifetime_wins)}</dd></div><div><dt>${escapeHtml(t('overallWinRate'))}</dt><dd>${lifetimePlaceholder ? '—' : `${number(player.lifetime_win_rate)}%`}</dd></div>`;
  const legends = player.legends || [];
  $('#legends-count').textContent = partial && !rankedVerified ? t('refreshingLiveStats') : `${number(legends.length)} ${legends.length === 1 ? t('legendUsed') : t('legendsUsed')}`;
  $('#legends-body').innerHTML = legends.length ? legends.map((legend) => `<tr><td><span class="legend-name">${portraitMarkup(legend, 'legend-icon')}<span>${escapeHtml(legend.name)}</span></span></td><td>${escapeHtml(canonicalWeaponName(legend.weapon_one))} + ${escapeHtml(canonicalWeaponName(legend.weapon_two))}</td><td>${number(legend.games)}</td><td>${number(legend.wins)}</td><td class="rate">${number(legend.win_rate)}%</td><td>${number(legend.rating)}</td><td>${number(legend.peak_rating)}</td></tr>`).join('') : `<tr><td colspan="7" class="empty-copy">${escapeHtml(partial && !rankedVerified ? t('refreshingLiveStats') : t('noRankedLegends'))}</td></tr>`;
  renderHistory(history);
  renderLifetimeLegends();
  stabilizeLegendImages(els.profile);
  registerScrollReveal(els.profile);
  if (renderOptions.refreshSecondary !== false) loadTeammates(player.brawlhalla_id);
  if (shouldScroll) els.profile.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mergeRankedPreview(data, preview) {
  if (!data?.player || !preview?.player) return data;
  const source = preview.player;
  const target = data.player;
  const rankedFields = [
    'rating', 'peak_rating', 'tier', 'region', 'global_rank', 'region_ranks',
    'ranked_games', 'ranked_wins', 'ranked_win_rate'
  ];

  // Cached navigation data may fill a temporarily missing field, but it must
  // never overwrite a fresh official value. The old behavior was responsible
  // for profiles showing stale ranks such as #1 after the leaderboard showed #2.
  for (const field of rankedFields) {
    const current = target[field];
    const missing = current === undefined || current === null || current === '' || current === '—'
      || (typeof current === 'number' && !Number.isFinite(current));
    if (missing && source[field] !== undefined && source[field] !== null && source[field] !== '' && source[field] !== '—') {
      target[field] = source[field];
    }
  }
  if ((!target.name || /^Player\s+\d+$/i.test(target.name)) && source.name) target.name = source.name;
  if (!target.main_legend && source.main_legend) target.main_legend = source.main_legend;
  if (!(target.top_legends || []).length && (source.top_legends || []).length) target.top_legends = source.top_legends;
  if (!(target.main_weapons || []).length && (source.main_weapons || []).length) target.main_weapons = source.main_weapons;
  // Guild membership is intentionally never restored from a cached preview.
  // A fresh null means the player left the clan and must clear the old card.
  target.updated_at = target.updated_at || source.updated_at;
  return data;
}

function playerResponseIsPartial(data) {
  return Boolean(data?.partial || data?.player?.data_quality?.partial);
}

function currentRenderedPlayerId() {
  return Number(state.currentPlayer?.player?.brawlhalla_id || 0);
}

function schedulePlayerLiveRefresh(id, delayMs = 250) {
  window.clearTimeout(state.playerAutoRefreshTimer);
  state.playerAutoRefreshTimer = window.setTimeout(() => {
    if (currentRenderedPlayerId() && currentRenderedPlayerId() !== Number(id)) return;
    loadPlayer(id, { background: true, shouldScroll: false, silent: true, autoVerify: false }).catch(() => null);
  }, Math.max(50, Number(delayMs) || 250));
}

function schedulePlayerLivePoll(id) {
  window.clearTimeout(state.playerLivePollTimer);
  state.playerLivePollTimer = window.setTimeout(() => {
    if (document.visibilityState !== 'visible' || currentRenderedPlayerId() !== Number(id)) return;
    loadPlayer(id, { background: true, shouldScroll: false, silent: true, autoVerify: false }).catch(() => null);
  }, 90_000);
}

async function loadPlayer(id, options = {}) {
  const playerId = Number(id);
  if (!Number.isSafeInteger(playerId) || playerId <= 0) return null;
  const silent = Boolean(options.silent);
  const manualRefresh = Boolean(options.refresh);
  const backgroundRefresh = Boolean(options.background);
  const requestSequence = ++state.playerRequestSequence;
  let renderedInstantData = false;
  let renderedSeedOnly = false;

  try {
    if (!silent && !manualRefresh && !backgroundRefresh) {
      state.playerRetryCount = 0;
      window.clearTimeout(state.playerAutoRefreshTimer);
      window.clearTimeout(state.playerLivePollTimer);
      const cached = readPlayerNavigationSeed(playerId) || readPlayerBrowserCache(playerId);
      if (cached) {
        renderedSeedOnly = Boolean(cached.seed_only);
        renderPlayer(cached, options.shouldScroll !== false, { refreshSecondary: !renderedSeedOnly });
        state.playerSignature = playerPayloadSignature(cached);
        renderedInstantData = true;
        hideStatus();
      }
    }

    if (!silent && !renderedInstantData) {
      showStatus(manualRefresh ? t('refreshingLiveStats') : t('loadingPlayer'));
    }

    const params = new URLSearchParams({
      [manualRefresh ? 'refresh' : (backgroundRefresh ? 'live' : 'fast')]: '1',
      _: String(Date.now())
    });

    if (manualRefresh) {
      state.playerRefreshController?.abort();
      state.playerRefreshController = new AbortController();
    }

    const timeoutMs = manualRefresh ? 70_000 : (backgroundRefresh ? 60_000 : 24_000);
    let data = await getJson(`/api/player/${encodeURIComponent(playerId)}?${params}`, {
      signal: manualRefresh ? state.playerRefreshController.signal : undefined,
      timeoutMs
    });

    // Ignore a slow response from a profile the user has already left.
    if (requestSequence !== state.playerRequestSequence) return data;

    const currentPreview = currentRenderedPlayerId() === playerId ? state.currentPlayer : null;
    data = mergeRankedPreview(data, currentPreview);
    const partial = playerResponseIsPartial(data);

    // Only save a profile locally after all current official sources answered.
    // This prevents a temporary API timeout from being remembered as
    // "Unranked", "Main unknown", or an empty account until the next refresh.
    if (data?.player && !partial
      && data.player.data_quality?.official_lifetime_ok
      && data.player.data_quality?.official_ranked_ok
      && data.player.data_quality?.official_guild_ok) {
      writePlayerBrowserCache(playerId, data);
    }

    if (!silent) hideStatus();
    const signature = playerPayloadSignature(data);
    const changed = signature !== state.playerSignature;
    const shouldRender = silent ? changed : (!renderedInstantData || changed || manualRefresh);
    if (shouldRender) {
      renderPlayer(data, renderedInstantData ? false : options.shouldScroll !== false, {
        refreshSecondary: !silent && (!renderedInstantData || renderedSeedOnly)
      });
      state.playerSignature = signature;
    } else {
      state.currentPlayer = data;
    }
    history.replaceState(null, '', `/player/${encodeURIComponent(playerId)}`);

    if (partial) {
      state.playerRetryCount += 1;
      if (state.playerRetryCount <= 4) {
        const serverDelay = Number(data?.retry_after_ms || 0);
        const retryDelays = [350, 1_500, 4_000, 10_000];
        const delay = Math.max(serverDelay, retryDelays[Math.min(state.playerRetryCount - 1, retryDelays.length - 1)]);
        schedulePlayerLiveRefresh(playerId, delay);
      }
    } else {
      state.playerRetryCount = 0;
      schedulePlayerLivePoll(playerId);
    }

    // The first response is optimized for speed. Always follow it with one
    // longer live verification so the page updates without a browser refresh.
    if (options.autoVerify !== false && !manualRefresh && !backgroundRefresh) {
      schedulePlayerLiveRefresh(playerId, Number(data?.retry_after_ms || 220));
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') return null;
    if (requestSequence !== state.playerRequestSequence) return null;

    if (silent || backgroundRefresh) {
      state.playerRetryCount += 1;
      if (state.playerRetryCount <= 4 && currentRenderedPlayerId() === playerId) {
        const retryDelays = [1_000, 3_000, 8_000, 15_000];
        schedulePlayerLiveRefresh(playerId, retryDelays[Math.min(state.playerRetryCount - 1, retryDelays.length - 1)]);
      }
      return state.currentPlayer;
    }

    if (renderedInstantData) {
      hideStatus();
      schedulePlayerLiveRefresh(playerId, 1_200);
      return state.currentPlayer;
    }
    els.profile.hidden = true;
    showStatus(error?.message || t('friendlyProblem'), 'error');
    els.status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return null;
  }
}

async function searchPlayer(event) {
  event.preventDefault(); const q = els.name.value.trim(); const button = els.form.querySelector('button[type="submit"]');
  if (q.length < 2) return;
  try { button.disabled = true; showStatus(t('searching')); const params = new URLSearchParams({ q }); const data = await getJson(`/api/search?${params}`); hideStatus(); renderSearchResults(data.rankings || []); }
  catch { hideStatus(); renderSearchResults([]); } finally { button.disabled = false; }
}

function leaderboardPerson(player, region) {
  const main = player.main_legend;
  const readableRegion = regionLabel(region);
  const regionCode = String(region || '—').toUpperCase();
  const regionTitle = readableRegion && readableRegion !== regionCode ? `${readableRegion} · ${regionCode}` : regionCode;
  return `<div class="leader-person" data-player-id="${Number(player.id)}" data-needs-portrait="${main ? '0' : '1'}">${main ? portraitMarkup(main, 'row-portrait') : portraitMarkup(null, 'row-portrait', { fallbackName: player.username, localCandidates: false })}<button data-leader-id="${Number(player.id)}"><span class="leader-name-line"><strong>${escapeHtml(player.username || 'Unknown')}</strong></span><span class="leader-meta-line"><small class="leader-legend-meta">${escapeHtml(main ? main.name : 'Brawlhalla')}</small><span class="leader-region-chip" title="${escapeHtml(regionTitle)}">${escapeHtml(regionCode)}</span></span></button></div>`;
}

function renderLeaderboardRows(rankings = [], options = {}) {
  const append = Boolean(options.append);
  const activeRegion = els.leaderboardRegion?.value || 'ALL';
  const rankScope = activeRegion === 'ALL' ? '' : activeRegion;
  const markup = rankings.map((item) => {
    const wins = Math.max(0, Number(item.wins) || 0);
    const reportedLosses = Number(item.losses);
    const reportedGames = Number(item.games);
    const losses = Number.isFinite(reportedLosses)
      ? Math.max(0, reportedLosses)
      : Math.max(0, (Number.isFinite(reportedGames) ? reportedGames : wins) - wins);
    const games = Number.isFinite(reportedGames) ? Math.max(0, reportedGames) : wins + losses;
    const safeGames = Math.max(games, wins + losses);
    const winRate = safeGames ? ((wins / safeGames) * 100).toFixed(1) : '0.0';
    const winWidth = safeGames ? ((wins / safeGames) * 100).toFixed(2) : '0';
    const lossWidth = safeGames ? ((losses / safeGames) * 100).toFixed(2) : '0';
    const recordTitle = `${number(safeGames)} ${t('games')} · ${number(wins)}W · ${number(losses)}L`;
    const playersMarkup = (item.players || []).map((player) => {
      state.playerSeeds.set(Number(player.id), makePlayerSeedPayload(item, player));
      return leaderboardPerson(player, item.region || '—');
    }).join('');
    const rankTitle = activeRegion === 'ALL' ? t('globalRank') : `${t('regionRank')} · ${regionLabel(activeRegion)}`;
    return `<div class="leader-row"><span class="leader-rank" title="${escapeHtml(rankTitle)}">${rankScope ? `<small>${escapeHtml(rankScope)}</small>` : ''}<b>#${number(item.rank)}</b></span><div class="leader-players">${playersMarkup}</div><div class="leader-metric leader-elo-metric"><span>ELO</span><b>${number(item.rating)}</b></div><div class="leader-metric leader-peak-metric"><span>${escapeHtml(t('peak'))}</span><b>${number(item.best_rating)}</b></div><div class="leader-metric leader-games-metric" title="${escapeHtml(recordTitle)}" aria-label="${escapeHtml(recordTitle)}"><span>${escapeHtml(t('games'))}</span><b>${number(safeGames)}</b><div class="leader-record-stack"><div class="leader-record-bar"><i class="leader-record-fill leader-record-fill-win" style="width:${winWidth}%"></i><i class="leader-record-fill leader-record-fill-loss" style="width:${lossWidth}%"></i></div><div class="leader-record-labels"><small class="leader-win-label"><strong>${number(wins)}</strong>W</small><small class="leader-loss-label"><strong>${number(losses)}</strong>L</small></div></div></div><div class="leader-metric leader-winrate-metric"><span>${escapeHtml(t('winRate'))}</span><b>${winRate}%</b></div><span class="tier-chip">${escapeHtml(item.tier || 'Unranked')}</span></div>`;
  }).join('');

  if (append) {
    if (markup) els.leaderboard.insertAdjacentHTML('beforeend', markup);
  } else {
    els.leaderboard.innerHTML = markup || `<p class="empty-copy">${escapeHtml(t('emptyData'))}</p>`;
  }

  els.leaderboard.querySelectorAll('[data-leader-id]:not([data-leader-bound])').forEach((button) => {
    button.dataset.leaderBound = '1';
    button.addEventListener('click', () => {
      const id = Number(button.dataset.leaderId);
      navigateToPlayer(id, state.playerSeeds.get(id));
    });
  });
  setupPlayerPrefetch(els.leaderboard, '[data-leader-id]', 'leaderId');
  activateImageFallbacks();
  enrichRenderedPortraits(els.leaderboard, '.leader-person[data-player-id]', '.row-portrait', 5);
  if (!append) {
    els.leaderboard.classList.remove('leaderboard-mode-enter');
    requestAnimationFrame(() => els.leaderboard.classList.add('leaderboard-mode-enter'));
  }
}

function updateLeaderboardPagination({ query = '', page = 1, totalPages = 1, received = 0 } = {}) {
  const isSearch = query.length >= 2;
  const loadedRows = els.leaderboard?.querySelectorAll('.leader-row').length || 0;
  const hasMore = !isSearch && received > 0 && (totalPages > 0 ? page < totalPages : received >= 20);
  state.leaderboardPage = page;
  state.leaderboardTotalPages = totalPages || page;
  if (els.leaderboardLoadMore) {
    els.leaderboardLoadMore.hidden = !hasMore;
    els.leaderboardLoadMore.disabled = false;
    const label = els.leaderboardLoadMore.querySelector('span');
    if (label) label.textContent = t('loadMorePlayers');
  }
  if (els.leaderboardPageStatus) {
    els.leaderboardPageStatus.textContent = !isSearch && loadedRows ? `${number(loadedRows)} ${t('playersShown')}` : '';
  }
}

function leaderboardBrowserCacheKey(region, mode, page = 1) {
  return `peakhalla-leaderboard:${region}:${mode}:${page}`;
}

function readLeaderboardBrowserCache(region, mode, page = 1) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(leaderboardBrowserCacheKey(region, mode, page)) || 'null');
    if (!cached?.rankings || Date.now() - Number(cached.savedAt || 0) > 5 * 60_000) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeLeaderboardBrowserCache(region, mode, page, data) {
  try {
    sessionStorage.setItem(leaderboardBrowserCacheKey(region, mode, page), JSON.stringify({
      savedAt: Date.now(),
      rankings: data.rankings || [],
      total_pages: Number(data.total_pages) || 0
    }));
  } catch {}
}

async function loadLeaderboard(options = {}) {
  const append = Boolean(options.append);
  const region = els.leaderboardRegion?.value || 'ALL';
  const mode = els.leaderboardMode?.value || '1v1';
  const query = els.leaderboardSearch?.value.trim() || '';
  const page = append ? state.leaderboardPage + 1 : 1;
  if (append && (state.leaderboardLoadingMore || query.length >= 2)) return;

  els.leaderboardTitle.textContent = query.length >= 2
    ? `${t('leaderboardSearchTitle')} · ${query} · ${regionLabel(region)}`
    : `${t('leaderboardPrefix')} ${regionLabel(region)}`;

  let cachedBoard = null;
  if (!append && query.length < 2) {
    cachedBoard = readLeaderboardBrowserCache(region, mode, page);
    if (cachedBoard) {
      renderLeaderboardRows(cachedBoard.rankings || [], { append: false });
      updateLeaderboardPagination({ query, page, totalPages: cachedBoard.total_pages || 0, received: (cachedBoard.rankings || []).length });
    }
  }

  if (!append) {
    if (!cachedBoard) els.leaderboard.innerHTML = '<div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div>';
    if (els.leaderboardLoadMore && !cachedBoard) els.leaderboardLoadMore.hidden = true;
    if (els.leaderboardPageStatus && !cachedBoard) els.leaderboardPageStatus.textContent = '';
  } else {
    state.leaderboardLoadingMore = true;
    if (els.leaderboardLoadMore) {
      els.leaderboardLoadMore.disabled = true;
      const label = els.leaderboardLoadMore.querySelector('span');
      if (label) label.textContent = t('loadingMorePlayers');
    }
  }

  state.leaderboardSearchController?.abort();
  state.leaderboardSearchController = new AbortController();
  try {
    const params = new URLSearchParams(query.length >= 2
      ? { q: query, region, mode }
      : { region, mode, page: String(page) });
    const endpoint = query.length >= 2 ? '/api/search' : '/api/leaderboard';
    const response = await fetch(`${endpoint}?${params}`, { headers: { Accept: 'application/json' }, signal: state.leaderboardSearchController.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t('fetchError'));
    const rankings = data.rankings || [];
    renderLeaderboardRows(rankings, { append });
    updateLeaderboardPagination({ query, page, totalPages: Number(data.total_pages) || 0, received: rankings.length });
    if (query.length < 2) writeLeaderboardBrowserCache(region, mode, page, data);
  } catch (error) {
    if (error.name === 'AbortError') return;
    if (!append) els.leaderboard.innerHTML = `<p class="empty-copy">${escapeHtml(t('friendlyProblem'))}</p>`;
  } finally {
    state.leaderboardLoadingMore = false;
    if (append && els.leaderboardLoadMore?.disabled) {
      els.leaderboardLoadMore.disabled = false;
      const label = els.leaderboardLoadMore.querySelector('span');
      if (label) label.textContent = t('loadMorePlayers');
    }
  }
}

function scheduleLeaderboardSearch() {
  window.clearTimeout(state.leaderboardSearchTimer);
  state.leaderboardSearchTimer = window.setTimeout(loadLeaderboard, 280);
}


function clanDate(timestamp) {
  if (!Number(timestamp)) return '—';
  const milliseconds = Number(timestamp) > 10_000_000_000 ? Number(timestamp) : Number(timestamp) * 1000;
  return new Date(milliseconds).toLocaleDateString(state.language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function clanCard(guild, index) {
  return `<button class="clan-card clan-card-xp-only" type="button" data-clan-id="${Number(guild.guild_id)}" style="--clan-delay:${Math.min(index, 15) * 42}ms">
    <span class="clan-rank">${guild.rank ? `#${number(guild.rank)}` : '—'}</span>
    <span class="clan-card-copy"><span class="clan-name-line"><strong>${escapeHtml(guild.name || `Clan ${guild.guild_id}`)}</strong>${guild.is_recruiting ? `<em class="open">${escapeHtml(t('clanRecruiting'))}</em>` : ''}</span><small>ID ${number(guild.guild_id)}</small></span>
    <span class="clan-card-xp"><small>${escapeHtml(t('clanXp'))}</small><b>${number(guild.xp, '0')}</b></span>
    <span class="clan-arrow">→</span>
  </button>`;
}

function scheduleClanSectionLoad() {
  if (isStandalonePlayerPage || isClanPage || isLiveQueuePage || isArenaPage || state.clansLoadStarted || state.clansData || !els.clansGrid) return;
  const section = document.querySelector('#clans');
  if (!section || !('IntersectionObserver' in window)) {
    state.clansLoadStarted = true;
    loadClans();
    return;
  }
  if (state.clansObserver) return;
  state.clansObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    state.clansObserver?.disconnect();
    state.clansObserver = null;
    state.clansLoadStarted = true;
    loadClans();
  }, { rootMargin: '500px 0px' });
  state.clansObserver.observe(section);
}

function renderClans(data = {}) {
  state.clansData = data;
  const guilds = [...(data.guilds || [])].sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0));
  if (els.clansUpdated) els.clansUpdated.textContent = data.updated_at ? `${t('clanUpdated')}: ${shortDate(data.updated_at)}` : '';
  if (!els.clansGrid) return;
  els.clansGrid.innerHTML = guilds.length ? guilds.map(clanCard).join('') : `<p class="empty-copy">${escapeHtml(t('clanNoData'))}</p>`;
  els.clansGrid.querySelectorAll('[data-clan-id]').forEach((button) => button.addEventListener('click', () => openClan(Number(button.dataset.clanId))));
}

async function loadClans(options = {}) {
  if (!els.clansGrid || isStandalonePlayerPage) return;
  state.clansLoadStarted = true;
  const query = els.clansSearch?.value.trim() || '';
  state.clansController?.abort();
  const controller = new AbortController();
  state.clansController = controller;
  let timedOut = false;
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
  if (!state.clansData || options.refresh) els.clansGrid.innerHTML = `<div class="clans-loading"><span></span><strong>${escapeHtml(t('clanLoading'))}</strong></div>`;
  try {
    const params = new URLSearchParams({ limit: '24' });
    if (query) params.set('q', query);
    if (options.refresh) params.set('refresh', '1');
    const response = await fetch(`/api/clans/top?${params}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t('fetchError'));
    renderClans(data);
  } catch (error) {
    if (error.name === 'AbortError' && !timedOut) return;
    els.clansGrid.innerHTML = `<p class="empty-copy">${escapeHtml(t('friendlyProblem'))}</p>`;
  } finally {
    window.clearTimeout(timer);
    if (state.clansController === controller) state.clansController = null;
  }
}

function clanRoleClass(role = '') {
  const key = normalize(role);
  if (key === 'leader') return 'leader';
  if (key === 'officer') return 'officer';
  if (key === 'recruit') return 'recruit';
  return 'member';
}

function clanRoleLabel(role = '') {
  const key = clanRoleClass(role);
  return {
    recruit: t('clanRecruit'),
    member: t('clanMember'),
    officer: t('clanOfficer'),
    leader: t('clanLeader')
  }[key];
}

function closeClanModal() {
  if (!els.clanModal) return;
  els.clanModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function openClan(guildId) {
  if (!guildId) return;
  document.body.classList.add('page-leaving');
  window.setTimeout(() => { location.href = `/clan/${encodeURIComponent(guildId)}`; }, 230);
}

function renderClanPage(data = {}) {
  if (!els.clanPage) return;
  state.selectedClan = data;
  const guild = data.guild || {};
  const roleOrder = { Recruit: 0, Member: 1, Officer: 2, Leader: 3 };
  const members = [...(data.members || [])].sort((left, right) =>
    (roleOrder[left.rank] ?? 1) - (roleOrder[right.rank] ?? 1)
    || Number(right.xp || 0) - Number(left.xp || 0)
  );
  els.clanPage.hidden = false;
  els.clanPageName.textContent = guild.name || `Clan ${standaloneClanId || ''}`;
  els.clanPageMeta.textContent = [
    guild.rank ? `${t('clanRank')} #${number(guild.rank)}` : null,
    `Guild ID ${number(guild.guild_id || standaloneClanId)}`,
    guild.create_date ? clanDate(guild.create_date) : null
  ].filter(Boolean).join(' · ');
  document.title = `${guild.name || 'Clan'} — PeakHalla`;
  const memberCount = Number(guild.member_count ?? members.length) || 0;
  const memberCapacity = Number(guild.member_capacity || 0) || null;
  const memberValue = memberCapacity ? `${number(memberCount)} / ${number(memberCapacity)}` : number(memberCount, '0');
  els.clanPageStats.innerHTML = [
    [t('clanXp'), number(guild.xp, '0')],
    [t('clanRank'), guild.rank ? `#${number(guild.rank)}` : '—'],
    [t('clanMembers'), memberValue],
    [t('clanPoints'), number(guild.guild_points, '0')],
    [t('clanTier'), guild.tier ? number(guild.tier) : '—'],
    ['Created', guild.create_date ? clanDate(guild.create_date) : '—']
  ].map(([label, value], index) => `<article style="--stat-delay:${index * 60}ms"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('');

  const counts = members.reduce((acc, member) => {
    const role = clanRoleClass(member.rank);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  els.clanPageRoles.innerHTML = ['recruit', 'member', 'officer', 'leader'].map((role, index) =>
    `<span class="clan-role-step ${role}" style="--role-delay:${index * 70}ms"><i>${index + 1}</i><b>${escapeHtml(clanRoleLabel(role))}</b><small>${number(counts[role] || 0)}</small></span>`
  ).join('');

  if (els.clanPageMemberCount) els.clanPageMemberCount.textContent = `${number(members.length)} ${t('clanMembers')}`;
  els.clanPageMembers.innerHTML = members.length ? members.map((member, index) => `
    <article class="clan-member-card" style="--member-delay:${Math.min(index, 24) * 28}ms">
      <button type="button" class="clan-member-player" data-clan-player-id="${Number(member.brawlhalla_id)}">
        <span class="clan-member-avatar">${escapeHtml(initials(member.name))}</span>
        <span><strong>${escapeHtml(member.name || `Player ${member.brawlhalla_id}`)}</strong><small>BH ID ${number(member.brawlhalla_id)}</small></span>
      </button>
      <span class="clan-role ${clanRoleClass(member.rank)}">${escapeHtml(clanRoleLabel(member.rank))}</span>
      <span class="clan-member-value"><small>${escapeHtml(t('clanMemberXp'))}</small><b>${number(member.xp, '0')}</b></span>
      <span class="clan-member-value"><small>${escapeHtml(t('clanPoints'))}</small><b>${number(member.guild_points, '0')}</b></span>
      <span class="clan-member-joined">${escapeHtml(clanDate(member.join_date))}</span>
    </article>`).join('') : `<p class="empty-copy">${escapeHtml(t('emptyData'))}</p>`;
  els.clanPageMembers.querySelectorAll('[data-clan-player-id]').forEach((button) =>
    button.addEventListener('click', () => navigateToPlayer(button.dataset.clanPlayerId))
  );
  els.clanPageStatus.hidden = true;
}

async function loadStandaloneClan() {
  if (!isClanPage || !standaloneClanId || !els.clanPage) return;
  els.clanPage.hidden = false;
  els.clanPageStatus.hidden = false;
  els.clanPageStatus.innerHTML = `<div class="clans-loading"><span></span><strong>${escapeHtml(t('clanLoading'))}</strong></div>`;
  try {
    const params = new URLSearchParams({ refresh: '1', _: String(Date.now()) });
    renderClanPage(await getJson(`/api/clans/${encodeURIComponent(standaloneClanId)}?${params}`));
  } catch (error) {
    els.clanPageStatus.hidden = false;
    els.clanPageStatus.innerHTML = `<p class="empty-copy">${escapeHtml(error.message || t('friendlyProblem'))}</p>`;
  }
}

function scheduleClanSearch() {
  window.clearTimeout(state.clansSearchTimer);
  state.clansSearchTimer = window.setTimeout(() => loadClans(), 280);
}

function powerRankingRows(rankings = [], region = '') {
  return rankings.map((item) => `<tr data-power-rank="${Number(item.rank) || ''}"><td><span class="power-rank">#${number(item.rank)}</span></td><td><button class="power-player-button" type="button" data-esports-player="${escapeHtml(item.name)}" data-esports-region="${escapeHtml(region || '')}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(t('viewCareer'))} →</small></button></td><td>${money(item.earnings)}</td><td>${number(item.top8)}</td><td>${number(item.gold)}</td><td>${number(item.silver)}</td><td>${number(item.bronze)}</td></tr>`).join('');
}

function renderEsports(data, options = {}) {
  const append = Boolean(options.append);
  const rankings = data.rankings || [];
  state.esportsData = append
    ? { ...data, rankings: [...(state.esportsData?.rankings || []), ...rankings] }
    : data;
  state.powerPage = Number(data.page || (append ? state.powerPage : 1)) || 1;
  state.powerHasMore = Boolean(data.has_more);
  els.esportsUpdated.textContent = data.updated_at ? `${t('rankingsUpdated')}: ${shortDate(data.updated_at)}` : '';
  const rows = powerRankingRows(rankings, data.region || '');
  if (append && rows) {
    els.powerBody.insertAdjacentHTML('beforeend', rows);
  } else {
    els.powerBody.innerHTML = rows || `<tr><td colspan="7" class="empty-copy">${escapeHtml(t('noPowerData'))}</td></tr>`;
  }
  if (els.esportsSource && data.source_url) els.esportsSource.href = data.source_url;
  if (els.championsGrid) els.championsGrid.innerHTML = (data.featured_champions || state.esportsData?.featured_champions || []).map((champion) => `<article class="champion-card"><div><span>${escapeHtml(champion.region)}</span><strong>${escapeHtml(champion.players)}</strong></div><ul>${(champion.titles || []).map((title) => `<li>${escapeHtml(title)}</li>`).join('')}</ul></article>`).join('');
  const visibleCount = els.powerBody?.querySelectorAll('tr[data-power-rank]').length || rankings.length;
  const query = els.powerSearch?.value.trim() || '';
  if (els.powerPageStatus) els.powerPageStatus.textContent = query
    ? `${number(visibleCount)} ${t('powerSearchResults')}`
    : `${number(visibleCount)} ${t('powerPlayersShown')}`;
  if (els.powerLoadMore) {
    els.powerLoadMore.hidden = Boolean(query) || !state.powerHasMore;
    els.powerLoadMore.disabled = false;
    els.powerLoadMore.querySelector('span').textContent = t('loadMorePowerPlayers');
  }
}


function tournamentRegionName(code) {
  const labels = {
    ALL: t('allRegions'), GLOBAL: t('allRegions'), NA: state.language === 'ar' ? 'أمريكا الشمالية' : 'North America',
    EU: t('Europe'), SA: state.language === 'ar' ? 'أمريكا الجنوبية' : 'South America', SEA: t('SoutheastAsia'),
    MENA: state.language === 'ar' ? 'الشرق الأوسط وشمال أفريقيا' : 'MENA', AUS: t('Australia'), JPN: t('Japan')
  };
  return labels[code] || code;
}

function cancelEsportsMenuClose() {
  window.clearTimeout(state.esportsMenuTimer);
  state.esportsMenuTimer = null;
}

function closeEsportsMenu(options = {}) {
  if (!els.esportsNav || !els.esportsToggle) return;
  if (state.esportsMenuPinned && !options.force) return;
  cancelEsportsMenuClose();
  state.esportsMenuPinned = false;
  els.esportsNav.classList.remove('open', 'pinned');
  els.esportsToggle.setAttribute('aria-expanded', 'false');
  els.esportsMenu?.setAttribute('aria-hidden', 'true');
}

function openEsportsMenu(options = {}) {
  if (!els.esportsNav || !els.esportsToggle) return;
  cancelEsportsMenuClose();
  closeRankedMenu();
  closeQueueMenu();
  if (options.pin) state.esportsMenuPinned = true;
  els.esportsNav.classList.add('open');
  els.esportsNav.classList.toggle('pinned', state.esportsMenuPinned);
  els.esportsToggle.setAttribute('aria-expanded', 'true');
  els.esportsMenu?.setAttribute('aria-hidden', 'false');
}

function scheduleEsportsMenuClose(delay = 260) {
  cancelEsportsMenuClose();
  if (state.esportsMenuPinned) return;
  state.esportsMenuTimer = window.setTimeout(() => closeEsportsMenu({ force: true }), delay);
}

function toggleEsportsMenu() {
  if (!els.esportsNav || !els.esportsToggle) return;
  if (els.esportsNav.classList.contains('open') && state.esportsMenuPinned) {
    closeEsportsMenu({ force: true });
    return;
  }
  openEsportsMenu({ pin: true });
}

function esportsRoute(view = 'power') {
  return view === 'tournaments' ? '/esports/tournaments' : '/esports/power';
}

function navigateEsportsView(view = 'power') {
  if (!['power', 'tournaments'].includes(view)) view = 'power';
  const destination = esportsRoute(view);
  if (location.pathname === destination || location.pathname === `${destination}/`) {
    showEsportsView(view, { scroll: false });
    closeEsportsMenu({ force: true });
    return;
  }
  document.body.classList.add('page-leaving');
  window.setTimeout(() => { location.href = destination; }, 220);
}

function syncEsportsPageUrl() {
  if (!isEsportsPage) return;
  const params = new URLSearchParams();
  if (state.esportsView === 'power') {
    params.set('region', els.esportsRegion?.value || 'NA');
    params.set('mode', els.esportsMode?.value || '1v1');
    const powerQuery = els.powerSearch?.value.trim() || '';
    if (powerQuery) params.set('q', powerQuery);
  } else {
    params.set('type', state.tournamentType || 'official');
    params.set('region', els.tournamentDirectoryRegion?.value || 'ALL');
    params.set('mode', state.tournamentMode || 'ALL');
  }
  history.replaceState(null, '', `${esportsRoute(state.esportsView)}?${params}`);
}

function showEsportsView(view = 'power', options = {}) {
  if (!['power', 'tournaments'].includes(view)) view = 'power';
  state.esportsView = view;
  if (els.esportsPowerView) els.esportsPowerView.hidden = view !== 'power';
  if (els.esportsTournamentsView) els.esportsTournamentsView.hidden = view !== 'tournaments';
  document.querySelectorAll('[data-esports-tab]').forEach((button) => {
    const active = button.dataset.esportsTab === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  els.esportsMenu?.querySelectorAll('[data-esports-view]').forEach((button) => button.classList.toggle('selected', button.dataset.esportsView === view));
  closeEsportsMenu({ force: true });
  if (view === 'tournaments') {
    document.title = 'Brawlhalla Tournaments — PeakHalla';
    if (!state.tournamentData || options.refresh) loadTournamentDirectory({ refresh: options.refresh });
  } else {
    document.title = 'Brawlhalla Esports Power Rankings — PeakHalla';
    if (!state.esportsData || options.refresh) loadEsports();
  }
  if (options.scroll !== false) document.querySelector('#esports')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function tournamentCard(event, index) {
  const regions = Array.isArray(event.regions) && event.regions.length ? event.regions : ['GLOBAL'];
  const modes = Array.isArray(event.modes) && event.modes.length ? event.modes : ['1v1', '2v2'];
  const primaryRegion = regions[0] || 'GLOBAL';
  const date = event.date ? shortDate(event.date) : '';
  const category = event.category === 'community' ? t('communityTournaments') : t('officialTournaments');
  const sourceHost = (() => { try { return new URL(event.source_url).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  const linkStart = event.source_url ? `<a href="${escapeHtml(event.source_url)}" target="_blank" rel="noopener noreferrer" class="tournament-directory-card">` : '<article class="tournament-directory-card">';
  const linkEnd = event.source_url ? '</a>' : '</article>';
  return `${linkStart}<span class="tournament-card-number">${String(index + 1).padStart(2, '0')}</span><div class="tournament-card-copy"><div class="tournament-card-badges"><b class="event-region">${escapeHtml(tournamentRegionName(primaryRegion))}</b>${modes.map((mode) => `<em class="tournament-mode-badge">${escapeHtml(mode)}</em>`).join('')}<em>${escapeHtml(category)}</em></div><h4>${escapeHtml(event.name || 'Brawlhalla Tournament')}</h4><p>${escapeHtml(event.note || event.description || '')}</p><div class="tournament-card-meta">${date ? `<span>${escapeHtml(t('announced'))}: ${escapeHtml(date)}</span>` : ''}${sourceHost ? `<span>${escapeHtml(sourceHost)}</span>` : ''}</div></div><span class="tournament-card-arrow">↗</span>${linkEnd}`;
}

function renderTournamentDirectory(data = {}) {
  state.tournamentData = data;
  const events = data.events || [];
  if (els.tournamentDirectoryUpdated) els.tournamentDirectoryUpdated.textContent = data.updated_at ? `${t('rankingsUpdated')}: ${dateTime(data.updated_at)}` : '';
  if (els.tournamentDirectoryCount) els.tournamentDirectoryCount.textContent = `${number(events.length, '0')} ${t('tournamentEvents')}`;
  if (!els.tournamentDirectoryList) return;
  els.tournamentDirectoryList.innerHTML = events.length ? events.map(tournamentCard).join('') : `<p class="empty-copy tournament-directory-empty">${escapeHtml(t('noTournaments'))}</p>`;
}

async function loadTournamentDirectory(options = {}) {
  if (!els.tournamentDirectoryList) return;
  const region = els.tournamentDirectoryRegion?.value || 'ALL';
  const mode = state.tournamentMode || els.tournamentDirectoryMode?.value || 'ALL';
  const params = new URLSearchParams({ type: state.tournamentType || 'official', region, mode });
  syncEsportsPageUrl();
  if (options.refresh) params.set('refresh', '1');
  els.tournamentDirectoryList.innerHTML = `<div class="tournament-directory-loading"><span></span><strong>${escapeHtml(t('loadingTournaments'))}</strong></div>`;
  if (els.tournamentDirectoryRefresh) els.tournamentDirectoryRefresh.disabled = true;
  try {
    renderTournamentDirectory(await getJson(`/api/esports/tournaments?${params}`));
  } catch (error) {
    els.tournamentDirectoryList.innerHTML = `<p class="empty-copy tournament-directory-empty">${escapeHtml(error.message || t('friendlyProblem'))}</p>`;
  } finally {
    if (els.tournamentDirectoryRefresh) els.tournamentDirectoryRefresh.disabled = false;
  }
  window.clearTimeout(state.tournamentRefreshTimer);
  state.tournamentRefreshTimer = window.setTimeout(() => {
    if (document.visibilityState === 'visible' && state.esportsView === 'tournaments') loadTournamentDirectory();
  }, 5 * 60_000);
}


function closeCareerModal() {
  els.careerModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function tournamentDate(timestamp) {
  if (!Number(timestamp)) return '—';
  return new Date(Number(timestamp) * 1000).toLocaleDateString(state.language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function careerMetric(label, value) {
  return `<article><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`;
}

function filteredPlacements(data) {
  const placements = data?.placements || [];
  if (state.careerFilter === '1v1' || state.careerFilter === '2v2') return placements.filter((item) => item.mode === state.careerFilter);
  if (state.careerFilter === 'top8') return placements.filter((item) => Number(item.placement) <= 8);
  return placements;
}

function renderCareer(data) {
  state.esportsCareer = data;
  const player = data.player || {};
  const summary = data.summary || {};
  els.careerName.textContent = player.name || 'Player';
  const meta = [player.region, player.country, player.pr1v1 ? `1v1 PR #${number(player.pr1v1)}` : null, player.pr2v2 ? `2v2 PR #${number(player.pr2v2)}` : null].filter(Boolean);
  els.careerMeta.textContent = meta.join(' · ');
  els.careerSummary.innerHTML = [
    careerMetric(t('careerEvents'), number(summary.events, '0')),
    careerMetric(t('careerTitles'), number(summary.titles, '0')),
    careerMetric(t('careerPodiums'), number(summary.podiums, '0')),
    careerMetric(t('careerTop8'), number(summary.top8, '0')),
    careerMetric(t('bestFinish'), summary.best_placement ? `#${number(summary.best_placement)}` : '—')
  ].join('');

  const placements = filteredPlacements(data);
  els.careerCount.textContent = `${number(placements.length)} ${t('careerEvents')}`;
  els.careerList.innerHTML = placements.length ? placements.map((item) => {
    const tournament = item.tournament || {};
    const place = Number(item.placement);
    const placeClass = place === 1 ? 'is-gold' : place <= 3 ? 'is-podium' : place <= 8 ? 'is-top8' : '';
    const eventTitle = tournament.tournamentName || tournament.eventName || 'Tournament';
    const eventName = tournament.eventName && tournament.eventName !== eventTitle ? tournament.eventName : '';
    const eventLink = tournament.source_url ? `<a href="${escapeHtml(tournament.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(eventTitle)} ↗</a>` : `<strong>${escapeHtml(eventTitle)}</strong>`;
    const location = tournament.isOnline === false ? t('offlineEvent') : t('onlineEvent');
    return `<article class="career-placement"><span class="placement-badge ${placeClass}">#${number(place)}</span><div class="career-event-copy">${eventLink}${eventName ? `<small>${escapeHtml(eventName)}</small>` : ''}<p>${escapeHtml(item.mode)} · ${escapeHtml(location)} · ${escapeHtml(tournamentDate(tournament.startTime))}</p></div></article>`;
  }).join('') : `<p class="empty-copy">${escapeHtml(t('noPlacements'))}</p>`;
  els.careerStatus.hidden = true;
  els.careerContent.hidden = false;
  if (data.source_url) els.careerSource.href = data.source_url;
}

async function openEsportsCareer(name, region = '') {
  state.careerFilter = 'all';
  document.querySelectorAll('[data-career-filter]').forEach((button) => button.classList.toggle('active', button.dataset.careerFilter === 'all'));
  els.careerModal.hidden = false;
  document.body.classList.add('modal-open');
  els.careerName.textContent = name;
  els.careerMeta.textContent = region || '';
  els.careerContent.hidden = true;
  els.careerStatus.hidden = false;
  els.careerStatus.innerHTML = `<div class="career-loader"></div><strong>${escapeHtml(t('loadingCareer'))}</strong>`;
  try {
    const params = new URLSearchParams({ name, region });
    renderCareer(await getJson(`/api/esports/player?${params}`));
  } catch (_error) {
    state.esportsCareer = null;
    els.careerStatus.hidden = false;
    els.careerStatus.innerHTML = `<span class="career-error-mark">!</span><strong>${escapeHtml(t('playerCareerNotFound'))}</strong>`;
  }
}

async function loadEsports(options = {}) {
  if (!els.powerBody || !els.esportsRegion || !els.esportsMode) return;
  const append = Boolean(options.append);
  const query = els.powerSearch?.value.trim() || '';
  if (!append) state.powerPage = 1;
  if (append && (state.powerLoadingMore || !state.powerHasMore || query)) return;
  const page = append ? state.powerPage + 1 : 1;
  syncEsportsPageUrl();
  const params = new URLSearchParams({ region: els.esportsRegion.value, mode: els.esportsMode.value, page: String(page) });
  if (query) params.set('q', query);
  state.powerLoadingMore = append;
  if (append && els.powerLoadMore) {
    els.powerLoadMore.disabled = true;
    els.powerLoadMore.querySelector('span').textContent = t('loadingMorePowerPlayers');
  } else {
    els.powerBody.innerHTML = '<tr><td colspan="7"><div class="table-loading"></div></td></tr>';
    if (els.powerPageStatus) els.powerPageStatus.textContent = '';
  }
  try {
    const data = await getJson(`/api/esports?${params}`, { timeoutMs: query ? 18000 : 12000 });
    renderEsports(data, { append });
  } catch (error) {
    if (!append) els.powerBody.innerHTML = `<tr><td colspan="7" class="empty-copy">${escapeHtml(t('friendlyProblem'))}</td></tr>`;
    if (els.powerLoadMore) {
      els.powerLoadMore.disabled = false;
      els.powerLoadMore.querySelector('span').textContent = t('loadMorePowerPlayers');
    }
  } finally {
    state.powerLoadingMore = false;
  }
}

function schedulePowerRankingSearch() {
  window.clearTimeout(state.powerSearchTimer);
  state.powerSearchTimer = window.setTimeout(() => loadEsports(), 320);
}


function closeRankedMenu() {
  if (!els.rankedMenu || !els.rankedToggle) return;
  els.rankedToggle.setAttribute('aria-expanded', 'false');
  els.rankedMenu.setAttribute('aria-hidden', 'true');
  els.rankedNav?.classList.remove('open');
}

function toggleRankedMenu() {
  if (!els.rankedMenu || !els.rankedToggle) return;
  closeQueueMenu();
  const opening = !els.rankedNav?.classList.contains('open');
  els.rankedToggle.setAttribute('aria-expanded', String(opening));
  els.rankedMenu.setAttribute('aria-hidden', String(!opening));
  els.rankedNav?.classList.toggle('open', opening);
}

async function chooseRankedMode(mode) {
  if (!['1v1', '2v2', '3v3'].includes(mode)) return;
  if (isLiveQueuePage || isStandalonePlayerPage || isClanPage || isArenaPage || isEsportsPage) {
    document.body.classList.add('page-leaving');
    window.setTimeout(() => { location.href = `/?ranked=${encodeURIComponent(mode)}#leaderboard`; }, 260);
    return;
  }
  if (els.mode) { els.mode.value = mode; els.mode.dispatchEvent(new Event('change', { bubbles: true })); }
  if (els.leaderboardMode) { els.leaderboardMode.value = mode; els.leaderboardMode._motionSync?.(); }
  if (els.rankedModeLabel) els.rankedModeLabel.textContent = mode;
  els.rankedMenu?.querySelectorAll('[data-ranked-mode]').forEach((button) => button.classList.toggle('selected', button.dataset.rankedMode === mode));
  closeRankedMenu();

  const leaderboardSection = document.querySelector('#leaderboard');
  const loading = loadLeaderboard();
  leaderboardSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  await loading;

  els.leaderboard?.classList.remove('leaderboard-mode-enter');
  requestAnimationFrame(() => {
    els.leaderboard?.classList.add('leaderboard-mode-enter');
    window.setTimeout(() => els.leaderboard?.classList.remove('leaderboard-mode-enter'), 900);
  });
}


function closeQueueMenu() {
  if (!els.queueMenu || !els.queueToggle) return;
  els.queueToggle.setAttribute('aria-expanded', 'false');
  els.queueMenu.setAttribute('aria-hidden', 'true');
  els.queueNav?.classList.remove('open');
}

function toggleQueueMenu() {
  if (!els.queueMenu || !els.queueToggle) return;
  const opening = !els.queueNav?.classList.contains('open');
  closeRankedMenu();
  els.queueToggle.setAttribute('aria-expanded', String(opening));
  els.queueMenu.setAttribute('aria-hidden', String(!opening));
  els.queueNav?.classList.toggle('open', opening);
}

function navigateToQueue(mode = '1v1', region = state.queueRegion || 'EU') {
  if (!['1v1', '2v2', '3v3'].includes(mode)) mode = '1v1';
  const params = new URLSearchParams({ mode, region });
  document.body.classList.add('page-leaving');
  window.setTimeout(() => { location.href = `/queue?${params}`; }, 260);
}

function chooseQueueMode(mode) {
  closeQueueMenu();
  navigateToQueue(mode, state.queueRegion || 'EU');
}

function queueRelativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - Number(timestamp || 0)) / 1000));
  if (seconds < 15) return state.language === 'ar' ? 'الآن' : 'just now';
  if (seconds < 60) return state.language === 'ar' ? `قبل ${seconds} ثانية` : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return state.language === 'ar' ? `قبل ${minutes} د` : `${minutes}m ago`;
}

function queueScanTime(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString(state.language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

function queueNextTime(timestamp) {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.ceil((Number(timestamp) - Date.now()) / 1000));
  if (seconds <= 1) return state.language === 'ar' ? 'الآن' : 'now';
  if (seconds < 60) return state.language === 'ar' ? `خلال ${seconds} ث` : `in ${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return state.language === 'ar' ? `خلال ${minutes} د` : `in ${minutes}m`;
}

function queueActivityChip(label, value, className = '') {
  return `<span class="queue-activity-chip ${className}"><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`;
}

function queuePlayerLine(player) {
  const main = player.main_legend;
  return `<button type="button" class="queue-live-player" data-queue-player-id="${Number(player.id) || ''}" data-player-id="${Number(player.id) || ''}" data-needs-portrait="${main ? '0' : '1'}">
    ${main ? portraitMarkup(main, 'queue-live-portrait') : portraitMarkup(null, 'queue-live-portrait', { fallbackName: player.username, localCandidates: false })}
    <span><strong>${escapeHtml(player.username || 'Unknown')}</strong><small>${escapeHtml(main?.name || t('unknownLegend'))}</small></span>
  </button>`;
}

function queueEntryCard(entry, index) {
  const deltaGames = Number(entry.delta_games || 0);
  const deltaWins = Number(entry.delta_wins || 0);
  const deltaLosses = Number(entry.delta_losses || 0);
  const deltaElo = Number(entry.delta_elo || 0);
  const gameLabel = deltaGames === 1 ? t('queueGameDetected') : t('queueGamesDetected');
  const activityBits = [
    queueActivityChip(gameLabel, `+${number(deltaGames)}`, 'games'),
    queueActivityChip(t('wins'), `+${number(deltaWins)}`, 'wins')
  ];
  if (deltaLosses > 0) activityBits.push(queueActivityChip(t('losses'), `+${number(deltaLosses)}`, 'losses'));
  activityBits.push(queueActivityChip(t('queueEloChange'), `${deltaElo > 0 ? '+' : ''}${number(deltaElo)}`, deltaElo >= 0 ? 'elo-up' : 'elo-down'));
  return `<article class="queue-live-card" style="--queue-delay:${Math.min(index, 12) * 45}ms">
    <div class="queue-card-rank"><span>#${number(entry.rank)}</span><small>${escapeHtml(entry.tier || 'Unranked')}</small></div>
    <div class="queue-card-players">${(entry.players || []).map(queuePlayerLine).join('')}</div>
    <div class="queue-card-stats">
      <span><small>ELO</small><b>${number(entry.rating)}</b></span>
      <span><small>${escapeHtml(t('peak'))}</small><b>${number(entry.best_rating)}</b></span>
      <span><small>${escapeHtml(t('winRate'))}</small><b>${entry.games ? `${number(((entry.wins / entry.games) * 100).toFixed(1))}%` : '—'}</b></span>
    </div>
    <div class="queue-card-activity">${activityBits.join('')}</div>
    <div class="queue-card-time"><i></i><span>${escapeHtml(queueRelativeTime(entry.last_activity_at))}</span></div>
  </article>`;
}

function queueBrowserCacheKey(region = state.queueRegion, mode = state.queueMode) {
  return `peakhalla-queue:${region}:${mode}`;
}

function readQueueBrowserCache(region = state.queueRegion, mode = state.queueMode) {
  try {
    const cached = JSON.parse(localStorage.getItem(queueBrowserCacheKey(region, mode)) || 'null');
    if (!cached?.data || Date.now() - Number(cached.savedAt || 0) > 15 * 60_000) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeQueueBrowserCache(data) {
  try {
    localStorage.setItem(queueBrowserCacheKey(data.region, data.mode), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {}
}

function scheduleQueuePoll(data = state.queueData) {
  window.clearTimeout(state.queueTimer);
  if (!isLiveQueuePage) return;
  const fast = !data || data.scan_in_progress || data.status === 'warming' || data.status === 'scanning';
  const delay = document.hidden ? 30_000 : (fast ? 4_000 : 15_000);
  state.queueTimer = window.setTimeout(() => loadLiveQueue({ silent: true }), delay);
}

function renderLiveQueue(data) {
  state.queueData = data;
  state.queueMode = data.mode || state.queueMode;
  state.queueRegion = data.region || state.queueRegion;
  if (els.queueActiveCount) els.queueActiveCount.textContent = number(data.active_count || 0, '0');
  if (els.queueModeLabel) els.queueModeLabel.textContent = state.queueMode;
  document.querySelectorAll('[data-live-queue-mode]').forEach((button) => button.classList.toggle('active', button.dataset.liveQueueMode === state.queueMode));
  els.queueMenu?.querySelectorAll('[data-queue-mode]').forEach((button) => button.classList.toggle('selected', button.dataset.queueMode === state.queueMode));
  if (els.queueScanMeta) {
    const pieces = [`${number(data.tracked_count || 0)} ${t('queueTrackedTop')}`];
    if (data.last_scan_at) pieces.push(`${t('queueLastScan')}: ${queueScanTime(data.last_scan_at)}`);
    if (data.next_scan_at) pieces.push(`${t('queueNextScan')}: ${queueNextTime(data.next_scan_at)}`);
    els.queueScanMeta.textContent = pieces.join(' · ');
  }
  if (els.queueStatus) {
    els.queueStatus.hidden = false;
    if (data.status === 'error' && !(data.players || []).length) {
      els.queueStatus.className = 'queue-status error';
      els.queueStatus.textContent = t('queueError');
    } else {
      els.queueStatus.className = 'queue-status live';
      els.queueStatus.innerHTML = `<i></i><span>${escapeHtml(t('queueWatching'))} · ${escapeHtml(regionLabel(data.region))} · ${escapeHtml(data.mode)}</span>`;
    }
  }
  const players = [...(data.players || [])].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(a.rank || Infinity) - Number(b.rank || Infinity));
  if (!players.length) {
    const firstBaseline = data.last_scan_at && Number(data.tracked_count || 0) > 0;
    els.queueList.innerHTML = `<div class="queue-live-empty"><span>${firstBaseline ? '⌁' : '…'}</span><strong>${escapeHtml(firstBaseline ? t('queueNoActivity') : t('queueWarming'))}</strong><small>${escapeHtml(t('queueDisclaimerLive'))}</small></div>`;
  } else {
    els.queueList.innerHTML = players.map(queueEntryCard).join('');
    els.queueList.querySelectorAll('[data-queue-player-id]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.queuePlayerId;
      if (id) navigateToPlayer(id);
    }));
    activateImageFallbacks();
    enrichRenderedPortraits(els.queueList, '.queue-live-player[data-player-id]', '.queue-live-portrait', 4);
  }
  if (!data.__fromBrowserCache) writeQueueBrowserCache(data);
  scheduleQueuePoll(data);
}

async function loadLiveQueue(options = {}) {
  if (!isLiveQueuePage || !els.queueList) return;
  const silent = Boolean(options.silent);
  state.queueController?.abort();
  state.queueController = new AbortController();
  if (!silent && !state.queueData) {
    els.queueList.innerHTML = `<div class="queue-live-loading"><span></span><strong>${escapeHtml(t('queueWarming'))}</strong></div>`;
  }
  const params = new URLSearchParams({ region: state.queueRegion, mode: state.queueMode });
  try {
    const response = await fetch(`/api/queue/activity?${params}`, { headers: { Accept: 'application/json' }, signal: state.queueController.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t('queueError'));
    renderLiveQueue(data);
  } catch (error) {
    if (error.name === 'AbortError') return;
    if (!silent || !state.queueData) {
      els.queueList.innerHTML = `<div class="queue-live-empty"><span>!</span><strong>${escapeHtml(t('queueError'))}</strong></div>`;
    }
    scheduleQueuePoll(state.queueData);
  }
}

function setLiveQueueMode(mode, options = {}) {
  if (!['1v1', '2v2', '3v3'].includes(mode)) return;
  state.queueMode = mode;
  if (els.queueModeLabel) els.queueModeLabel.textContent = mode;
  document.querySelectorAll('[data-live-queue-mode]').forEach((button) => button.classList.toggle('active', button.dataset.liveQueueMode === mode));
  const params = new URLSearchParams(location.search);
  params.set('mode', mode);
  params.set('region', state.queueRegion);
  history.replaceState(null, '', `/queue?${params}`);
  if (!options.skipLoad) loadLiveQueue();
}

function setupLiveQueuePage() {
  if (!isLiveQueuePage) return;
  if (els.queuePage) els.queuePage.hidden = false;
  const params = new URLSearchParams(location.search);
  state.queueMode = ['1v1', '2v2', '3v3'].includes(params.get('mode')) ? params.get('mode') : '1v1';
  const regions = ['US-E', 'EU', 'SEA', 'BRZ', 'AUS', 'US-W', 'JPN', 'SA', 'ME'];
  const requestedRegion = params.get('region') === 'JPS' ? 'JPN' : params.get('region');
  state.queueRegion = regions.includes(requestedRegion) ? requestedRegion : 'EU';
  if (els.queueRegion) {
    els.queueRegion.value = state.queueRegion;
    els.queueRegion._motionSync?.();
  }
  setLiveQueueMode(state.queueMode, { skipLoad: true });
  const cachedQueue = readQueueBrowserCache(state.queueRegion, state.queueMode);
  if (cachedQueue) renderLiveQueue({ ...cachedQueue, status: cachedQueue.status || 'stale', __fromBrowserCache: true });
  loadLiveQueue({ silent: Boolean(cachedQueue) });
}


async function arenaRequest(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t('arenaAuthError'));
  return data;
}

function setArenaFormStatus(element, message = '', type = 'info') {
  if (!element) return;
  element.hidden = !message;
  element.className = `arena-form-status ${type}`;
  element.textContent = message;
}

function setArenaAuthMode(mode) {
  state.arenaAuthMode = mode === 'login' ? 'login' : 'register';
  document.querySelectorAll('[data-arena-auth-mode]').forEach((button) => button.classList.toggle('active', button.dataset.arenaAuthMode === state.arenaAuthMode));
  if (els.arenaAuthSubmit) els.arenaAuthSubmit.querySelector('span').textContent = state.arenaAuthMode === 'login' ? t('arenaSignIn') : t('arenaCreateAccount');
  if (els.arenaPassword) els.arenaPassword.autocomplete = state.arenaAuthMode === 'login' ? 'current-password' : 'new-password';
  setArenaFormStatus(els.arenaAuthStatus);
}

function renderArenaAccount() {
  const loggedIn = Boolean(state.arenaUser);
  document.body.classList.toggle('arena-account-active', loggedIn);
  if (els.arenaAuthPanel) els.arenaAuthPanel.hidden = loggedIn;
  if (els.arenaComposer) els.arenaComposer.hidden = !loggedIn;
  if (loggedIn) {
    els.arenaCurrentUser.textContent = state.arenaUser.username;
    els.arenaUserAvatar.textContent = initials(state.arenaUser.username).slice(0, 1);
  }
}

function arenaDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(state.language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function arenaAvatar(name) {
  return `<span class="arena-comment-avatar">${escapeHtml(initials(name).slice(0, 1))}</span>`;
}

function renderArenaComment(comment, replies = []) {
  return `<article class="arena-comment">
    ${arenaAvatar(comment.username)}
    <div class="arena-comment-body">
      <header><strong>${escapeHtml(comment.username)}</strong><time>${escapeHtml(arenaDate(comment.created_at))}</time></header>
      <p>${escapeHtml(comment.text)}</p>
      ${state.arenaUser ? `<button type="button" class="arena-reply-button" data-arena-reply-id="${escapeHtml(comment.id)}" data-arena-reply-user="${escapeHtml(comment.username)}">${escapeHtml(t('arenaReply'))}</button>` : ''}
      ${replies.length ? `<div class="arena-replies">${replies.map((reply) => `<article class="arena-comment arena-comment-reply">${arenaAvatar(reply.username)}<div class="arena-comment-body"><header><strong>${escapeHtml(reply.username)}</strong><time>${escapeHtml(arenaDate(reply.created_at))}</time></header><p>${escapeHtml(reply.text)}</p></div></article>`).join('')}</div>` : ''}
    </div>
  </article>`;
}

function renderArenaPost(post, index) {
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const parents = comments.filter((comment) => !comment.parent_id);
  const replyMap = new Map();
  for (const comment of comments.filter((item) => item.parent_id)) {
    const list = replyMap.get(comment.parent_id) || [];
    list.push(comment);
    replyMap.set(comment.parent_id, list);
  }
  const commentForm = state.arenaUser
    ? `<form class="arena-comment-form" data-arena-post-id="${escapeHtml(post.id)}"><div class="arena-replying" hidden><span></span><button type="button" data-arena-cancel-reply>×</button></div><input type="hidden" name="parent_id"><input name="text" maxlength="500" autocomplete="off" placeholder="${escapeHtml(t('arenaWriteComment'))}" required><button type="submit">${escapeHtml(t('arenaSend'))}</button></form>`
    : `<p class="arena-signin-note">${escapeHtml(t('arenaSignInToComment'))}</p>`;
  return `<article class="arena-post panel" style="--arena-delay:${Math.min(index, 10) * 55}ms">
    <header class="arena-post-header">${arenaAvatar(post.username)}<div><strong>${escapeHtml(post.username)}</strong><time>${escapeHtml(arenaDate(post.created_at))}</time></div></header>
    <div class="arena-post-image"><img src="${escapeHtml(post.image_url)}" alt="Screenshot shared by ${escapeHtml(post.username)}" loading="lazy"></div>
    ${post.caption ? `<p class="arena-post-caption">${escapeHtml(post.caption)}</p>` : ''}
    <section class="arena-comments"><header><strong>${escapeHtml(t('arenaComments'))}</strong><span>${number(comments.length, '0')}</span></header><div class="arena-comment-list">${parents.map((comment) => renderArenaComment(comment, replyMap.get(comment.id) || [])).join('')}</div>${commentForm}</section>
  </article>`;
}

function renderArenaPosts() {
  if (!els.arenaFeed) return;
  if (!state.arenaPosts.length) {
    els.arenaFeed.innerHTML = `<div class="arena-empty panel"><span>▧</span><strong>${escapeHtml(t('arenaNoPosts'))}</strong></div>`;
    return;
  }
  els.arenaFeed.innerHTML = state.arenaPosts.map(renderArenaPost).join('');
}

async function loadArenaPosts(options = {}) {
  if (!els.arenaFeed) return;
  if (!options.silent) els.arenaFeed.innerHTML = `<div class="arena-feed-loading"><span></span><strong>${escapeHtml(t('arenaLoading'))}</strong></div>`;
  try {
    const data = await arenaRequest('/api/arena/posts');
    state.arenaPosts = data.posts || [];
    renderArenaPosts();
  } catch (error) {
    els.arenaFeed.innerHTML = `<div class="arena-empty panel"><span>!</span><strong>${escapeHtml(error.message)}</strong></div>`;
  }
}

async function loadArenaUser() {
  try {
    const data = await arenaRequest('/api/arena/me');
    state.arenaUser = data.user || null;
  } catch {
    state.arenaUser = null;
  }
  renderArenaAccount();
  renderArenaPosts();
}

function resetArenaImage() {
  state.arenaImageData = null;
  if (els.arenaImageInput) els.arenaImageInput.value = '';
  if (els.arenaImagePreview) { els.arenaImagePreview.hidden = true; els.arenaImagePreview.removeAttribute('src'); }
  if (els.arenaUploadPrompt) els.arenaUploadPrompt.hidden = false;
}

function readArenaImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return reject(new Error(t('arenaChooseImageFirst')));
    if (file.size > 5 * 1024 * 1024) return reject(new Error('Screenshot must be smaller than 5 MB.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(t('arenaPostError')));
    reader.readAsDataURL(file);
  });
}

async function submitArenaAuth(event) {
  event.preventDefault();
  const button = els.arenaAuthSubmit;
  const username = els.arenaUsername.value.trim();
  const password = els.arenaPassword.value;
  try {
    button.disabled = true;
    setArenaFormStatus(els.arenaAuthStatus);
    const endpoint = state.arenaAuthMode === 'login' ? '/api/arena/login' : '/api/arena/register';
    const data = await arenaRequest(endpoint, { method: 'POST', body: JSON.stringify({ username, password }) });
    state.arenaUser = data.user;
    window.dispatchEvent(new CustomEvent('arena-account-changed', { detail: { user: data.user, unread: data.unread_notifications || 0 } }));
    els.arenaAuthForm.reset();
    renderArenaAccount();
    setArenaFormStatus(els.arenaPostStatus, state.arenaAuthMode === 'login' ? t('arenaSignedIn') : t('arenaAccountReady'), 'success');
    renderArenaPosts();
  } catch (error) {
    setArenaFormStatus(els.arenaAuthStatus, error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function submitArenaPost(event) {
  event.preventDefault();
  if (!state.arenaImageData) return setArenaFormStatus(els.arenaPostStatus, t('arenaChooseImageFirst'), 'error');
  try {
    els.arenaPostSubmit.disabled = true;
    setArenaFormStatus(els.arenaPostStatus);
    const data = await arenaRequest('/api/arena/posts', { method: 'POST', body: JSON.stringify({ image_data: state.arenaImageData, caption: els.arenaCaption.value.trim() }) });
    state.arenaPosts.unshift(data.post);
    els.arenaCaption.value = '';
    resetArenaImage();
    setArenaFormStatus(els.arenaPostStatus, t('arenaPosted'), 'success');
    renderArenaPosts();
    els.arenaFeed.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    setArenaFormStatus(els.arenaPostStatus, error.message || t('arenaPostError'), 'error');
  } finally {
    els.arenaPostSubmit.disabled = false;
  }
}

async function submitArenaComment(form) {
  const postId = form.dataset.arenaPostId;
  const textInput = form.elements.text;
  const parentInput = form.elements.parent_id;
  const submit = form.querySelector('button[type="submit"]');
  try {
    submit.disabled = true;
    const data = await arenaRequest(`/api/arena/posts/${encodeURIComponent(postId)}/comments`, { method: 'POST', body: JSON.stringify({ text: textInput.value.trim(), parent_id: parentInput.value || null }) });
    const index = state.arenaPosts.findIndex((post) => post.id === postId);
    if (index >= 0) state.arenaPosts[index] = data.post;
    renderArenaPosts();
  } catch (error) {
    textInput.setCustomValidity(error.message);
    textInput.reportValidity();
    window.setTimeout(() => textInput.setCustomValidity(''), 1500);
  } finally {
    submit.disabled = false;
  }
}

function setupArenaPage() {
  if (!isArenaPage) return;
  if (els.arenaPage) els.arenaPage.hidden = false;
  setArenaAuthMode('register');
  loadArenaUser();
  loadArenaPosts();
  window.setInterval(() => loadArenaPosts({ silent: true }), 45_000);
}




function levenshtein(a = '', b = '') {
  const left = normalize(a);
  const right = normalize(b);
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = temp;
    }
  }
  return row[right.length];
}

function suggestionScore(name, query) {
  const candidate = normalize(name);
  const needle = normalize(query);
  if (candidate === needle) return 1000;
  if (candidate.startsWith(needle)) return 850 - (candidate.length - needle.length);
  if (candidate.includes(needle)) return 700 - candidate.indexOf(needle);
  return 500 - (levenshtein(candidate, needle) * 35) - Math.abs(candidate.length - needle.length) * 4;
}

function hideSuggestions() {
  if (!els.suggestions) return;
  els.suggestions.hidden = true;
  els.name?.setAttribute('aria-expanded', 'false');
  state.suggestionIndex = -1;
}

function selectSuggestion(index) {
  const item = state.suggestionItems[index];
  if (!item) return;
  hideSuggestions();
  navigateToPlayer(item.id, item.seed || state.playerSeeds.get(Number(item.id)));
}

function renderSuggestions(rankings = [], query = '') {
  if (!els.suggestions) return;
  const seen = new Set();
  const items = [];
  for (const ranking of rankings) {
    for (const player of ranking.players || []) {
      const id = Number(player.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const matchedAliases = player.matched_aliases || [];
      const seed = makePlayerSeedPayload(ranking, player);
      state.playerSeeds.set(id, seed);
      items.push({
        id,
        name: player.username || 'Unknown',
        region: ranking.region || '—',
        elo: ranking.rating,
        rank: ranking.rank,
        main_legend: player.main_legend || null,
        matched_alias: matchedAliases[0] || '',
        seed,
        score: Math.max(suggestionScore(player.username || '', query), ...matchedAliases.map((name) => suggestionScore(name, query)), 0)
      });
    }
  }
  state.suggestionItems = items.sort((a, b) => b.score - a.score || Number(b.elo || 0) - Number(a.elo || 0)).slice(0, 7);
  state.suggestionIndex = -1;
  if (!state.suggestionItems.length) {
    els.suggestions.innerHTML = `<div class="suggestion-empty">${escapeHtml(t('noSearchResults'))}</div>`;
  } else {
    els.suggestions.innerHTML = state.suggestionItems.map((item, index) => `<button type="button" class="search-suggestion" role="option" data-suggestion-index="${index}" data-player-id="${Number(item.id)}" data-player-region="${escapeHtml(item.region)}" data-needs-portrait="${item.main_legend ? '0' : '1'}">
      ${item.main_legend ? portraitMarkup(item.main_legend, 'suggestion-portrait') : portraitMarkup(null, 'suggestion-portrait', { fallbackName: item.name, localCandidates: false })}
      <span class="suggestion-copy"><strong>${escapeHtml(item.name)}</strong><small>${item.matched_alias && normalize(item.matched_alias) !== normalize(item.name) ? `${escapeHtml(t('oldNameMatch'))}: ${escapeHtml(item.matched_alias)}` : `${escapeHtml(item.main_legend?.name || t('unknownLegend'))} · ${escapeHtml(item.region)}`}</small></span>
      <span class="suggestion-meta"><b>${number(item.elo)}</b><small>${Number.isFinite(Number(item.elo)) ? 'ELO' : 'PROFILE'}</small></span>
    </button>`).join('');
  }
  els.suggestions.hidden = false;
  els.name?.setAttribute('aria-expanded', 'true');
  activateImageFallbacks();
  enrichRenderedPortraits(els.suggestions, '.search-suggestion[data-player-id]', '.suggestion-portrait', 3);
}

async function loadSearchSuggestions() {
  const query = els.name?.value.trim() || '';
  if (query.length < 2) { hideSuggestions(); return; }
  const requestId = ++state.suggestionRequestId;
  state.suggestionController?.abort();
  state.suggestionController = new AbortController();
  const params = new URLSearchParams({ q: query, _: String(Date.now()) });
  try {
    const data = await getJson(`/api/suggestions?${params}`, {
      signal: state.suggestionController.signal,
      timeoutMs: 7000
    });
    if (requestId !== state.suggestionRequestId || query !== (els.name?.value.trim() || '')) return;
    renderSuggestions(data.rankings || [], query);
  } catch (error) {
    if (error.name === 'AbortError' || requestId !== state.suggestionRequestId) return;
    // A temporary upstream timeout should not erase valid suggestions that are
    // already visible for the same input.
    if (!state.suggestionItems.length) {
      els.suggestions.innerHTML = `<div class="suggestion-empty">${escapeHtml(t('friendlyProblem'))}</div>`;
      els.suggestions.hidden = false;
    }
  }
}

function scheduleSuggestions() {
  window.clearTimeout(state.suggestionTimer);
  state.suggestionTimer = window.setTimeout(loadSearchSuggestions, 140);
}

function updateSuggestionHighlight() {
  els.suggestions?.querySelectorAll('.search-suggestion').forEach((item, index) => item.classList.toggle('active', index === state.suggestionIndex));
}

function enhanceSelect(select) {
  if (!select || select.dataset.enhancedSelect === 'true') return;
  select.dataset.enhancedSelect = 'true';
  const isLeaderboardRegion = select.id === 'leaderboard-region';
  const wrapper = document.createElement('div');
  wrapper.className = `motion-select${isLeaderboardRegion ? ' motion-select-regions' : ''}`;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'motion-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'motion-select-menu';
  menu.setAttribute('role', 'listbox');
  select.classList.add('motion-select-native');
  select.insertAdjacentElement('afterend', wrapper);
  wrapper.append(trigger, menu);

  const optionLabel = (option) => {
    if (!isLeaderboardRegion) return option?.textContent || '';
    return regionLabel(option?.value || 'ALL');
  };

  const optionMarkup = (option) => {
    if (!isLeaderboardRegion) return `<span>${escapeHtml(option?.textContent || '')}</span><b>✓</b>`;
    const code = option?.value || 'ALL';
    const scope = code === 'ALL' ? (state.language === 'ar' ? 'عالمي' : 'Global') : code;
    return `<span class="region-option-copy"><strong>${escapeHtml(regionLabel(code))}</strong><small>${escapeHtml(scope)}</small></span><b>✓</b>`;
  };

  [...select.options].forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = option.value;
    button.setAttribute('role', 'option');
    button.style.setProperty('--option-index', String(index));
    button.innerHTML = optionMarkup(option);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      sync();
      wrapper.classList.remove('selection-pop');
      requestAnimationFrame(() => wrapper.classList.add('selection-pop'));
    });
    menu.append(button);
  });

  const sync = () => {
    const selected = select.options[select.selectedIndex];
    if (isLeaderboardRegion) {
      const code = selected?.value || 'ALL';
      trigger.innerHTML = `<span class="region-trigger-copy"><strong>${escapeHtml(regionLabel(code))}</strong><small>${escapeHtml(code === 'ALL' ? (state.language === 'ar' ? 'عالمي' : 'Global') : code)}</small></span><b>⌄</b>`;
      [...menu.querySelectorAll('button')].forEach((button, index) => {
        button.innerHTML = optionMarkup(select.options[index]);
        button.classList.toggle('selected', button.dataset.value === select.value);
        button.setAttribute('aria-selected', String(button.dataset.value === select.value));
      });
    } else {
      trigger.innerHTML = `<span>${escapeHtml(optionLabel(selected))}</span><b>⌄</b>`;
      menu.querySelectorAll('button').forEach((button) => button.classList.toggle('selected', button.dataset.value === select.value));
    }
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll('.motion-select.open').forEach((item) => { if (item !== wrapper) item.classList.remove('open'); });
    const opening = !wrapper.classList.contains('open');
    wrapper.classList.toggle('open', opening);
    trigger.setAttribute('aria-expanded', String(opening));
  });
  select._motionSync = sync;
  select.addEventListener('change', sync);
  sync();
}

function setupMotionSelects() {
  [els.region, els.mode, els.leaderboardRegion, els.leaderboardMode, els.esportsRegion, els.esportsMode, els.tournamentDirectoryRegion, els.tournamentDirectoryMode, els.queueRegion].forEach(enhanceSelect);
}

const revealSelector = [
  '.section-heading',
  '.results-grid',
  '.profile-hero',
  '.account-showcase',
  '.stats-grid',
  '.profile-layout > .panel',
  '.lifetime-summary-panel',
  '.lifetime-heading',
  '.legend-tools',
  '.lifetime-legend-card',
  '.teammates-panel .panel-heading',
  '.teammates-note',
  '.teammate-card',
  '.leaderboard-list',
  '.esports-grid > .panel',
  '.champions-panel',
  '#about > *'
].join(',');

let revealObserver;
let lastScrollY = window.scrollY;

function registerScrollReveal(root = document) {
  if (!revealObserver) return;
  const items = [];
  if (root instanceof Element && root.matches(revealSelector)) items.push(root);
  if (root.querySelectorAll) items.push(...root.querySelectorAll(revealSelector));
  items.forEach((item, index) => {
    if (item.dataset.scrollRevealReady === 'true') return;
    item.dataset.scrollRevealReady = 'true';
    item.classList.add('scroll-reveal');
    item.style.setProperty('--reveal-delay', `${Math.min(index * 35, 180)}ms`);
    revealObserver.observe(item);
  });
}

function setupScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver((entries) => {
    const scrollingDown = window.scrollY >= lastScrollY;
    lastScrollY = window.scrollY;
    entries.forEach((entry) => {
      const item = entry.target;
      if (entry.isIntersecting) {
        item.classList.toggle('reveal-from-top', !scrollingDown);
        item.classList.toggle('reveal-from-bottom', scrollingDown);
        requestAnimationFrame(() => item.classList.add('is-visible'));
      } else {
        item.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.025, rootMargin: '0px 0px -5% 0px' });

  registerScrollReveal(document);
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) registerScrollReveal(node);
      });
    }
  });
  mutationObserver.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
}

document.querySelectorAll('[data-esports-tab]').forEach((button) => button.addEventListener('click', () => navigateEsportsView(button.dataset.esportsTab)));
document.querySelectorAll('[data-tournament-type]').forEach((button) => button.addEventListener('click', () => {
  state.tournamentType = button.dataset.tournamentType || 'official';
  document.querySelectorAll('[data-tournament-type]').forEach((item) => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  loadTournamentDirectory();
}));
document.querySelectorAll('[data-tournament-mode]').forEach((button) => button.addEventListener('click', () => {
  state.tournamentMode = button.dataset.tournamentMode || 'ALL';
  if (els.tournamentDirectoryMode) els.tournamentDirectoryMode.value = state.tournamentMode;
  document.querySelectorAll('[data-tournament-mode]').forEach((item) => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  loadTournamentDirectory();
}));
els.tournamentDirectoryRegion?.addEventListener('change', () => loadTournamentDirectory());
els.tournamentDirectoryMode?.addEventListener('change', () => {
  state.tournamentMode = els.tournamentDirectoryMode.value || 'ALL';
  document.querySelectorAll('[data-tournament-mode]').forEach((item) => item.classList.toggle('active', item.dataset.tournamentMode === state.tournamentMode));
  loadTournamentDirectory();
});
els.tournamentDirectoryRefresh?.addEventListener('click', () => loadTournamentDirectory({ refresh: true }));
els.esportsToggle?.addEventListener('click', (event) => { event.stopPropagation(); toggleEsportsMenu(); });
els.esportsNav?.addEventListener('mouseenter', () => openEsportsMenu());
els.esportsNav?.addEventListener('mouseleave', () => scheduleEsportsMenuClose());
els.esportsMenu?.addEventListener('mouseenter', cancelEsportsMenuClose);
els.esportsMenu?.addEventListener('mouseleave', () => scheduleEsportsMenuClose());
els.esportsMenu?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-esports-view]');
  if (button) navigateEsportsView(button.dataset.esportsView);
});

els.powerBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-esports-player]');
  if (button) openEsportsCareer(button.dataset.esportsPlayer, button.dataset.esportsRegion || '');
});
document.querySelectorAll('[data-career-close]').forEach((button) => button.addEventListener('click', closeCareerModal));
document.querySelectorAll('[data-career-filter]').forEach((button) => button.addEventListener('click', () => {
  state.careerFilter = button.dataset.careerFilter;
  document.querySelectorAll('[data-career-filter]').forEach((item) => item.classList.toggle('active', item === button));
  if (state.esportsCareer) renderCareer(state.esportsCareer);
}));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!els.careerModal.hidden) closeCareerModal();
    closeRankedMenu();
    closeQueueMenu();
    closeEsportsMenu();
  }
});

els.rankedToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleRankedMenu();
});
els.rankedMenu?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-ranked-mode]');
  if (button) chooseRankedMode(button.dataset.rankedMode);
});
els.queueToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleQueueMenu();
});
els.queueMenu?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-queue-mode]');
  if (button) chooseQueueMode(button.dataset.queueMode);
});
document.querySelectorAll('[data-live-queue-mode]').forEach((button) => button.addEventListener('click', () => setLiveQueueMode(button.dataset.liveQueueMode)));
els.queueRegion?.addEventListener('change', () => {
  state.queueRegion = els.queueRegion.value;
  const params = new URLSearchParams(location.search);
  params.set('mode', state.queueMode);
  params.set('region', state.queueRegion);
  history.replaceState(null, '', `/queue?${params}`);
  loadLiveQueue();
});
els.queueRefresh?.addEventListener('click', () => loadLiveQueue());
document.addEventListener('click', (event) => {
  if (els.rankedNav && !els.rankedNav.contains(event.target)) closeRankedMenu();
  if (els.queueNav && !els.queueNav.contains(event.target)) closeQueueMenu();
  if (els.esportsNav && !els.esportsNav.contains(event.target)) closeEsportsMenu({ force: true });
  if (!event.target.closest('.main-field')) hideSuggestions();
  document.querySelectorAll('.motion-select.open').forEach((item) => { if (!item.contains(event.target)) item.classList.remove('open'); });
});

els.form.addEventListener('submit', (event) => { hideSuggestions(); searchPlayer(event); });
els.name?.addEventListener('input', scheduleSuggestions);
els.name?.addEventListener('focus', () => { if ((els.name.value || '').trim().length >= 2) scheduleSuggestions(); });
els.name?.addEventListener('keydown', (event) => {
  if (els.suggestions?.hidden || !state.suggestionItems.length) return;
  if (event.key === 'ArrowDown') { event.preventDefault(); state.suggestionIndex = Math.min(state.suggestionIndex + 1, state.suggestionItems.length - 1); updateSuggestionHighlight(); }
  else if (event.key === 'ArrowUp') { event.preventDefault(); state.suggestionIndex = Math.max(state.suggestionIndex - 1, 0); updateSuggestionHighlight(); }
  else if (event.key === 'Enter' && state.suggestionIndex >= 0) { event.preventDefault(); selectSuggestion(state.suggestionIndex); }
  else if (event.key === 'Escape') hideSuggestions();
});
els.suggestions?.addEventListener('click', (event) => { const button = event.target.closest('[data-suggestion-index]'); if (button) { event.preventDefault(); event.stopPropagation(); selectSuggestion(Number(button.dataset.suggestionIndex)); } });
els.playerClanCard?.addEventListener('click', () => {
  const guildId = Number(els.playerClanCard.dataset.clanId);
  if (!Number.isSafeInteger(guildId) || guildId <= 0) return;
  document.body.classList.add('page-leaving');
  window.setTimeout(() => { location.href = `/clan/${encodeURIComponent(guildId)}`; }, 180);
});
els.clansSearch?.addEventListener('input', scheduleClanSearch);
els.clansRefresh?.addEventListener('click', () => loadClans({ refresh: true }));
els.clanModal?.addEventListener('click', (event) => { if (event.target.closest('[data-clan-close]')) closeClanModal(); });
els.refreshLeaderboard.addEventListener('click', () => loadLeaderboard());
els.leaderboardLoadMore?.addEventListener('click', () => loadLeaderboard({ append: true }));
els.leaderboardSearch?.addEventListener('input', scheduleLeaderboardSearch);
els.leaderboardRegion.addEventListener('change', loadLeaderboard);
els.leaderboardMode.addEventListener('change', loadLeaderboard);
els.esportsRegion?.addEventListener('change', () => loadEsports());
els.esportsMode?.addEventListener('change', () => loadEsports());
els.powerSearch?.addEventListener('input', schedulePowerRankingSearch);
els.powerLoadMore?.addEventListener('click', () => loadEsports({ append: true }));

els.refreshPlayerStats?.addEventListener('click', async () => {
  const id = state.currentPlayer?.player?.brawlhalla_id;
  if (!id || els.refreshPlayerStats.disabled) return;
  els.refreshPlayerStats.disabled = true;
  try { await loadPlayer(id, { refresh: true, shouldScroll: false }); }
  finally { els.refreshPlayerStats.disabled = false; }
});

els.languageToggle.addEventListener('click', () => { state.language = state.language === 'en' ? 'ar' : 'en'; applyLanguage(); });
els.legendStatsSearch?.addEventListener('input', renderLifetimeLegends);
els.legendStatsFilter?.addEventListener('change', renderLifetimeLegends);
els.legendStatsSort?.addEventListener('change', renderLifetimeLegends);

document.querySelectorAll('[data-arena-auth-mode]').forEach((button) => button.addEventListener('click', () => setArenaAuthMode(button.dataset.arenaAuthMode)));
els.arenaAuthForm?.addEventListener('submit', submitArenaAuth);
els.arenaLogout?.addEventListener('click', async () => { await arenaRequest('/api/arena/logout', { method: 'POST' }).catch(() => null); state.arenaUser = null; window.dispatchEvent(new CustomEvent('arena-account-changed', { detail: { user: null, unread: 0 } })); renderArenaAccount(); renderArenaPosts(); });
els.arenaImageInput?.addEventListener('change', async () => {
  try {
    state.arenaImageData = await readArenaImage(els.arenaImageInput.files?.[0]);
    els.arenaImagePreview.src = state.arenaImageData;
    els.arenaImagePreview.hidden = false;
    els.arenaUploadPrompt.hidden = true;
    setArenaFormStatus(els.arenaPostStatus);
  } catch (error) {
    resetArenaImage();
    setArenaFormStatus(els.arenaPostStatus, error.message, 'error');
  }
});
els.arenaPostForm?.addEventListener('submit', submitArenaPost);
els.arenaRefresh?.addEventListener('click', () => loadArenaPosts());
els.arenaFeed?.addEventListener('click', (event) => {
  const reply = event.target.closest('[data-arena-reply-id]');
  if (reply) {
    const post = reply.closest('.arena-post');
    const form = post?.querySelector('.arena-comment-form');
    if (!form) return;
    form.elements.parent_id.value = reply.dataset.arenaReplyId;
    const banner = form.querySelector('.arena-replying');
    banner.hidden = false;
    banner.querySelector('span').textContent = `${t('arenaReplyingTo')} @${reply.dataset.arenaReplyUser}`;
    form.elements.text.focus();
  }
  if (event.target.closest('[data-arena-cancel-reply]')) {
    const form = event.target.closest('.arena-comment-form');
    form.elements.parent_id.value = '';
    form.querySelector('.arena-replying').hidden = true;
  }
});
els.arenaFeed?.addEventListener('submit', (event) => {
  const form = event.target.closest('.arena-comment-form');
  if (!form) return;
  event.preventDefault();
  submitArenaComment(form);
});

if (isEsportsPage) {
  const params = new URLSearchParams(location.search);
  state.esportsView = esportsRouteView;
  if (esportsRouteView === 'power') {
    const region = params.get('region');
    const mode = params.get('mode');
    const query = params.get('q') || '';
    if (els.powerSearch) els.powerSearch.value = query;
    if (els.esportsRegion && ['NA','EU','SA','SEA','MENA'].includes(region)) els.esportsRegion.value = region;
    if (els.esportsMode && ['1v1','2v2'].includes(mode)) els.esportsMode.value = mode;
  } else {
    const type = params.get('type');
    const region = params.get('region');
    const mode = params.get('mode');
    if (['official','community'].includes(type)) state.tournamentType = type;
    if (els.tournamentDirectoryRegion && ['ALL','NA','EU','SA','SEA','MENA','AUS','JPN'].includes(region)) els.tournamentDirectoryRegion.value = region;
    if (['ALL','1v1','2v2'].includes(mode)) state.tournamentMode = mode;
    if (els.tournamentDirectoryMode) els.tournamentDirectoryMode.value = state.tournamentMode;
    document.querySelectorAll('[data-tournament-type]').forEach((button) => {
      const active = button.dataset.tournamentType === state.tournamentType;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-tournament-mode]').forEach((button) => {
      const active = button.dataset.tournamentMode === state.tournamentMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }
}
if (els.rankedModeLabel) els.rankedModeLabel.textContent = els.leaderboardMode?.value || '1v1';
setupMotionSelects();
setupScrollReveal();
els.rankedMenu?.querySelectorAll('[data-ranked-mode]').forEach((button) => button.classList.toggle('selected', button.dataset.rankedMode === (els.leaderboardMode?.value || '1v1')));
els.esportsMenu?.querySelectorAll('[data-esports-view]').forEach((button) => button.classList.toggle('selected', button.dataset.esportsView === state.esportsView));
if (isLiveQueuePage) setupLiveQueuePage();
if (isArenaPage) setupArenaPage();
if (isClanPage) loadStandaloneClan();
setupThemePicker();
applyLanguage();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('page-entering')));
function resetBrowserNavigationState() {
  const body = document.body;
  if (!body) return;
  body.classList.remove('page-leaving');
  body.style.removeProperty('opacity');
  body.style.removeProperty('transform');
  body.style.removeProperty('filter');
  body.style.removeProperty('pointer-events');
  closeRankedMenu?.();
  closeQueueMenu?.();
  closeEsportsMenu?.({ force: true });
}

// Browsers can restore a page from the back/forward cache with the old
// page-leaving class still applied. Clear it immediately so Back/Forward
// never returns to a black, non-interactive screen.
window.addEventListener('pageshow', (event) => {
  resetBrowserNavigationState();
  requestAnimationFrame(() => {
    resetBrowserNavigationState();
    activateImageFallbacks();
  });
  if (event.persisted && standalonePlayerId && state.currentPlayer) {
    loadPlayer(standalonePlayerId, { background: true, shouldScroll: false, silent: true, autoVerify: false }).catch(() => null);
  }
});
window.addEventListener('popstate', resetBrowserNavigationState);
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && els.clanModal && !els.clanModal.hidden) closeClanModal(); });
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  resetBrowserNavigationState();
  activateImageFallbacks();
  if (isLiveQueuePage) loadLiveQueue({ silent: true }).catch(() => null);
  const playerId = state.currentPlayer?.player?.brawlhalla_id;
  const fetchedAt = new Date(state.currentPlayer?.player?.updated_at || 0).getTime();
  if (playerId && (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > 60_000)) {
    loadPlayer(playerId, { background: true, shouldScroll: false, silent: true, autoVerify: false }).catch(() => null);
  }
});

const pageParams = new URLSearchParams(location.search);
const playerFromUrl = pageParams.get('player');
const rankedFromUrl = pageParams.get('ranked');
if (standalonePlayerId) loadPlayer(standalonePlayerId);
else if (playerFromUrl && /^\d+$/.test(playerFromUrl)) navigateToPlayer(playerFromUrl);
else if (!isLiveQueuePage && !isClanPage && !isArenaPage && !isEsportsPage && ['1v1', '2v2', '3v3'].includes(rankedFromUrl)) window.setTimeout(() => chooseRankedMode(rankedFromUrl), 180);
