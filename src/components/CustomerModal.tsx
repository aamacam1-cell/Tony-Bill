import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Building2,
  CreditCard,
  MapPin,
  Tag,
  Percent,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { CustomerProfile, VatMode } from '../types';
import {
  saveOrUpdateCustomerProfile,
  deleteCustomerProfile,
  getVatModeLabel,
} from '../utils/customerDb';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerProfile[];
  onCustomersUpdated: (customers: CustomerProfile[]) => void;
  onSelectCustomer: (customer: CustomerProfile) => void;
  activeCustomerId?: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  onCustomersUpdated,
  onSelectCustomer,
  activeCustomerId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form fields
  const [alias, setAlias] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [branch, setBranch] = useState('สำนักงานใหญ่');
  const [vatType, setVatType] = useState<VatMode>('ADD_VAT');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      c.taxId.includes(searchTerm)
  );

  const resetForm = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setAlias('');
    setCompanyName('');
    setContact('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setBranch('สำนักงานใหญ่');
    setVatType('ADD_VAT');
    setError(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAddingNew(true);
  };

  const handleStartEdit = (c: CustomerProfile) => {
    setEditingId(c.id);
    setIsAddingNew(false);
    setAlias(c.alias);
    setCompanyName(c.companyName);
    setContact(c.contact || '');
    setPhone(c.phone || '');
    setAddress(c.address);
    setTaxId(c.taxId);
    setBranch(c.branch || 'สำนักงานใหญ่');
    setVatType(c.vatType);
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      setError('กรุณาระบุ "ชื่อเรียก" (ดัชนีสำหรับเลือก)');
      return;
    }
    if (!companyName.trim()) {
      setError('กรุณาระบุ "ชื่อบริษัท"');
      return;
    }

    const { profiles, savedId } = saveOrUpdateCustomerProfile({
      id: editingId || undefined,
      alias: alias.trim(),
      companyName: companyName.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      address: address.trim(),
      taxId: taxId.trim(),
      branch: branch.trim() || 'สำนักงานใหญ่',
      vatType,
    });

    onCustomersUpdated(profiles);
    const savedCustomer = profiles.find((p) => p.id === savedId);
    if (savedCustomer) {
      onSelectCustomer(savedCustomer);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = deleteCustomerProfile(id);
    onCustomersUpdated(updated);
    if (editingId === id) {
      resetForm();
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold">ฐานข้อมูลลูกค้า (Customer Database)</h2>
            <span className="text-[11px] bg-orange-600/90 text-white px-2 py-0.5 rounded font-mono">
              {customers.length} รายการ
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Top Actions: Search + Add New Button */}
          {!isAddingNew && !editingId && (
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาด้วยชื่อเรียก, ชื่อบริษัท, เลขผู้เสียภาษี..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleStartAdd}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มลูกค้าใหม่ในฐานข้อมูล</span>
              </button>
            </div>
          )}

          {/* Form when adding or editing */}
          {(isAddingNew || editingId) && (
            <form onSubmit={handleSave} className="bg-orange-50/40 rounded-xl p-4 border border-orange-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-orange-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span>{editingId ? 'แก้ไขข้อมูลลูกค้า' : 'บันทึกลูกค้าใหม่ลงฐานข้อมูล'}</span>
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  ยกเลิก
                </button>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. ชื่อเรียก (ดัชนี) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อเรียก (ดัชนีสำหรับเลือกหัวบิล) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="เช่น สยามฟู้ดส์, ซีพี ออลล์, มิตรภาพการค้า"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none font-semibold text-orange-700"
                  />
                  <span className="text-[10px] text-slate-500">
                    ชื่อสั้นๆ ที่จะแสดงในรายการ Dropdown เพื่อเลือกได้รวดเร็ว
                  </span>
                </div>

                {/* 2. ชื่อบริษัท */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อบริษัท / ห้างร้าน / นามบุคคล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="เช่น บริษัท สยาม ฟู้ดส์ แอนด์ เบเวอเรจ จำกัด"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* 3. ผู้ติดต่อ */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ผู้ติดต่อ / แผนก (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="เช่น คุณวิภาวรรณ (ฝ่ายจัดซื้อ)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* 4. เบอร์โทรศัพท์ลูกค้า */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-orange-600" />
                    <span>เบอร์โทรศัพท์ลูกค้า</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 02-123-4567, 081-234-5678"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* 5. เลขประจำตัวผู้เสียภาษี */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ''))}
                    placeholder="เช่น 0105558091234"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono tracking-wider focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* 6. สำนักงานใหญ่ / สาขา */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    สำนักงานใหญ่ / รหัสสาขา
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* 7. ประเภท VAT (3 รูปแบบ) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-orange-600" />
                    <span>ประเภท VAT ของลูกค้า</span>
                  </label>
                  <select
                    value={vatType}
                    onChange={(e) => setVatType(e.target.value as VatMode)}
                    className="w-full px-2.5 py-1.5 bg-white border border-orange-300 rounded-md font-medium text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="NO_VAT">1. ไม่คิด VAT (แสดง 0.00 ยอดตรงๆ)</option>
                    <option value="ADD_VAT">2. +VAT (ราคาในตารางยังไม่รวมภาษี +7%)</option>
                    <option value="INC_VAT">3. -VAT (ราคาในตารางรวมภาษีแล้ว ถอด 7%)</option>
                  </select>
                </div>

                {/* 7. ที่อยู่ (เต็มแถว) */}
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    ที่อยู่ (เลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์)
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="เช่น 142/5 ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ 10120"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-orange-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-xs transition-colors"
                >
                  {editingId ? 'บันทึกการแก้ไข' : 'บันทึกลงฐานข้อมูล'}
                </button>
              </div>
            </form>
          )}

          {/* Customer list table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">ชื่อเรียก (ดัชนี)</th>
                  <th className="py-2 px-3">ชื่อบริษัท & ที่อยู่</th>
                  <th className="py-2 px-3">เลขประจำตัวผู้เสียภาษี</th>
                  <th className="py-2 px-3">ประเภท VAT</th>
                  <th className="py-2 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลลูกค้า (กดปุ่ม "เพิ่มลูกค้าใหม่" ด้านบนเพื่อบันทึก)
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = cust.id === activeCustomerId;
                    return (
                      <tr
                        key={cust.id}
                        className={`hover:bg-orange-50/40 transition-colors ${
                          isSelected ? 'bg-orange-50/70 font-medium' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                              {cust.alias}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                (กำลังใช้)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{cust.companyName}</div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                            {cust.contact && (
                              <span>ติดต่อ: <strong className="text-slate-700">{cust.contact}</strong></span>
                            )}
                            {cust.phone && (
                              <span className="flex items-center gap-0.5 text-slate-600">
                                <Phone className="w-2.5 h-2.5 text-orange-600" />
                                <span>{cust.phone}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={cust.address}>
                            {cust.address}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-mono text-slate-700">
                            {cust.taxId || '-'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            สาขา: {cust.branch || 'สำนักงานใหญ่'}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                              cust.vatType === 'NO_VAT'
                                ? 'bg-slate-100 text-slate-700'
                                : cust.vatType === 'ADD_VAT'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {getVatModeLabel(cust.vatType)}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {confirmDeleteId === cust.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 shadow-2xs">
                              <span className="text-[10px] text-red-700 font-bold whitespace-nowrap">ลบ?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(cust.id)}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                title="ยืนยันการลบออกจากฐานข้อมูล"
                              >
                                ยืนยัน
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] cursor-pointer transition-colors"
                                title="ยกเลิก"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectCustomer(cust);
                                  onClose();
                                }}
                                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                                title="เลือกใส่ในหัวบิลทันที"
                              >
                                เลือก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(cust)}
                                className="p-1 text-slate-500 hover:text-orange-600 rounded transition-colors cursor-pointer"
                                title="แก้ไขข้อมูล"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(cust.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="ลบออกจากฐานข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            💾 ข้อมูลถูกจัดเก็บอย่างปลอดภัยใน Local Storage ของบราวเซอร์ในเครื่องนี้
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
