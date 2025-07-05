export interface SubBankResponse {
  _id: string;
  name: string;
  parent_id?: string;
  sub_banks?: SubBankResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BankResponse {
  _id: string;
  bank_name: string;
  exam_id: string;
  sub_banks?: SubBankResponse[];
  createdAt?: string;
  updatedAt?: string;
}
