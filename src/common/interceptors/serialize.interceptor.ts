import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) return data;
        const isArrayDto = Array.isArray(this.dto);
        const dtoClass = isArrayDto ? this.dto[0] : this.dto;
        return plainToInstance(dtoClass, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
