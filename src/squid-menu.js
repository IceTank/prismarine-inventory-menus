const EventEmitter = require('events').EventEmitter
const Nbt = require('prismarine-nbt')
let mcData

/**
 * @typedef ActionData
 * @property {number} slot 
 * @property {number} mouseButton
 * @property {number} action
 * @property {number} mode
 * @property {object} item
 */

/**
 * @typedef PlayerCtx
 * @property {Player} player
 */

/**
 * @typedef Player
 * @property {import('events').EventEmitter} _events
 * @property {number} id
 * @property {import('prismarine-item').Item} heldItem
 * @property {import('prismarine-world').World} world
 * @property {import('prismarine-windows').Window} inventory
 * @property {string} username
 */

/** GenericMenuActionCallback
 * @callback GenericMenuActionCallback
 * @param {Player} playerCtx
 * @param {ActionData} actionData
 * @param {function} setCanceled
 */

module.exports.server = (serv, { version }) => {
  // const Item = require('prismarine-item')(version)
  // const Nbt = require('prismarine-nbt')(version)
  // const Window = require('prismarine-windows')(version)
  mcData = require('minecraft-data')(version)

  const Menu = new GenericMenu(mcData)
  const Menu2 = new GenericMenu(mcData, new InventoryContent('Move', 'minecraft:dropper', [
    new SlotItem(mcData.itemsByName.obsidian.id, 1, null),
    new SlotItem(mcData.itemsByName.glass.id, 1, null),
    new SlotItem(mcData.itemsByName.obsidian.id, 1, null),
    new SlotItem(mcData.itemsByName.glass.id, 1, null),
    new SlotItem(mcData.itemsByName.glass.id, 1, null),
    new SlotItem(mcData.itemsByName.glass.id, 1, null),
    new SlotItem(mcData.itemsByName.obsidian.id, 1, null),
    new SlotItem(mcData.itemsByName.glass.id, 1, null),
    new SlotItem(mcData.itemsByName.obsidian.id, 1, null)
  ]))
  
  const MainMenu = new GenericMenu(mcData, new InventoryContent('Main', WindowTypes['minecraft:chest'].type, [], 54))
  MainMenu.setAllSlots(new ItemBuilder(mcData.itemsByName.stained_glass_pane.id, 1, 0).setCustomName('').build())

  MainMenu.setSlotItem(new ItemBuilder(mcData.itemsByName.skull.id, 1, 2)
    .setCustomName('Mob Editor')
    .setCustomAction((playerCtx, data, setCanceled) => {
      setCanceled()
      console.info('Action data', data)
      if (data?.mouseButton === 0) {
        MainMenu.closeWindow(playerCtx)
        Menu2.openWindow(playerCtx)
      }
    })
    .addLoreLine('Hallo').build(), 10)
  MainMenu.setSlotItem(ItemBuilder.playerHead('Ic3Tank', 'Item Name').build(), 5)
  MainMenu.setSlotItem(new ItemBuilder(mcData.itemsByName.dirt.id).addLoreLine('1').addLoreLine('2').setCustomName('1').build(), 7)
  MainMenu.setSlotItem(new ItemBuilder(mcData.itemsByName.dirt.id).setCustomName('1').addLoreLine('1').addLoreLine('2').build(), 8)
  MainMenu.setSlotItem(new ItemBuilder(mcData.itemsByName.dirt.id).addLoreLine('2').build(), 9)
  MainMenu.setSlotItem(new ItemBuilder(mcData.itemsByName.dirt.id).build(), 11)
  MainMenu.setSlotItem(new ItemBuilder(mcData.itemsByName.barrier.id)
    .setCustomName('Close')
    .setCustomAction((playerCtx, data, setCanceled) => {
      setCanceled()
      MainMenu.closeWindow(playerCtx)
    }).build(), 12)

  PlayerHandle.addMenuToItem(mcData.itemsByName.nether_star, MainMenu)

  serv.commands.add({
    base: 'list',
    aliases: ['list'],
    info: 'Lists players',
    op: true,
    action(params, ctx) {
      console.info(ctx)
      if (ctx.player) {
        ctx.player.chat('List')
      }
    }
  })

  serv.commands.add({
    base: 'menu2',
    aliases: ['m2'],
    info: 'menu 2',
    usage: '/menu2',
    op: false,
    action (params, ctx) {
      if (!ctx?.player) return

      if (!params) {
        Menu2.openWindow(ctx.player)
      }
    }
  })

  serv.commands.add({
    base: 'test',
    aliases: ['test'],
    info: 'to test',
    usage: '/test',
    op: false,
    action (params, ctx) {
      if (!ctx?.player) return
      let cmd = params.split(' ')

      Menu.on('click', (data) => {
        data.player.chat(data.slot)
      })
      
      if (!params) {
        Menu.openWindow(ctx.player)
        return
      } else if (cmd[0] === 'add') {
        if (Menu.listen(ctx.player)) {
          ctx.player.chat('added listener')
        } else {
          ctx.player.chat('allready listening')
        }
      } else if (cmd[0] === 'remove') {
        Menu.removePlayerListener(ctx.player)
      } else if (cmd[0] === 'action') {
        let slot = Number(cmd[1])
        let text = cmd[2]

        if (isNaN(slot) || !text) {
          ctx.player.chat('Usage: action <slot> <text>')
          return
        }

        Menu.addItemAction(slot, () => {
          ctx.player.chat(text)
        })
        ctx.player.chat(`Added action text '${text}' to slot ${slot}`)
      }
    }
  })
}

module.exports.player = (player, serv) => {
  // player._client.on('packet', (data, meta) => {
  //   playerPacketHandler(meta, data, player)
  // })
  PlayerHandle.registerPlayer(player)
  // player._client.on('packet', (data, meta) => {
  //   if (meta.name !== 'use_item') return
  //   if (player.inventory.selectedItem?.type === mcData.itemsByName.nether_star.type) {
  //     MainMenu.openWindow(player)
  //   }
  // })
}

class ItemBuilder {
  constructor(type, count = 1, meta = 0, action = null) {
    this.type = type
    this.count = count
    this.meta = meta
    this.nbt = null
    this.action = action
  }

  build() {
    return new SlotItem(this.type, this.count, this.meta, this.nbt ? this.nbt : null, this.action)
  }


  // { name: '' }
  setCustomName(name) {
    if (!this.nbt?.value?.display?.value?.Name?.value || this.nbt?.value?.display?.value?.Name?.value !== name) {
      this.nbt = this.nbt ?? { name: '' }
      this.nbt = mergeDeep(this.nbt, Nbt.comp({
        display: Nbt.comp({
          Name: Nbt.string(name)
        })
      }))
    }
    return this
  }

  /**
   * 
   * @param {GenericMenuActionCallback} func Callback function
   * @returns {ItemBuilder}
   */
  setCustomAction(func) {
    this.action = func
    return this
  }

  getLoreLines() {
    return this.nbt?.value?.display?.value.Lore?.value.value ?? []
  }

  // TODO fix it
  removeLoreLine(int = null) {
    let lore = this.getLoreLines()
    if (int && (int < 1 || int > lore.length)) throw Error('Invalid line ' + int)
    let index = (int || lore.length) - 1
    lore = lore.splice(index, 1)
    this._setLoreData(lore)
    return this
  }

  addLoreLine(string, int = null) {
    let lore = this.getLoreLines()
    if (int && int < 1) throw Error('Invalid line ' + int)
    let line = int || lore.length
    if (lore.length < line) {
      lore = [...lore, ...(new Array(line - lore.length).fill(''))]
    }
    lore[line] = string
    this._setLoreData(lore)
    console.info(JSON.stringify(this.nbt, null, 2))
    return this
  }

  _setLoreData(data) {
    const list = (value) => {
      const type = value?.type ?? 'end'
      return { type: 'list', value: { type, value: value.value } }
    }
    this.nbt = this.nbt ?? { name: '' }
    this.nbt = mergeDeep(this.nbt, Nbt.comp({
      display: Nbt.comp({
        Lore: list(Nbt.string(data))
      })
    }))
  }
}

ItemBuilder.playerHead = (playerName, itemName) => {
  let headNbt = Nbt.comp({
    SkullOwner: Nbt.string(playerName),
    display: Nbt.comp({
      Name: Nbt.string(itemName),
      Lore: { type: 'list', value: { type: 'string', value: [ 'test' ] } }
    })
  })
  headNbt.name = ''
  let dataItem = new ItemBuilder(mcData.itemsByName.skull.id, 1, 3, headNbt)
  dataItem.nbt = headNbt
  return dataItem
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

class InventoryContent {
  constructor(containerName, windowType, slotItems = null, slotCount = null) {
    this.containerName = containerName
    this._setSlotItems = slotItems
    this.slotItems = null
    if (!(windowType in WindowTypes)) throw new Error('Invalid window type ' + windowType)
    this.windowType = WindowTypes[windowType]
    this.slotCount = slotCount ? slotCount : this.windowType.slotCount

    this.cursorHoldingItem = -1
    this._init()
  } 

  _init() {
    this.slotItems = new Array(this.slotCount)
    for (let i = 0; i < this.slotItems.length; i++) {
      if (!this._setSlotItems[i]) {
        this.slotItems[i] = new SlotItem(-1)
      } else {
        this.slotItems[i] = this._setSlotItems[i]
      }
    }
  }

  addItemAction(slot, callback) {
    console.info(this.slotItems)
    let index = Number(slot)
    if (isNaN(index) || this.slotCount <= index) throw new Error('Invalid slot ' + slot + ' of type ' + typeof slot)
    this.slotItems[index].addAction(callback)
  }

  items() {
    let arr = []
    for (let i = 0; i < this.slotCount; i++) {
      let item = {}
      if (this.slotItems[i]?.type === -1) {
        item['blockId'] = -1
      } else {
        item['blockId'] = this.slotItems[i].type
        item['itemCount'] = this.slotItems[i].count 
        item['itemDamage'] = this.slotItems[i].metadata
        if (this.slotItems[i].nbt) item.nbtData = this.slotItems[i].nbt
      }
      arr.push(item)
    }
    // for the item the cursor is holding
    return arr
  }

  cursorItem() {
    return this.cursorHoldingItem
  }
}

class SlotItem {
  /**
   * 
   * @param {number} type Type
   * @param {number} count Item stack count
   * @param {number} metadata Metadata information
   * @param {object} nbt Nbt
   * @param {GenericMenuActionCallback} action Action on click
   */
  constructor(type, count, metadata, nbt = null, action = null) {
    this.type = type || 1
    this.count = count || 1
    this.metadata = metadata || 0
    this.nbt = nbt
    /** @type {GenericMenuActionCallback} */
    this.action = action
  }

  addAction(callback) {
    this.action = callback
  } 

  removeAction() {
    this.action = null
  }
}

class GenericMenu extends EventEmitter {
  constructor(mcData, invContent) {
    super()
    this.invContent = invContent || new InventoryContent('test1', "minecraft:generic_9x3", [new SlotItem(mcData.itemsByName.dirt.id)])

    this._clientListener = []
    this.windowIdMap = {}
  }

  isListening(player) {
    for (const l of this._clientListener) {
      if (player._client.listeners('packet').includes(l)) {
        return true
      }
    }
    return false
  }

  listen(player) {
    if (this.isListening(player)) {
      console.warn('Tried to add listener to inventory again')
      return
    }
    let listener = (meta, data) => {
      this._onClientPacket(meta, data, player)
    }
    player._client.on('packet', listener)
    player.once('disconnected', () => {
      console.info('Removing listener from disconnecting player', player.username)
      this.removePlayerListener(player)
    })
    this._clientListener.push(listener)
    return true
  }

  removePlayerListener(player) {
    let foundListener = null
    let index = null
    console.info('All listener', player._client.listeners('packet'))
    for (const l of this._clientListener) {
      if (player._client.listeners('packet').includes(l)) {
        player._client.removeListener('packet', l)
        foundListener = l
        index = this._clientListener.indexOf(l)
        break
      }
    }
    if (index === null) {
      console.warn('Warning No listener has been removed for player', player.username)
      return
    }
    this._clientListener.splice(index, 1)
    console.info('Remaining listener', player._client.listeners('packet'))
  }

  addItemAction(slot, callback) {
    this.invContent.addItemAction(slot, callback)
  }

  openWindow(player) {
    if (!this.isListening(player)) this.listen(player)
    this._generateWindow(player)
    this._generateItems(player)
  }

  closeWindow(player) {
    this.removePlayerListener(player)
    this._closeWindow(player)
  }

  setAllSlots(item) {
    this.invContent.slotItems = this.invContent.slotItems.map(_ => item)
  }

  setSlotItem(item, slot) {
    if (slot > this.invContent.slotCount || slot < 0) throw Error('Invalid slot ' + slot)
    this.invContent.slotItems[slot] = item
  }

  _onClientPacket(data, meta, player) {
    /* see https://wiki.vg/Protocol#Click_Window
    data: {
      windowId: number;
      slot: number;
      mouseButton: [0-10] 
      action: number
      mode: number
      item: {
        blockId: number;
        itemCount: number;
        itemDamage: number;
        nbt?: Nbt
      }
     } */
    if (meta.name !== 'window_click') return
    // console.info('GenericMenu->_onClientPacket trigger player', player)
    if (data.windowId !== this.windowIdMap[player.uuid]) {
      console.warn('client send window_click on wrong window id')
      return
    }
    this.emit('click', { 
      player, 
      slot: data.slot, 
      mouseButton: data.mouseButton, 
      action: data.action, 
      mode: data.mode,
      item: data.item
    })
    if (data.slot === -999) {
      // Click outside the window
      return
    }

    let isCanceled = false
    this._triggerAction(player, {
      slot: data.slot, 
      mouseButton: data.mouseButton, 
      action: data.action, 
      mode: data.mode,
      item: data.item
    }, function() {
      // console.info('GenericMenu->_onclientPacket-><anon func>: isCanceledIs canceled set to true')
      isCanceled = true
    })

    // console.info('GenericMenu->_onclientPacket: isCanceled', isCanceled)
    if (!isCanceled) this._generateItems(player)
  }

  _triggerAction(player, data, setCanceled) {
    try {
      if (this.invContent.slotItems[data.slot].action) this.invContent.slotItems[data.slot].action(player, data, setCanceled)
    } catch (e) {
      console.error(`GenericMenu->_triggerAction: Something went wrong while triggering inventory action on slot ${data.slot}`)
      console.error(e)
    }
  }

  /**
   * 
   * @param player The player to send the packet to 
   */
  _generateWindow(player) {
    if (!player.currentWindowId) {
      player.currentWindowId = 2
    } else {
      player.currentWindowId += 1
    }
    this.windowIdMap[player.uuid] = player.currentWindowId
    player._client.write('open_window', {
      windowId: this.windowIdMap[player.uuid],
      inventoryType: this.invContent.windowType.type,
      windowTitle: JSON.stringify({ text: this.invContent.containerName }),
      slotCount: this.invContent.slotCount
    })
  }

  _closeWindow(player) {
    player._client.write('close_window', {
      windowId: this.windowIdMap[player.uuid]
    })
    delete this.windowIdMap[player.uuid]
  }

  _generateItems(player) {
    console.info('Generating items for', player.username)
    let items = this.invContent.items()
    // console.info('Sending items', JSON.stringify(items.filter(item => !!item.nbtData)[3], null, 2))
    player._client.write('window_items', {
      windowId: this.windowIdMap[player.uuid],
      items
    })
    // console.info('Sending cursor item', this.invContent.cursorItem())
    player._client.write('set_slot', {
      windowId: -1,
      slot: -1,
      item: this.invContent.cursorItem()
    })
  }
}

const WindowTypes = {
  "minecraft:generic_9x1": {
    "description": "A 1-row inventory, not used by the notchian server.",
    "type": "minecraft:generic_9x1",
    "slotCount": 9
  },
  "minecraft:generic_9x2": {
    "description": "A 2-row inventory, not used by the notchian server.",
    "type": "minecraft:generic_9x2",
    "slotCount": 18
  },
  "minecraft:generic_9x3": {
    "description": "General-purpose 3-row inventory. Used by Chest, minecart with chest, ender chest, and barrel",
    "type": "minecraft:generic_9x3",
    "slotCount": 27
  },
  "minecraft:generic_9x4": {
    "description": "A 4-row inventory, not used by the notchian server.",
    "type": "minecraft:generic_9x4",
    "slotCount": 36
  },
  "minecraft:generic_9x5": {
    "description": "A 5-row inventory, not used by the notchian server.",
    "type": "minecraft:generic_9x5",
    "slotCount": 45
  },
  "minecraft:generic_9x6": {
    "description": "General-purpose 6-row inventory, used by large chests.",
    "type": "minecraft:generic_9x6",
    "slotCount": 54
  },
  "minecraft:generic_3x3": {
    "description": "General-purpose 3-by-3 square inventory, used by Dispenser and Dropper",
    "type": "minecraft:generic_3x3",
    "slotCount": 9
  },
  "minecraft:anvil": {
    "description": "Anvil",
    "type": "minecraft:anvil",
    "slotCount": 0
  },
  "minecraft:beacon": {
    "description": "Beacon",
    "type": "minecraft:beacon",
    "slotCount": 1
  },
  "minecraft:crafting": {
    "description": "Crafting table",
    "type": "minecraft:crafting",
    "slotCount": 1
  },
  "minecraft:enchantment": {
    "description": "Enchantment table",
    "type": "minecraft:enchantment",
    "slotCount": 0
  },
  "minecraft:furnace": {
    "description": "Furnace",
    "type": "minecraft:furnace",
    "slotCount": 3
  },
  "minecraft:hopper": {
    "description": "Hopper or minecart with hopper",
    "type": "minecraft:hopper",
    "slotCount": 5
  },
  "minecraft:shulker_box": {
    "description": "Shulker box",
    "type": "minecraft:shulker_box",
    "slotCount": 27
  },
  "minecraft:dispenser": {
    "description": "Dispenser",
    "type": "minecraft:dispenser",
    "slotCount": 9
  },
  "minecraft:dropper": {
    "description": "Dropper",
    "type": "minecraft:dropper",
    "slotCount": 9
  },
  "minecraft:chest": {
    "description": "Chest size dependent on slot count default 27",
    "type": "minecraft:chest",
    "slotCount": 27
  }
}

class PlayerHandler {
  constructor() {
    this.players = {}
    this.globalMenus = []
  }

  addMenuToItem(item, menu) {
    this.globalMenus.push({
      item: item,
      menu,
      onClientPacket: menu._onClientPacket
    })
  }

  onItemUse(player) {
    for (const o of this.globalMenus) {
      if (o.item.type === player.inventory.selectedItem?.type) {
        try {
          o.menu.openWindow(player)
          return
        } catch (e) {
          console.warn(e)
        }
      }
    }
  }

  onClientPacket(player) {
    for (const o of this.globalMenus) {
    
    }
  }

  isListening(player) {
    return player.uuid in this.players
  }

  registerPlayer(player) {
    const p = {
      player,
      listenerUseItem: (data, meta) => {
        if (meta.name !== 'use_item') return
        this.onItemUse(player)
        // if (player.inventory.selectedItem?.type === mcData.itemsByName.nether_star.type) {
        //   MainMenu.openWindow(player)
        // }
      },
      listenerDisconnect: () => {
        console.info('Removing listener from disconnecting player', player.username)
        this.removePlayerListener(player)
      },
      listenerPacket: () => {
        this.onClientPacket(player)
      }
    }
    player._client.on('packet', p.listenerUseItem)
    player._client.on('disconnected', p.listenerDisconnect)
    player._client.on('packet', p.listenerPacket)
    this.players[player.uuid] = p
  }
}

const PlayerHandle = new PlayerHandler()

/* Pakkit window extractor script

exports.downstreamHandler = function (meta, data, server, client) {
  if (meta.name === 'open_window') {
    let { windowId, inventoryType, windowTitle, slotCount } = data
    client.sendPacket('chat', {
      message: JSON.stringify({ text: `Id: ${windowId}` }),
      position: 1
    })
    client.sendPacket('chat', {
      message: JSON.stringify({ text: `Type: ${inventoryType}` }),
      position: 1
    })
    client.sendPacket('chat', {
      message: JSON.stringify({ text: `Title: ${windowTitle}` }),
      position: 1
    })
    client.sendPacket('chat', {
      message: JSON.stringify({ text: `Slot Count: ${slotCount}` }),
      position: 1
    })
  } 
  client.sendPacket(meta, data)
}

*/
