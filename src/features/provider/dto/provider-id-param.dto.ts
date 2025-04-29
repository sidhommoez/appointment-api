import { IsUUID } from 'class-validator';

export class ProviderIdParamDto {
    @IsUUID()
    providerId: string;
}
