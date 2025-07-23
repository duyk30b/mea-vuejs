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

  static async startPrint(
    id: string,
    options: { html: string; cssList?: string[]; jsList?: string[] },
  ) {
    let w: Window

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      w = window.open('', '_blank') as Window
    } else {
      const iframePrint = document.getElementById(id) as HTMLIFrameElement
      if (!iframePrint) {
        alert(`Lỗi: Không tìm thấy iframe với id = "${id}"`)
      }
      w = iframePrint.contentWindow as Window
    }

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

  static cleanHtml = (html: string) => {
    /* 1. Parse chuỗi thành DOM */
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const body = doc.body

    /* 2. Cấu hình giữ lại */
    const allowTagName = ['colgroup', 'col', 'img', 'image']
    const allowedAttrs = ['rowspan', 'colspan']
    const allowedStyleProps = ['color', 'font-weight', 'font-style', 'text-align']

    /* Giữ lại một số thuộc tính style */
    function filterStyle(style: any) {
      const keep = []
      for (let i = 0; i < style.length; i++) {
        const prop = style[i]
        const value = style.getPropertyValue(prop)
        if (allowedStyleProps.includes(prop)) {
          keep.push(`${prop}: ${value}`)
        }
      }
      return keep.join('; ')
    }

    /* 3. Hàm đệ quy làm sạch */
    function cleanDOM(node: any) {
      if (node.nodeType === 8) {
        node.remove() // <--  XOÁ COMMENT
        return
      }
      const tagName = node.tagName?.toLowerCase() || ''
      if (allowTagName.includes(tagName)) {
        return
      }

      if (node.nodeType === 1) {
        // 1 = ELEMENT_NODE
        /* Lọc các attribute */
        for (const attr of [...node.attributes]) {
          const name = attr.name.toLowerCase()

          if (name === 'style') {
            const filtered = filterStyle(node.style)
            if (filtered) {
              node.setAttribute('style', filtered)
            } else {
              node.removeAttribute('style')
            }
          } else if (!allowedAttrs.includes(name)) {
            node.removeAttribute(name)
          }
        }
      }

      if (tagName === 'table') {
        node.style.width = '100%'
      }

      /* Duyệt tiếp các node con */
      for (const child of [...node.childNodes]) {
        cleanDOM(child)
      }
    }

    /* 4. Thực thi cho mọi node con của <body> */
    for (const child of [...body.childNodes]) {
      cleanDOM(child)
    }

    /* 5. Ghi kết quả trở lại textarea */
    return body.innerHTML.trim()
  }
}
