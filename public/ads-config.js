/*
  PeakHalla advertising configuration.

  HOW TO ACTIVATE GOOGLE ADSENSE
  1. Replace client with your real ca-pub-XXXXXXXXXXXXXXXX value.
  2. Add the numeric slot ID for every placement you want to use.
  3. Change provider from "sponsor" to "adsense".
  4. Add your publisher line to public/ads.txt.

  Until then, the website shows a clean "Advertise on PeakHalla" sponsor card.
*/
window.PEAKHALLA_ADS = Object.freeze({
  enabled: true,
  provider: 'sponsor', // sponsor | adsense | off

  adsense: {
    client: '', // Example: ca-pub-1234567890123456
    slots: {
      home_top: '',
      profile_top: '',
      leaderboard_bottom: '',
      tournaments_bottom: '',
      arena_feed: '',
      queue_bottom: ''
    }
  },

  sponsor: {
    default: {
      eyebrow: 'ADVERTISING',
      title: 'Advertise on PeakHalla',
      description: 'Reach active Brawlhalla players, clans, tournament organizers, and esports fans.',
      cta: 'Book this spot',
      url: 'https://discord.gg/tCcSDAHKuf',
      image: ''
    },
    placements: {
      home_top: {
        title: 'Put your brand in front of Brawlhalla players',
        description: 'Homepage sponsorships are available for tournaments, clans, creators, and gaming brands.'
      },
      profile_top: {
        title: 'Sponsor player profile pages',
        description: 'Appear beside the stats pages players visit and share the most.'
      },
      leaderboard_bottom: {
        title: 'Reach competitive ranked players',
        description: 'Promote your tournament, clan, Discord server, coaching, or gaming product.'
      },
      tournaments_bottom: {
        title: 'Feature your Brawlhalla tournament',
        description: 'Get more registrations with a highlighted placement in the tournament directory.'
      },
      arena_feed: {
        title: 'Sponsor the Arena Wall community',
        description: 'Show your campaign beside community screenshots, rank moments, and tournament posts.'
      },
      queue_bottom: {
        title: 'Reach players checking live ranked activity',
        description: 'A focused placement for competitive Brawlhalla audiences.'
      }
    }
  }
});
