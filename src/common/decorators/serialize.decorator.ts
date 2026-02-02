import { UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from '../interceptors/serialize.interceptor';

export const Serialize = (dto: any) => UseInterceptors(new SerializeInterceptor(dto));
