const fs = require('fs').promises
const path = require('path')

const files = ['squid-menu.js']
const sourceDir = path.join(__dirname, '..', 'src')
const installDir = path.join(__dirname, '..', 'node_modules/flying-squid/src/plugins')

async function init () {
  // try {
  //   await fs.stat(path.join(installDir, 'squid-menu'))
  // } catch (e) {
  //   await fs.mkdir(path.join(installDir, 'squid-menu'))
  // }
  for (const file of files) {
    console.info('[Auto Install] Copying file', file, '-->', path.join(installDir, file))
    await fs.copyFile(path.join(sourceDir, file), path.join(installDir, file))
  }
}

init()
