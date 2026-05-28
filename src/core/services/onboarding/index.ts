import { Types } from 'mongoose';
import { PatientRepository } from '../../repositories/PatientRepository';
import { PharmacistRepository } from '../../repositories/PharmacistRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { SettingRepository } from '../../repositories/SettingRepository';

export interface OnboardingStatus {
  allComplete: boolean;
  steps: {
    profileComplete: boolean;
    firstPharmacistAdded: boolean;
    formBuilt: boolean;
    firstPatientAdded: boolean;
  };
}

export class OnboardingService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly pharmacistRepo: PharmacistRepository,
    private readonly userRepo: UserRepository,
    private readonly settingRepo: SettingRepository
  ) {}

  async getStatus(userId: string): Promise<OnboardingStatus> {
    const objectId = new Types.ObjectId(userId);
    const [patientCount, pharmacistCount, user, setting] = await Promise.all([
      this.patientRepo.countDocuments({ userId: objectId }),
      this.pharmacistRepo.countDocuments({ userId: objectId }),
      this.userRepo.findOne({ _id: objectId }),
      this.settingRepo.findOne({ userId: objectId })
    ]);

    const steps = {
      profileComplete: !!(user?.companyName && user?.phoneNumber),
      firstPharmacistAdded: pharmacistCount > 0,
      formBuilt: !!(setting?.formConfig?.schema && Object.keys(setting.formConfig.schema).length > 0),
      firstPatientAdded: patientCount > 0
    };

    return { allComplete: Object.values(steps).every(Boolean), steps };
  }
}
