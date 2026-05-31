class GuideItem {
  fileName: string
  title: string
  type: string

  constructor({ fileName, title, type }: { fileName: string; title: string; type: string }) {
    this.fileName = fileName
    this.title = title
    this.type = type
  }
}

export default GuideItem
