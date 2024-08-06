import express from "express"
import * as util from "util"
import * as path from "path"
import * as fs from "fs/promises"
import { existsSync } from "fs"

import { pipeline as pipelineCallback } from "stream"
const pipeline = util.promisify(pipelineCallback)
import { createWriteStream } from "fs"
import { createResizePool } from "./imager-pool"

const app = express()

if (!process.env["BASE_DIRECTORY"]) {
  throw new Error("BASE_DIRECTORY is not defined")
}

app.get("/api/fs/*", async (req, res) => {
  let queryPath = req.path.replace(/^\/api\/fs\//, "")
  let resolvedPath = path.resolve(process.env["BASE_DIRECTORY"], queryPath)
  if (!resolvedPath.startsWith(process.env["BASE_DIRECTORY"])) {
    res.status(403).json({ message: "Invalid path" })
    return
  }
  if (!existsSync(resolvedPath)) {
    res.status(404).json({ message: "File not found" })
    return
  }
  let stats = await fs.stat(resolvedPath)
  if (stats.isDirectory()) {
    let files = await fs.readdir(resolvedPath)
    let filesWithStats = await Promise.all(
      files.map(async file => {
        let filePath = path.join(resolvedPath, file)
        let fileStats = await fs.stat(filePath)
        return {
          name: file,
          isDirectory: fileStats.isDirectory(),
        }
      })
    )
    res.json(filesWithStats)
  } else {
    res.sendFile(resolvedPath)
  }
})

let resizeThumbnail = createResizePool()
app.get("/api/thumbnail/*", async (req, res) => {
  let queryPath = req.path.replace(/^\/api\/thumbnail\//, "")
  let decodedURIpath = decodeURIComponent(queryPath)
  let resolvedPath = path.resolve(process.env["BASE_DIRECTORY"], decodedURIpath)
  if (!resolvedPath.startsWith(process.env["BASE_DIRECTORY"])) {
    res.status(403).json({ message: "Invalid path" })
    return
  }
  if (!existsSync(resolvedPath)) {
    res.status(404).json({ message: "File not found" })
    return
  }
  try {
    let stats = await fs.stat(resolvedPath)
    if (stats.isDirectory()) {
      res.status(400).json({ message: "Cannot generate thumbnail for a directory" })
      return
    }
    let outputThumbnail = await resizeThumbnail(resolvedPath, 256, 256)
    res.status(200).contentType("image/jpeg")
    await pipeline(outputThumbnail, res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.post("/api/mkdirp/*", async (req, res) => {
  let queryPath = req.path.replace(/^\/api\/mkdirp\//, "")
  let resolvedPath = path.resolve(process.env["BASE_DIRECTORY"], queryPath)
  if (!resolvedPath.startsWith(process.env["BASE_DIRECTORY"])) {
    res.status(403).json({ message: "Invalid path" })
    return
  }
  await fs.mkdir(resolvedPath, { recursive: true })
  res.json({ message: "Directory created" })
})

app.post("/api/upload/*", async (req, res) => {
  let queryPath = req.path.replace(/^\/api\/upload\//, "")
  let resolvedPath = path.resolve(process.env["BASE_DIRECTORY"], queryPath)
  if (!resolvedPath.startsWith(process.env["BASE_DIRECTORY"])) {
    res.status(403).json({ message: "Invalid path" })
    return
  }
  // If the file already exists, return conflict
  try {
    await fs.stat(resolvedPath)
    if (req.query.overwrite !== "true") {
      res.status(409).json({ message: "File already exists" })
      return
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      res.status(500).json({ message: err.message })
      return
    }
  }

  try {
    await pipeline(req, createWriteStream(resolvedPath))
    res.json({ message: "File uploaded" })
  } catch (err) {
    res.status(500).json({ message: err.message })
    return
  }
})

export default app
