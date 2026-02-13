export type RamadanStatus = 'fasting' | 'witnessing' | 'hidden' | 'unset';
export type RamadanMode = 'fasting' | 'witnessing' | 'disabled';

export type RamadanMethod = 'MWL' | 'ISNA' | 'Egypt' | 'UmmAlQura' | 'Karachi';
export type HighLatitudeRule = 'SeventhOfNight' | 'MiddleOfNight' | 'AngleBased';

export interface RamadanLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  tz?: string;
  source: 'device' | 'manual';
  updatedAt: number;
}

export interface RamadanConfig {
  status: RamadanStatus;
  method?: RamadanMethod;
  highLatitudeRule?: HighLatitudeRule;
  location?: RamadanLocation;
  cityId?: string;
  quietHours?: boolean;
  updatedAt?: number;
  dismissedAt?: number;
}

export interface RamadanProfileConfig {
  status: RamadanStatus;
  mode: RamadanMode;
  method?: RamadanMethod;
  highLatitudeRule?: HighLatitudeRule;
  city?: string;
  tz?: string;
  quietHours?: boolean;
  updatedAt?: number;
}

export interface RamadanTimings {
  date: string;
  suhoor: Date;
  iftar: Date;
  method: RamadanMethod;
  highLatitudeRule: HighLatitudeRule;
}
