export interface Supervisor {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: "Nam" | "Nữ";
  dob: string;
  address: string;
  department: string;
  assignedRoom: string | null; // room name like "Phòng 101"
}

export const supervisors: Supervisor[] = [
  { id: 1, name: "Nguyễn Văn A", email: "a.nguyen@school.edu.vn", phone: "0901234567", gender: "Nam", dob: "1985-03-12", address: "Hà Nội", department: "Khoa Toán", assignedRoom: "Phòng 101" },
  { id: 2, name: "Trần Thị B", email: "b.tran@school.edu.vn", phone: "0911234567", gender: "Nữ", dob: "1988-07-20", address: "Hà Nội", department: "Khoa Văn", assignedRoom: "Phòng 102" },
  { id: 3, name: "Lê Văn C", email: "c.le@school.edu.vn", phone: "0921234567", gender: "Nam", dob: "1982-11-05", address: "Hải Phòng", department: "Khoa Lý", assignedRoom: "Phòng 103" },
  { id: 4, name: "Phạm Thị D", email: "d.pham@school.edu.vn", phone: "0931234567", gender: "Nữ", dob: "1990-01-30", address: "Đà Nẵng", department: "Khoa Hóa", assignedRoom: "Phòng 104" },
  { id: 5, name: "Hoàng Văn E", email: "e.hoang@school.edu.vn", phone: "0941234567", gender: "Nam", dob: "1986-05-18", address: "Hà Nội", department: "Khoa Anh", assignedRoom: null },
  { id: 6, name: "Đỗ Thị F", email: "f.do@school.edu.vn", phone: "0951234567", gender: "Nữ", dob: "1992-09-09", address: "TP.HCM", department: "Khoa Sinh", assignedRoom: null },
];
