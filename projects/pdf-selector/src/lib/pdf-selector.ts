export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextSelection {
  document: string;
  pageIndex: number;
  text: string;
  boundingBox: BoundingBox;
}

export interface LimitedSelectionEvent {
  isLimited: boolean;
  pageIndex: number;
}

export interface PdfDocument {
  url: string;
  name: string;
}
