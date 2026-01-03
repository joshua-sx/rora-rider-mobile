export interface Driver {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  onDuty: boolean;
  vehicleType: string;
  vehicleModel: string;
  licensePlate: string;
  profileImage?: string;
  phone: string;
  email: string;
  bio: string;
  yearsExperience: number;
  languages: string[];
}

