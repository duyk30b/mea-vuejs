import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'

export class Diagnosis {
    @Expose({ name: 'id', toClassOnly: true })
    id?: number

    @Expose({ name: 'arrival_id' })
    arrivalId?: number

    @Expose({ name: 'reason' })
    reason?: string                               // Lý do vào khám

    @Expose({ name: 'summary' })
    summary?: string                              // Tóm tăt bệnh án

    @Expose({ name: 'diagnosis' })
    diagnosis?: string                            // Chẩn đoán

    @Expose({ name: 'pulse' })
    pulse?: number                                // Mạch

    @Expose({ name: 'temperature' })
    temperature?: number                          // Nhiệt độ

    @Expose({ name: 'blood_pressure' })
    bloodPressure?: string                        // Huyết áp

    @Expose({ name: 'respiratory_rate' })
    respiratoryRate?: number                      // Nhịp thở

    @Expose({ name: 'spo2' })
    spO2?: number                                 // sp02

    @Expose({ name: 'height' })
    height?: number                               // Chiều cao

    @Expose({ name: 'weight' })
    weight?: number                               // Cân nặng

    @Expose({ name: 'note' })
    note?: string                                 // Ghi chú

    static blank(): Diagnosis {
        return new Diagnosis()
    }

    static fromPlain(plain: Record<string, any>): Diagnosis {
        return plainToInstance(Diagnosis, plain, {
            exposeUnsetFields: false,
            excludeExtraneousValues: true,
        })
    }

    static toPlain(instance: Diagnosis): Record<string, any> {
        return instanceToPlain(instance, {
            exposeUnsetFields: false,
            excludeExtraneousValues: true,
        })
    }

    static fromInstance(instance: Diagnosis): Diagnosis {
        const result = new Diagnosis()
        Object.assign(result, instance)
        return result
    }
}
