import { makeAutoObservable } from "mobx"
import { Browser } from "./browser"
import { Uploader } from "./uploader"

export class AppModel {
  constructor() {
    makeAutoObservable(this)
  }

  public currentMode: "browse" | "upload" = "browse"
  public browser = new Browser()
  public uploader: Uploader | null = null

  public startUploader() {
    this.uploader = new Uploader(this.browser.currentPath)
    this.uploader.uploadFiles()
    this.currentMode = "upload"
  }

  public startBrowser() {
    this.currentMode = "browse"
  }
}
