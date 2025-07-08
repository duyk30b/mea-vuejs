export const TicketAttributeKeyGeneralList = [
  'reason',
  'healthHistory',
  'summary',

  'pulse',
  'temperature',
  'bloodPressure',
  'respiratoryRate',
  'spO2',
  'height',
  'weight',

  'icd10Name',
  'icd10Code',
] as const

export const TicketAttributeKeyEyeList = [
  'reason',
  'healthHistory',
  'body',

  'ThiLuc_MP',
  'NhanAp_MP',
  'MiMatKetMac_MP',
  'GiacMac_MP',
  'TienPhongMongMat_MP',
  'ThuyTinhThe_MP',
  'DayMat_MP',

  'ThiLuc_MT',
  'NhanAp_MT',
  'MiMatKetMac_MT',
  'GiacMac_MT',
  'TienPhongMongMat_MT',
  'ThuyTinhThe_MT',
  'DayMat_MT',
] as const

export const TicketAttributeKeyOptometryList = [
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

  'KhucXaMay_MP_Cau',
  'KhucXaMay_MP_Loan',
  'KhucXaMay_MP_TrucLoan',
  'KhucXaMay_MT_Cau',
  'KhucXaMay_MT_Loan',
  'KhucXaMay_MT_TrucLoan',
  'KhucXaMay_KhoangCachDongTu',

  'KhucXaKinhCu_MP_KhongKinh',
  'KhucXaKinhCu_MP_Cau',
  'KhucXaKinhCu_MP_Tru',
  'KhucXaKinhCu_MP_Truc',
  'KhucXaKinhCu_MP_CoKinh',
  'KhucXaKinhCu_MT_KhongKinh',
  'KhucXaKinhCu_MT_Cau',
  'KhucXaKinhCu_MT_Tru',
  'KhucXaKinhCu_MT_Truc',
  'KhucXaKinhCu_MT_CoKinh',
  'KhucXaKinhCu_Note',

  'KhucXaNhinXa_MP_KhongKinh',
  'KhucXaNhinXa_MP_Cau',
  'KhucXaNhinXa_MP_Tru',
  'KhucXaNhinXa_MP_Truc',
  'KhucXaNhinXa_MP_CoKinh',
  'KhucXaNhinXa_MT_KhongKinh',
  'KhucXaNhinXa_MT_Cau',
  'KhucXaNhinXa_MT_Tru',
  'KhucXaNhinXa_MT_Truc',
  'KhucXaNhinXa_MT_CoKinh',
  'KhucXaNhinXa_Note',

  'KhucXaNhinGan_MP_KhongKinh',
  'KhucXaNhinGan_MP_Cau',
  'KhucXaNhinGan_MP_Tru',
  'KhucXaNhinGan_MP_Truc',
  'KhucXaNhinGan_MP_CoKinh',
  'KhucXaNhinGan_MT_KhongKinh',
  'KhucXaNhinGan_MT_Cau',
  'KhucXaNhinGan_MT_Tru',
  'KhucXaNhinGan_MT_Truc',
  'KhucXaNhinGan_MT_CoKinh',
  'KhucXaNhinGan_Note',

  'KhucXaSauLietDieuTiet_MP_KhongKinh',
  'KhucXaSauLietDieuTiet_MP_Cau',
  'KhucXaSauLietDieuTiet_MP_Tru',
  'KhucXaSauLietDieuTiet_MP_Truc',
  'KhucXaSauLietDieuTiet_MP_CoKinh',
  'KhucXaSauLietDieuTiet_MP_ADD',
  'KhucXaSauLietDieuTiet_MT_KhongKinh',
  'KhucXaSauLietDieuTiet_MT_Cau',
  'KhucXaSauLietDieuTiet_MT_Tru',
  'KhucXaSauLietDieuTiet_MT_Truc',
  'KhucXaSauLietDieuTiet_MT_CoKinh',
  'KhucXaSauLietDieuTiet_MT_ADD',
  'KhucXaSauLietDieuTiet_KhoangCachDongTu',
  'KhucXaSauLietDieuTiet_Note',

  'NhanAp_MP_mmHg',
  'BeDayGiacMac_MP_micrometer',
  'DuongKinhDongTu_MP_millimeter',
  'ChieuDaiTrucNhanCau_MP',
  'BienDoDieuTiet_MP',

  'NhanAp_MT_mmHg',
  'BeDayGiacMac_MT_micrometer',
  'DuongKinhDongTu_MT_millimeter',
  'ChieuDaiTrucNhanCau_MT',
  'BienDoDieuTiet_MT',

  'SoKinhChiDinh_MP_Cau',
  'SoKinhChiDinh_MP_Tru',
  'SoKinhChiDinh_MP_Truc',
  'SoKinhChiDinh_MP_ADD',
  'SoKinhChiDinh_MT_Cau',
  'SoKinhChiDinh_MT_Tru',
  'SoKinhChiDinh_MT_Truc',
  'SoKinhChiDinh_MT_ADD',
  'SoKinhChiDinh_KhoangCachDongTu',
] as const

export const TicketAttributeKeyObstetricList = [
  'reason',
  'healthHistory',
  'body',

  'pulse',
  'temperature',
  'bloodPressure',
  'respiratoryRate',
  'spO2',
  'height',
  'weight',

  'PARA',
  'NgayDauKyKinhCuoi',
  'NgayChuyenPhoi',
  'TuoiPhoi',
  'NgayDuKienSinh',
  'TuoiThai_Tuan',
  'TuoiThai_Ngay',
] as const

export const TicketAttributeKeyAdviceList = ['advice'] as const

export const TicketAttributeKeyOrderList = ['note'] as const

export type TicketAttributeKeyGeneralType = (typeof TicketAttributeKeyGeneralList)[number]
export type TicketAttributeKeyEyeType = (typeof TicketAttributeKeyEyeList)[number]
export type TicketAttributeKeyOptometryType = (typeof TicketAttributeKeyOptometryList)[number]
export type TicketAttributeKeyObstetricType = (typeof TicketAttributeKeyObstetricList)[number]
export type TicketAttributeKeyAdviceType = (typeof TicketAttributeKeyAdviceList)[number]
export type TicketAttributeKeyOrderType = (typeof TicketAttributeKeyOrderList)[number]

export type TicketAttributeKeyType =
  | TicketAttributeKeyGeneralType
  | TicketAttributeKeyEyeType
  | TicketAttributeKeyOptometryType
  | TicketAttributeKeyObstetricType
  | TicketAttributeKeyAdviceType
  | TicketAttributeKeyOrderType

export type TicketAttributeMap = {
  [P in TicketAttributeKeyType]?: any
}
// export type TicketAttributeMap = Partial<Record<TicketAttributeKeyType, any>>
