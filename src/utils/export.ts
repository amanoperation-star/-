import { Issue } from '../types';

export function exportTicketsToCSV(issues: Issue[], filename?: string) {
  if (issues.length === 0) {
    alert('لا توجد بيانات لتصديرها!');
    return;
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Arabic support
  csvContent += 'كود المشكلة,اسم العميل,البريد الإلكتروني,الوسم,نوع المشكلة,الوصف,الفريق المستلم,المسؤول الحالي,الأولوية,الحالة,وقت العمل (دقائق),تقييم CSAT,تاريخ الإنشاء,موعد SLA\n';

  issues.forEach((item) => {
    const workMin = Math.round((item.workTime || 0) / 60);
    const row = [
      `"${item.id}"`,
      `"${(item.client || '').replace(/"/g, '""')}"`,
      `"${(item.clientEmail || '').replace(/"/g, '""')}"`,
      `"${(item.tag || '').replace(/"/g, '""')}"`,
      `"${(item.type || '').replace(/"/g, '""')}"`,
      `"${(item.desc || '').replace(/"/g, '""')}"`,
      `"${(item.assigned || '').replace(/"/g, '""')}"`,
      `"${(item.owner || '').replace(/"/g, '""')}"`,
      `"${item.priority}"`,
      `"${item.status}"`,
      `"${workMin}"`,
      `"${item.csat || 5}"`,
      `"${item.createdAt}"`,
      `"${item.dueDate}"`,
    ];
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `Enterprise_Tickets_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTicketsToJSON(issues: Issue[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(issues, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `Enterprise_Tickets_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
