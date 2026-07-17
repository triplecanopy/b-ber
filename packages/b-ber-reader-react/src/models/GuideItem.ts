export interface GuideItemProps {
  type: string
  title: string
  href: string
}

class GuideItem implements GuideItemProps {
  type: string
  title: string
  href: string
  absoluteURL: string

  constructor({ type, title, href }: GuideItemProps) {
    this.type = type
    this.title = title
    this.href = href
    this.absoluteURL = ''
  }
}

export default GuideItem
