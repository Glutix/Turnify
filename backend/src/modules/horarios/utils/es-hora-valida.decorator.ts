import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

// Valida strings de hora en formato HH:mm (24hs), que es como el front
// manda los campos Time de Prisma (ej. "09:00", "18:30").
export function EsHoraValida(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "esHoraValida",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== "string") return false;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato HH:mm (ej. "09:00")`;
        },
      },
    });
  };
}