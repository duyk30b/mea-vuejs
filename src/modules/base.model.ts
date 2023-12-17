import { Expose, Transform } from 'class-transformer'

export class BaseModel {
  @Expose({ name: 'id', toClassOnly: true })
  @Transform(({ value, type }) => value || 0)
  id: number
}
