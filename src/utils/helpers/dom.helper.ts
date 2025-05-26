export class ESDom {
  static writeWindow = (doc: Document, options: { html: string; css?: string; js?: string }) => {
    const { html, css, js } = options
    doc.open()
    doc.write(html)
    if (css) {
      let cssElement = document.createElement('style')
      cssElement.innerHTML = css
      doc.head.append(cssElement)
    }
    if (js) {
      let jsElement = document.createElement('script')
      jsElement.innerHTML = js
      doc.body.append(jsElement)
    }
    doc.close()
  }

  static async startPrint(id: string, options: { html: string; css?: string; js?: string }) {
    const iframePrint = document.getElementById(id) as HTMLIFrameElement
    if (!iframePrint) {
      alert(`Lỗi: Không tìm thấy iframe với id = "${id}"`)
    }
    const w = iframePrint.contentWindow as Window

    ESDom.writeWindow(w.document, options)

    // Đợi tất cả hình ảnh tải xong
    const images = w.document.images
    const imagePromises = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (!img.complete) {
        imagePromises.push(
          new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve() // Xử lý trường hợp tải hình ảnh thất bại
          }),
        )
      }
    }
    await Promise.all(imagePromises)
    w.focus()
    w.print()
  }
}
