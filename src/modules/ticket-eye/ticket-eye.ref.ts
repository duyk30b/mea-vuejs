import { ref } from 'vue'
import { Ticket } from '../ticket'

export const ticketEyeRef = ref<Ticket>(Ticket.blank())
export const ticketEyeList = ref<Ticket[]>([])

export type DiagnosisSpecialEye = {
  // Oculus Sinister: Mắt trái
  // Oculus Dexter: Mắt phải
  // Sphere (SPH): Độ cầu (âm là cận thị, dương là viễn thị, ví dụ như SPH -2.00)
  // Cylinder (CYL): Là độ trụ của mắt, chỉ số thể hiện độ loạn (âm là cận loạn, dương là viễn loạn, ví dụ CYL +2.0)
  // Axis (AXE): Trục loạn là thông số bổ sung cho tình trạng loạn thị. (từ 1 đến 180)
  // ADD (cộng thêm): Đây là kết quả của phép đo xuất hiện trong đơn kính hai tròng nhằm khắc phục tình trạng lão thị.
  // Diopters (DIOP hay Độ): Giá trị càng lớn, thì mức độ cận thị hoặc viễn thị của bạn càng nặng.
  // KCDT (PD): Khoảng Cách Đồng Tử (hay Tâm mắt), khi cắt kính, cần đo được sự đồng tâm của: Đồng tử và tâm của tròng kính
  // SE: độ kính khuyến nghị
  // Ví dụ:
  // OD: -2.00 (- 1.50 x 180): Có nghĩa là mắt phải bị cận 2 độ và loạn 1,5 độ và trục là 180 độ.
  // OS: +2.50 (+ 3.00 x 45): Có nghĩa là mắt trái bị viễn thị 2.5 độ và loạn 3 độ với trục là 45 độ.

  // ThiLuc_MP: string // Ghi chú
  // NhanAp_MP: string // Ghi chú
  // MiMatKetMac_MP: string
  // GiacMac_MP: string
  // TienPhongMongMat_MP: string
  // ThuyTinhThe_MP: string
  // DayMat_MP: string

  // ThiLuc_MT: string // Ghi chú
  // NhanAp_MT: string // Ghi chú
  // MiMatKetMac_MT: string
  // GiacMac_MT: string
  // TienPhongMongMat_MT: string
  // ThuyTinhThe_MT: string
  // DayMat_MT: string

  KhucXaMay_MP_Cau?: number
  KhucXaMay_MP_Loan?: number
  KhucXaMay_MP_TrucLoan?: number
  KhucXaMay_MT_Cau?: number
  KhucXaMay_MT_Loan?: number
  KhucXaMay_MT_TrucLoan?: number
  KhucXaMay_KhoangCachDongTu?: number

  KhucXaKinhCu_MP_KhongKinh?: number
  KhucXaKinhCu_MP_Cau?: number
  KhucXaKinhCu_MP_Tru?: number
  KhucXaKinhCu_MP_Truc?: number
  KhucXaKinhCu_MP_CoKinh?: number
  KhucXaKinhCu_MT_KhongKinh?: number
  KhucXaKinhCu_MT_Cau?: number
  KhucXaKinhCu_MT_Tru?: number
  KhucXaKinhCu_MT_Truc?: number
  KhucXaKinhCu_MT_CoKinh?: number
  KhucXaKinhCu_Note?: string

  KhucXaNhinXa_MP_KhongKinh?: number
  KhucXaNhinXa_MP_Cau?: number
  KhucXaNhinXa_MP_Tru?: number
  KhucXaNhinXa_MP_Truc?: number
  KhucXaNhinXa_MP_CoKinh?: number
  KhucXaNhinXa_MT_KhongKinh?: number
  KhucXaNhinXa_MT_Cau?: number
  KhucXaNhinXa_MT_Tru?: number
  KhucXaNhinXa_MT_Truc?: number
  KhucXaNhinXa_MT_CoKinh?: number
  KhucXaNhinXa_Note?: string

  KhucXaNhinGan_MP_KhongKinh?: number
  KhucXaNhinGan_MP_Cau?: number
  KhucXaNhinGan_MP_Tru?: number
  KhucXaNhinGan_MP_Truc?: number
  KhucXaNhinGan_MP_CoKinh?: number
  KhucXaNhinGan_MT_KhongKinh?: number
  KhucXaNhinGan_MT_Cau?: number
  KhucXaNhinGan_MT_Tru?: number
  KhucXaNhinGan_MT_Truc?: number
  KhucXaNhinGan_MT_CoKinh?: number
  KhucXaNhinGan_Note?: string

  KhucXaSauLietDieuTiet_MP_KhongKinh?: number
  KhucXaSauLietDieuTiet_MP_Cau?: number
  KhucXaSauLietDieuTiet_MP_Tru?: number
  KhucXaSauLietDieuTiet_MP_Truc?: number
  KhucXaSauLietDieuTiet_MP_CoKinh?: number
  KhucXaSauLietDieuTiet_MP_ADD?: number
  KhucXaSauLietDieuTiet_MT_KhongKinh?: number
  KhucXaSauLietDieuTiet_MT_Cau?: number
  KhucXaSauLietDieuTiet_MT_Tru?: number
  KhucXaSauLietDieuTiet_MT_Truc?: number
  KhucXaSauLietDieuTiet_MT_CoKinh?: number
  KhucXaSauLietDieuTiet_MT_ADD?: number
  KhucXaSauLietDieuTiet_KhoangCachDongTu?: number
  KhucXaSauLietDieuTiet_Note?: string

  NhanAp_MP_mmHg?: number
  BeDayGiacMac_MP_micrometer?: number
  DuongKinhDongTu_MP_millimeter?: number
  ChieuDaiTrucNhanCau_MP?: number
  BienDoDieuTiet_MP?: number

  NhanAp_MT_mmHg?: number
  BeDayGiacMac_MT_micrometer?: number
  DuongKinhDongTu_MT_millimeter?: number
  ChieuDaiTrucNhanCau_MT?: number
  BienDoDieuTiet_MT?: number

  SoKinhChiDinh_MP_Cau?: number
  SoKinhChiDinh_MP_Tru?: number
  SoKinhChiDinh_MP_Truc?: number
  SoKinhChiDinh_MP_ADD?: number
  SoKinhChiDinh_MT_Cau?: number
  SoKinhChiDinh_MT_Tru?: number
  SoKinhChiDinh_MT_Truc?: number
  SoKinhChiDinh_MT_ADD?: number
  SoKinhChiDinh_KhoangCachDongTu?: number
}
