export interface CapabilityItem {
  code: string;
  grammar: string;
  category: string;
  name: string;
  desc: string;
  example: string;
  keywords?: string;
  enabled?: boolean;
}

export interface CapabilityDatabase {
  SN: CapabilityItem[];
  MP: CapabilityItem[];
  PJ: CapabilityItem[];
  SP: CapabilityItem[];
}
