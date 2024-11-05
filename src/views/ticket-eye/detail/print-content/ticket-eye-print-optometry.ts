import { useMeStore } from '../../../../modules/_me/me.store'
import type { Ticket } from '../../../../modules/ticket'
import type { DiagnosisSpecialEye } from '../../../../modules/ticket-eye'
import { DTimer, formatPhone, timeToText } from '../../../../utils'

export const ticketEyePrintOptometry = (
  ticket: Ticket,
  optometry: DiagnosisSpecialEye,
  technicianName: string
) => {
  const meStore = useMeStore()
  return `
  <head>
    <title>&nbsp;</title>
    <style>
      #print-body * {
        all: revert;
        font-family: 'Arial', sans-serif;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        line-height: 26px;
        font-size: 16px;
      }

      #print-body table.information td {
        border: 0;
        vertical-align: top;
      }

      #print-body table.data {
        margin-top: 0.3rem;
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
      }

      #print-body table.data th {
        padding: 0.3rem 0.5rem;
        border: 1px solid #cdcdcd;
      }

      #print-body table.data td {
        padding: 0.3rem 0.5rem;
        border: 1px solid #cdcdcd;
        text-align: center
      }
    </style>
  </head>
  <body>
    <div id="print-body" style="width: 760px; background-color: white; padding: 10px">
      <div>
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <p>${meStore.organization.name} </p>
              <p>${meStore.organization.phone} </p>
            </td>
            <td style="width: 50%; text-align:right">
              <p>Mã KH: C${ticket.customerId}  </p>
              <p>Mã Phiếu: T${ticket.id} </p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; font-size: 1.6rem; font-weight: bold; line-height: 2.5; text-transform: uppercase;">
          KẾT QUẢ ĐO THỊ LỰC
        </div>

        <table class="information">
          <tr>
            <td> Họ tên </td>
            <td style="padding-right: 10px">:</td>
            <td> ${ticket.customer?.fullName} </td>
            <td style="white-space: no-wrap; padding-left: 48px;">
              - Ngày sinh: ${timeToText(ticket.customer?.birthday, 'DD/MM/YYYY')}
            </td>
          </tr>
          <tr>
            <td> SĐT </td>
            <td>:</td>
            <td> ${formatPhone(ticket.customer!.phone!)} </td>
            <td style="white-space: no-wrap; padding-left: 48px;">
              - Giới tính: ${
                ticket.customer?.gender === 1 ? 'Nam' : ticket.customer?.gender === 0 ? 'Nữ' : ''
              }
            </td>
          </tr>
          <tr>
            <td> Địa chỉ </td>
            <td>:</td>
            <td colspan="2"> ${ticket.customer?.addressString} </td>
          </tr>
          <tr>
            <td style="width: 100px;"> Chẩn đoán </td>
            <td>:</td>  
            <td colspan="2"> ${ticket.ticketDiagnosis?.diagnosis} </td>
          </tr>
        </table>

        <div style="margin-top: 1rem">
          <div style="font-style: italic">Khúc xạ kính cũ:</div>
          <table class="data">
            <thead>
              <tr>
                <th style="width: 100px"></th>
                <th>Không kính</th>
                <th>Cầu</th>
                <th>Trụ</th>
                <th>Trục</th>
                <th>Có kính</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center">MP</td>
                <td>${optometry.KhucXaKinhCu_MP_KhongKinh || ''}</td>
                <td>${optometry.KhucXaKinhCu_MP_Cau || ''}</td>
                <td>${optometry.KhucXaKinhCu_MP_Tru || ''}</td>
                <td>${optometry.KhucXaKinhCu_MP_Truc || ''}</td>
                <td>${optometry.KhucXaKinhCu_MP_CoKinh || ''}</td>
              </tr>
              <tr>
                <td style="text-align: center">MT</td>
                <td>${optometry.KhucXaKinhCu_MT_KhongKinh || ''}</td>
                <td>${optometry.KhucXaKinhCu_MT_Cau || ''}</td>
                <td>${optometry.KhucXaKinhCu_MT_Tru || ''}</td>
                <td>${optometry.KhucXaKinhCu_MT_Truc || ''}</td>
                <td>${optometry.KhucXaKinhCu_MT_CoKinh || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 1rem">
          <div style="font-style: italic">Khúc xạ nhìn xa:</div>
          <table class="data">
            <thead>
              <tr>
                <th style="width: 100px"></th>
                <th>Không kính</th>
                <th>Cầu</th>
                <th>Trụ</th>
                <th>Trục</th>
                <th>Có kính</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center">MP</td>
                <td>${optometry.KhucXaNhinXa_MP_KhongKinh || ''}</td>
                <td>${optometry.KhucXaNhinXa_MP_Cau || ''}</td>
                <td>${optometry.KhucXaNhinXa_MP_Tru || ''}</td>
                <td>${optometry.KhucXaNhinXa_MP_Truc || ''}</td>
                <td>${optometry.KhucXaNhinXa_MP_CoKinh || ''}</td>
              </tr>
              <tr>
                <td style="text-align: center">MT</td>
                <td>${optometry.KhucXaNhinXa_MT_KhongKinh || ''}</td>
                <td>${optometry.KhucXaNhinXa_MT_Cau || ''}</td>
                <td>${optometry.KhucXaNhinXa_MT_Tru || ''}</td>
                <td>${optometry.KhucXaNhinXa_MT_Truc || ''}</td>
                <td>${optometry.KhucXaNhinXa_MT_CoKinh || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 1rem">
          <div style="font-style: italic">Khúc xạ nhìn gần:</div>
          <table class="data">
            <thead>
              <tr>
                <th style="width: 100px"></th>
                <th>Không kính</th>
                <th>Cầu</th>
                <th>Trụ</th>
                <th>Trục</th>
                <th>Có kính</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center">MP</td>
                <td>${optometry.KhucXaNhinGan_MP_KhongKinh || ''}</td>
                <td>${optometry.KhucXaNhinGan_MP_Cau || ''}</td>
                <td>${optometry.KhucXaNhinGan_MP_Tru || ''}</td>
                <td>${optometry.KhucXaNhinGan_MP_Truc || ''}</td>
                <td>${optometry.KhucXaNhinGan_MP_CoKinh || ''}</td>
              </tr>
              <tr>
                <td style="text-align: center">MT</td>
                <td>${optometry.KhucXaNhinGan_MT_KhongKinh || ''}</td>
                <td>${optometry.KhucXaNhinGan_MT_Cau || ''}</td>
                <td>${optometry.KhucXaNhinGan_MT_Tru || ''}</td>
                <td>${optometry.KhucXaNhinGan_MT_Truc || ''}</td>
                <td>${optometry.KhucXaNhinGan_MT_CoKinh || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 1rem">
          <div style="font-style: italic">Số kính chỉ định:</div>
          <table class="data">
            <thead>
              <tr>
                <th style="width: 100px"></th>
                <th>Cầu</th>
                <th>Trụ</th>
                <th>Trục</th>
                <th>ADD</th>
                <th>KCDT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center">MP</td>
                <td>${optometry.SoKinhChiDinh_MP_Cau || ''}</td>
                <td>${optometry.SoKinhChiDinh_MP_Tru || ''}</td>
                <td>${optometry.SoKinhChiDinh_MP_Truc || ''}</td>
                <td>${optometry.SoKinhChiDinh_MP_ADD || ''}</td>
                <td rowspan="2">${optometry.SoKinhChiDinh_KhoangCachDongTu || ''}</td>
              </tr>
              <tr>
                <td style="text-align: center">MT</td>
                <td>${optometry.SoKinhChiDinh_MT_Cau || ''}</td>
                <td>${optometry.SoKinhChiDinh_MT_Tru || ''}</td>
                <td>${optometry.SoKinhChiDinh_MT_Truc || ''}</td>
                <td>${optometry.SoKinhChiDinh_MT_ADD || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <table style="width: 100%; margin-top: 0.5rem">
          <tr>
            <td style="width: 60%;">
            </td>
            <td style="width: 40%; text-align: center; vertical-align: top;">
              <div style="font-style: italic; font-size: 0.9rem;"> 
                ${DTimer.timeToText(ticket.startedAt, 'Ngày DD tháng MM năm YYYY')}
               </div>
              <div> Kỹ thuật viên </div>
              <div style="margin-top: 100px">
                ${technicianName}
              </div>
            </td>
          </tr>
        </table>
      </div> 
    </div>
  </body>
  `
}
