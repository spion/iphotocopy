import { makeAutoObservable, runInAction } from "mobx"
import { loadFiles } from "../utils/upload"
import { joinPath } from "../utils/dirs"

export class UploadEntry {
  file: File
  status: "pending" | "uploading" | "uploaded" | "cancelled" | "error" = "pending"
  statusText?: string
  statusUpdatedTimestamp: number = Date.now()

  constructor(file: File) {
    this.file = file
    makeAutoObservable(this)
  }

  private cancelController: AbortController | null = null
  cancelUpload() {
    if (this.status == "uploading" || this.status == "pending") {
      this.status = "cancelled"
      this.statusUpdatedTimestamp = Date.now()
      if (this.cancelController) {
        this.cancelController.abort()
      }
    }
  }
  async uploadTo(targetDir: string) {
    if (this.status == "uploading") {
      throw new Error("Cannot rerun upload while it is already in progress")
    }
    runInAction(() => {
      this.status = "uploading"
      this.statusUpdatedTimestamp = Date.now()
      this.cancelController = new AbortController()
    })
    let targetDirTrimmed = targetDir.replace(/^\/+|\/+$/g, "")
    let signal = this.cancelController.signal
    let responsePromise = fetch(joinPath("/api/upload/", targetDirTrimmed, this.file.name), {
      method: "POST",
      body: this.file,
      signal,
    })
    let response = await responsePromise
    if (response.ok) {
      runInAction(() => {
        console.log("File uploaded")
        this.status = "uploaded"
        this.statusUpdatedTimestamp = Date.now()
      })
    } else {
      let text = ""
      try {
        text = (await response.json()).message
      } catch (e) {
        text = String(e)
      }
      runInAction(() => {
        if (this.status == "cancelled") return
        this.status = "error"
        this.statusText = text
        this.statusUpdatedTimestamp = Date.now()
      })
    }
  }

  resetToPending() {
    this.status = "pending"
    this.statusUpdatedTimestamp = Date.now()
  }

  get isPending() {
    return this.status == "pending"
  }

  get isFailed() {
    return this.status == "error"
  }
}

export class Uploader {
  constructor(public uploadPath: string) {
    makeAutoObservable(this)
    this.filesToUpload = []
  }

  filesToUpload: UploadEntry[]

  async uploadFiles() {
    let files = await loadFiles()
    let entries = files.map(file => new UploadEntry(file))
    runInAction(() => {
      this.filesToUpload = entries
      this.processUpload()
    })
  }

  async processUpload() {
    let pendingEntries = this.filesToUpload.filter(e => e.isPending)

    for (let entry of pendingEntries) {
      entry.uploadTo(this.uploadPath)
    }
  }

  async retryFailedUploads() {
    let failedEntries = this.filesToUpload.filter(e => e.isFailed)
    for (let entry of failedEntries) {
      entry.resetToPending()
    }
    this.processUpload()
  }

  get uploadProgress() {
    let entries = this.filesToUpload
    let total = entries.length
    let uploaded = entries.filter(e => e.status == "uploaded").length
    let uploading = entries.filter(e => e.status == "uploading").length
    let pending = entries.filter(e => e.status == "pending").length
    let error = entries.filter(e => e.status == "error").length
    let cancelled = entries.filter(e => e.status == "cancelled").length
    return { total, uploaded, uploading, pending, error, cancelled }
  }

  get isUploadInProgress() {
    return this.uploadProgress.uploading > 0 || this.uploadProgress.pending > 0
  }

  get isUploadFinishedWithFailures() {
    return this.uploadProgress.error > 0
  }

  cancelUpload() {
    for (let entry of this.filesToUpload) {
      entry.cancelUpload()
    }
  }
}
