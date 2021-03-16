import axios from 'axios'
import fs from 'fs/promises'
import rimraf from 'rimraf'
import ora from 'ora'
import { join } from 'path'

// Constants
const BATCH_DOWNLOAD_SIZE = 15
const DIST_DIR_PATH = join (__dirname, './dist')

// Functions
function mkdir(p: string) {
  return fs.mkdir(p, { recursive: true })
}

function rm(p: string) {
  return new Promise<void>((resolve, reject) => {
    rimraf(p, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// Run
(async () => {
  const spinner = ora('Start to download marks...').start()
  await rm(DIST_DIR_PATH)
  await mkdir(DIST_DIR_PATH)
  const { data }: { data: { mark: string }[] } = await axios.get('https://raw.githubusercontent.com/maplestory-music/maplebgm-db/prod/bgm.min.json')
  const marks = data.map(i => i.mark)
  const batches = (new Array(Math.ceil(marks.length / 10))).fill(null)
    .map((_, i) => {
      const batchMarks = marks.slice(i * BATCH_DOWNLOAD_SIZE, (i + 1) * BATCH_DOWNLOAD_SIZE)
      return () => {
        return Promise.all(batchMarks.map(async (mark) => {
          const { data }: { data: Buffer } = await axios.get(
            `https://maplestory-music.github.io/mark/${mark}.png`,
            {
              responseType: 'arraybuffer'
            }
          )
          fs.writeFile(
            join(DIST_DIR_PATH, `${mark}.png`),
            data
          )
        }))
      }
    })
  for (const exec of batches) {
    await exec()
  }
  spinner.succeed('Finish downloading marks! Ready to deploy!')
})()