export type ProductType = 'online' | 'download';
export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  description: string;
  version?: string;
  imageUrl?: string;
  status: ProductStatus;
  durationDays?: number;
  appUrl?: string;
  telegramFileId?: string;
  telegramMessageId?: string;
  createdAt: string;
  updatedAt: string;
}
