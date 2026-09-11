import { CustomerProfile, VatMode } from '../types';

const CUSTOMER_STORAGE_KEY = 'tk_invoice_customer_profiles_v1';

export const DEFAULT_CUSTOMER_PROFILES: CustomerProfile[] = [
  {
    id: 'cust-1',
    alias: 'สยามฟู้ดส์',
    companyName: 'บริษัท สยาม ฟู้ดส์ แอนด์ เบเวอเรจ จำกัด',
    contact: 'คุณวิภาวรรณ ศิริชัยพาณิชย์ (แผนกจัดซื้อ)',
    phone: '02-678-9000, 081-999-8888',
    address: '142/5 ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ 10120',
    taxId: '0105558091234',
    branch: 'สำนักงานใหญ่',
    vatType: 'ADD_VAT', // +VAT
  },
  {
    id: 'cust-2',
    alias: 'ซีพี ออลล์',
    companyName: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    contact: 'คุณเกรียงศักดิ์ (ฝ่ายพัสดุ)',
    phone: '02-071-9000',
    address: '313 อาคาร ซี.พี.ทาวเวอร์ ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500',
    taxId: '0107542000011',
    branch: '00024',
    vatType: 'INC_VAT', // -VAT
  },
  {
    id: 'cust-3',
    alias: 'สหการเกษตร',
    companyName: 'ห้างหุ้นส่วนจำกัด สหการเกษตรไทย',
    contact: 'คุณกิตติศักดิ์ โชคไพศาล',
    phone: '035-901-234, 089-555-1234',
    address: '99 หมู่ 3 ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    taxId: '0133549001289',
    branch: 'สำนักงานใหญ่',
    vatType: 'NO_VAT', // ไม่คิด VAT
  },
];

export function getVatModeLabel(vat: VatMode): string {
  switch (vat) {
    case 'NO_VAT':
      return 'ไม่คิด VAT (0.00)';
    case 'ADD_VAT':
      return '+VAT (แยกภาษี 7%)';
    case 'INC_VAT':
      return '-VAT (รวมภาษี 7%)';
    default:
      return '';
  }
}

export function loadCustomerProfiles(): CustomerProfile[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => {
          const matchDefault = DEFAULT_CUSTOMER_PROFILES.find((d) => d.id === p.id);
          return {
            ...p,
            phone: p.phone || matchDefault?.phone || '',
          };
        });
      }
    }
  } catch (err) {
    console.error('Failed to load customers from localStorage', err);
  }
  // Initialize with defaults if empty
  saveAllCustomerProfiles(DEFAULT_CUSTOMER_PROFILES);
  return DEFAULT_CUSTOMER_PROFILES;
}

export function saveAllCustomerProfiles(profiles: CustomerProfile[]): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save customers to localStorage', err);
  }
}

export function saveOrUpdateCustomerProfile(profile: Omit<CustomerProfile, 'id'> & { id?: string }): {
  profiles: CustomerProfile[];
  savedId: string;
} {
  const current = loadCustomerProfiles();
  const id = profile.id || `cust-${Date.now()}`;
  const record: CustomerProfile = {
    ...profile,
    id,
  };

  const existingIndex = current.findIndex((c) => c.id === id);
  let updated: CustomerProfile[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = record;
  } else {
    updated = [record, ...current];
  }

  saveAllCustomerProfiles(updated);
  return { profiles: updated, savedId: id };
}

export function deleteCustomerProfile(id: string): CustomerProfile[] {
  const current = loadCustomerProfiles();
  const filtered = current.filter((c) => c.id !== id);
  saveAllCustomerProfiles(filtered);
  return filtered;
}
