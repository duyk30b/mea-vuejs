export class ESDom {
  static writeWindow = (
    doc: Document,
    options: { html: string; cssList?: string[]; jsList?: string[] },
  ) => {
    const { html, cssList, jsList } = options
    doc.open()
    doc.write(html)
    if (cssList) {
      cssList.forEach((css) => {
        if (!css) return
        let cssElement = document.createElement('style')
        cssElement.innerHTML = css
        doc.head.append(cssElement)
      })
    }
    if (jsList) {
      jsList.forEach((js) => {
        if (!js) return
        let jsElement = document.createElement('script')
        jsElement.innerHTML = js
        doc.body.append(jsElement)
      })
    }
    doc.close()
  }

  static async startPrint(id: string, options: { html: string; cssList?: string[]; jsList?: string[] }) {
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

  static downloadFile = (file: {
    buffer: { type: 'Buffer'; data: any[] }
    mimeType: string
    filename: string
  }) => {
    const uint8Array = new Uint8Array(file.buffer.data)
    const blob = new Blob([uint8Array], {
      type: file.mimeType,
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}
