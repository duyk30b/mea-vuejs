export class DDom {
  static async startPrint(id: string, textDom: string) {
    const iframePrint = document.getElementById(id) as HTMLIFrameElement
    if (!iframePrint) {
      alert(`Lỗi: Không tìm thấy iframe với id = "${id}"`)
    }
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(textDom)
    pri.document.close()

    // Đợi tất cả hình ảnh tải xong
    const images = pri.document.images
    const imagePromises = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (!img.complete) {
        imagePromises.push(
          new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve() // Xử lý trường hợp tải hình ảnh thất bại
          })
        )
      }
    }
    await Promise.all(imagePromises)
    pri.focus()
    pri.print()
  }
}
