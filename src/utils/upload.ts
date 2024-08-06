export function loadFiles(method: "binary" | "dataurl" = "binary") {
  return new Promise<File[]>((resolve, reject) => {
    let f = document.createElement("input")
    f.style.display = "none"
    f.type = "file"
    f.name = "file"
    f.multiple = true
    document.body.appendChild(f)
    f.addEventListener("change", function (e) {
      if (this.files == null) return reject(new Error("No file selected"))
      let file = this.files.item(0)

      if (file == null) return reject(new Error("No file selected"))
      let cnt = 0
      let fileCount = this.files.length
      let results: File[] = []

      for (let k = 0; k < this.files.length; ++k) {
        let file = this.files.item(k)
        results.push(file)
      }
      resolve(results)
    })

    f.click()
  })
}
