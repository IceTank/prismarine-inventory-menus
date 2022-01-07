const mcServer = require('flying-squid')

const server = mcServer.createMCServer({
  motd: 'A Minecraft Server \nRunning flying-squid',
  port: 25567,
  'max-players': 10,
  'online-mode': false,
  logging: true,
  gameMode: 1,
  difficulty: 1,
  worldFolder: 'world',
  generation: {
    name: 'diamond_square',
    options: {
      worldHeight: 80
    }
  },
  kickTimeout: 10000,
  plugins: {
    'squid-menu': ''
  },
  modpe: false,
  'view-distance': 10,
  'player-list-text': {
    header: { text: 'Flying squid' },
    footer: { text: 'Test server' }
  },
  'everybody-op': true,
  'max-entities': 100,
  version: '1.12.2'
})
