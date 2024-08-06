import { makeAutoObservable } from "mobx"
import { IPromiseBasedObservable, fromPromise } from "mobx-utils"

export class DirectoryEntry {
  get downloadUrl() {
    return `/api/fs/${this.fullPath}`
  }

  get thumbnailUrl() {
    return `/api/thumbnail/${this.fullPath}`
  }

  constructor(private parentPath: string, public name: string, public isDirectory: boolean) {
    makeAutoObservable(this)
  }

  get fullPath() {
    return `${this.parentPath}${this.name}`
  }
}

export class Browser {
  public currentPath: string = ""
  public fileList: IPromiseBasedObservable<DirectoryEntry[]> = fromPromise(
    new Promise<DirectoryEntry[]>(() => {})
  )

  constructor() {
    makeAutoObservable(this)
    this.fileListRefresh()
  }

  private fileListRefresh() {
    console.log("Current Path", this.currentPath)
    this.fileList = fromPromise(this.getCurrentFiles(this.currentPath), this.fileList)
  }

  private async getCurrentFiles(path: string): Promise<DirectoryEntry[]> {
    const response = await fetch(`/api/fs/${path}`)
    let results = (await response.json()) as { name: string; isDirectory: boolean }[]
    return results.map(
      r => new DirectoryEntry(this.pathToPathComponent(path), r.name, r.isDirectory)
    )
  }

  get isToplevel() {
    return this.currentPath == "/"
  }

  cd(path: string) {
    if (path == "..") {
      this.currentPath = this.currentPath.replace(/\/?[^/]+\/?$/, "")
    } else {
      this.currentPath = `${this.currentPathComponent}${path}`
    }
    this.fileListRefresh()
  }

  private pathToPathComponent(path: string) {
    return path ? path + "/" : ""
  }
  get currentDirName() {
    return this.currentPath.split("/").filter(Boolean).slice(-1)[0] || "Home"
  }

  get currentPathComponent() {
    return this.pathToPathComponent(this.currentPath)
  }

  currentPathBreadCrumbs() {
    return this.currentPath.split("/").filter(Boolean)
  }

  async mkdirp(path: string) {
    await fetch(`/api/mkdirp/${this.currentPathComponent}${path}`, { method: "POST" })
    await this.fileListRefresh()
  }
}
