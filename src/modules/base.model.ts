import { Expose } from 'class-transformer'

export class BaseModel {
	@Expose({ name: 'id', toClassOnly: true })
	id: number
}
