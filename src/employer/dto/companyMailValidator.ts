import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'UserExists', async: true })
@Injectable()
export class CompanyMailRule implements ValidatorConstraintInterface {
  validate(email: string) {
    try {
      const emailPattern =
        /^[a-zA-Z0-9._%+-]+@(?!gmail\.com)(?!yahoo\.com)(?!hotmail\.com)(?!yahoo\.co\.in)(?!aol\.com)(?!live\.com)(?!outlook\.com)[a-zA-Z0-9_-]+\.[a-zA-Z0-9-.]{2,61}$/;

      return emailPattern.test(email);
    } catch (err) {
      return false;
    }
  }
  defaultMessage(): string {
    return 'Please enter a work mail!';
  }
}

export function isCompanyMail(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'UserExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CompanyMailRule,
    });
  };
}
